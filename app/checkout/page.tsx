'use client';

import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/data';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useCallback } from 'react';
import { Loader2, Award, QrCode, CreditCard, Barcode, Lock } from 'lucide-react';

export default function CheckoutPage() {
  const { cartItems: items, subtotal } = useCart();
  const [step, setStep] = useState(1);

  const [cep, setCep] = useState('');
  const [addressData, setAddressData] = useState({ street: '', neighborhood: '', city: '', state: '' });
  const [shippingOptions, setShippingOptions] = useState<any[]>([]);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingError, setShippingError] = useState<string | null>(null);
  const [selectedShipping, setSelectedShipping] = useState<any | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // ─────────────────────────────────────────────────
  // ViaCEP: Preencher endereço automaticamente
  // ─────────────────────────────────────────────────
  const fetchAddressByCep = useCallback(async (cepValue: string) => {
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cepValue}/json/`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.erro) return;
      setAddressData({
        street: data.logradouro ?? '',
        neighborhood: data.bairro ?? '',
        city: data.localidade ?? '',
        state: data.uf ?? '',
      });
    } catch {
      // Silencioso — campos ficam editáveis
    }
  }, []);

  const handleCepChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 8) value = value.slice(0, 8);

    const formattedCep = value.length > 5 ? value.replace(/^(\d{5})(\d{1,3})/, '$1-$2') : value;
    setCep(formattedCep);

    if (value.length === 8) {
      setShippingLoading(true);
      setShippingError(null);

      // Buscar endereço via ViaCEP
      await fetchAddressByCep(value);

      // Calcular frete
      const cartWeight = items.reduce((acc, item) => acc + (Number(item.weight) || 1) * item.quantity, 0);

      try {
        const response = await fetch('/api/shipping', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cepDestino: value, weight: cartWeight, width: 15, height: 5, length: 20 }),
        });
        const data = await response.json();
        if (response.ok && Array.isArray(data)) {
          setShippingOptions(data);
          if (data.length > 0) setSelectedShipping(data[0]);
        } else {
          setShippingError(data.error || 'Erro ao calcular frete');
        }
      } catch {
        setShippingError('Erro de conexão ao calcular frete');
      } finally {
        setShippingLoading(false);
      }
    } else {
      setShippingOptions([]);
      setSelectedShipping(null);
      setAddressData({ street: '', neighborhood: '', city: '', state: '' });
    }
  }, [items, fetchAddressByCep]);

  // ─────────────────────────────────────────────────
  // Submit — NÃO limpar carrinho aqui
  // O carrinho é limpo apenas na página de sucesso
  // após confirmação do pagamento
  // ─────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedShipping) {
      alert('Selecione uma opção de frete!');
      return;
    }

    setIsProcessing(true);

    try {
      const formData = new FormData(e.currentTarget);
      const customer = {
        name: formData.get('name') as string,
        email: formData.get('email') as string,
        phone: formData.get('phone') as string,
      };

      const shippingAddress = {
        cep: cep.replace(/\D/g, ''),
        street: (formData.get('street') as string) || addressData.street,
        number: formData.get('number') as string,
        complement: (formData.get('complement') as string) || '',
        neighborhood: addressData.neighborhood,
        city: addressData.city,
        state: addressData.state,
      };

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cartItems: items.map((item) => ({
            id: item.id,
            quantity: item.quantity,
            options: item.selectedOptions ?? [],
          })),
          customer,
          shipping: selectedShipping,
          shippingAddress,
        }),
      });

      const data = await response.json();

      if (response.ok && data.checkout_url) {
        // ✅ NÃO limpar carrinho aqui — será limpo na página de sucesso
        // O redirect para InfinitePay — o usuário ainda pode cancelar
        window.location.href = data.checkout_url;
      } else {
        alert(data.error || 'Erro ao processar checkout');
        setIsProcessing(false);
      }
    } catch {
      alert('Erro de conexão. Verifique sua internet e tente novamente.');
      setIsProcessing(false);
    }
  };

  const currentTotal = subtotal;
  const shippingCost = selectedShipping ? Number(selectedShipping.price) : 0;
  const finalTotal = currentTotal + shippingCost;

  if (step === 2) {
    return (
      <div className="w-full min-h-[60vh] flex flex-col items-center justify-center px-6">
        <Award className="text-[#D4AF37] w-16 h-16 mb-6" strokeWidth={1} />
        <h1 className="font-serif text-4xl text-[#D4AF37] mb-6 uppercase tracking-[0.1em] text-center">Pedido Em Produção</h1>
        <p className="font-sans text-[#e5e2e1]/70 max-w-lg text-center mb-10 leading-relaxed font-light">
          Agradecemos pela confiança. Seu pedido foi recebido e você poderá acompanhar o status diretamente conosco.
        </p>
        <Link href="/" className="bg-[#D4AF37] text-black font-sans text-[12px] font-bold px-12 py-4 tracking-[0.2em] uppercase hover:brightness-110 transition-all active:scale-95">
          Explorar Coleção
        </Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="w-full min-h-[60vh] flex flex-col items-center justify-center px-6">
        <h1 className="font-serif text-[32px] text-white mb-6 uppercase tracking-[0.1em]">Seleção Vazia</h1>
        <p className="font-sans text-white/50 mb-10">Você não possui joias selecionadas no momento.</p>
        <Link href="/categoria" className="bg-[#D4AF37] text-black font-sans text-[12px] font-bold px-12 py-4 tracking-[0.2em] uppercase hover:brightness-110 transition-all active:scale-95">
          Explorar Coleção
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full mb-32 max-w-4xl mx-auto px-6 py-12">
      <div className="mb-12 text-center">
        <h1 className="font-serif text-[32px] uppercase tracking-[0.1em] text-white">Finalizar Compra</h1>
        <p className="font-sans text-white/50 mt-2">Design exclusivo. Produção sob encomenda (7 a 15 dias úteis).</p>
      </div>

      <form id="checkout-form" onSubmit={handleSubmit}>
        <section className="space-y-16">

          {/* 01 — INFORMAÇÕES DE CONTATO */}
          <div className="space-y-6">
            <div className="flex items-center gap-4 border-b border-white/10 pb-4">
              <span className="font-serif text-[24px] text-[#D4AF37]">01</span>
              <h2 className="font-sans text-[12px] font-bold tracking-[0.2em] uppercase text-white">INFORMAÇÕES DE CONTATO</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="relative">
                <label className="text-[10px] font-sans font-bold text-[#D4AF37] tracking-widest block mb-2 uppercase">NOME COMPLETO</label>
                <input required name="name" className="w-full bg-transparent border-b border-white/20 py-3 text-white focus:outline-none focus:border-[#D4AF37] transition-colors font-sans" placeholder="Seu nome" type="text" maxLength={100} />
              </div>
              <div className="relative">
                <label className="text-[10px] font-sans font-bold text-[#D4AF37] tracking-widest block mb-2 uppercase">E-MAIL</label>
                <input required name="email" className="w-full bg-transparent border-b border-white/20 py-3 text-white focus:outline-none focus:border-[#D4AF37] transition-colors font-sans" placeholder="nome@exemplo.com" type="email" />
              </div>
              <div className="relative">
                <label className="text-[10px] font-sans font-bold text-[#D4AF37] tracking-widest block mb-2 uppercase">TELEFONE / WHATSAPP</label>
                <input required name="phone" className="w-full bg-transparent border-b border-white/20 py-3 text-white focus:outline-none focus:border-[#D4AF37] transition-colors font-sans" placeholder="(00) 00000-0000" type="tel" />
              </div>
            </div>
          </div>

          {/* 02 — ENDEREÇO DE ENTREGA */}
          <div className="space-y-6">
            <div className="flex items-center gap-4 border-b border-white/10 pb-4">
              <span className="font-serif text-[24px] text-[#D4AF37]">02</span>
              <h2 className="font-sans text-[12px] font-bold tracking-[0.2em] uppercase text-white">ENDEREÇO DE ENTREGA</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* CEP */}
              <div className="md:col-span-1">
                <label className="text-[10px] font-sans font-bold text-[#D4AF37] tracking-widest block mb-2 uppercase">CEP</label>
                <input required name="cep" value={cep} onChange={handleCepChange} className="w-full bg-transparent border-b border-white/20 py-3 text-white focus:outline-none focus:border-[#D4AF37] transition-colors font-sans" placeholder="00000-000" type="text" maxLength={9} />
              </div>

              {/* Endereço — auto-preenchido pelo ViaCEP */}
              <div className="md:col-span-2">
                <label className="text-[10px] font-sans font-bold text-[#D4AF37] tracking-widest block mb-2 uppercase">ENDEREÇO</label>
                <input required name="street" value={addressData.street} onChange={(e) => setAddressData(d => ({ ...d, street: e.target.value }))} className="w-full bg-transparent border-b border-white/20 py-3 text-white focus:outline-none focus:border-[#D4AF37] transition-colors font-sans" placeholder="Rua, Avenida..." type="text" />
              </div>

              {/* Número */}
              <div className="md:col-span-1">
                <label className="text-[10px] font-sans font-bold text-[#D4AF37] tracking-widest block mb-2 uppercase">NÚMERO</label>
                <input required name="number" className="w-full bg-transparent border-b border-white/20 py-3 text-white focus:outline-none focus:border-[#D4AF37] transition-colors font-sans" placeholder="123" type="text" maxLength={20} />
              </div>

              {/* Complemento */}
              <div className="md:col-span-2">
                <label className="text-[10px] font-sans font-bold text-[#D4AF37] tracking-widest block mb-2 uppercase">COMPLEMENTO</label>
                <input name="complement" className="w-full bg-transparent border-b border-white/20 py-3 text-white focus:outline-none focus:border-[#D4AF37] transition-colors font-sans" placeholder="Apto, Bloco..." type="text" maxLength={100} />
              </div>

              {/* Cidade e Estado (readonly — preenchidos pelo ViaCEP) */}
              {addressData.city && (
                <>
                  <div className="md:col-span-2">
                    <label className="text-[10px] font-sans font-bold text-[#D4AF37] tracking-widest block mb-2 uppercase">CIDADE</label>
                    <input readOnly value={addressData.city} className="w-full bg-transparent border-b border-white/10 py-3 text-white/60 font-sans cursor-not-allowed" type="text" />
                  </div>
                  <div className="md:col-span-1">
                    <label className="text-[10px] font-sans font-bold text-[#D4AF37] tracking-widest block mb-2 uppercase">ESTADO</label>
                    <input readOnly value={addressData.state} className="w-full bg-transparent border-b border-white/10 py-3 text-white/60 font-sans cursor-not-allowed" type="text" />
                  </div>
                </>
              )}

              {/* Opções de Frete */}
              <div className="md:col-span-3">
                {shippingLoading && (
                  <div className="flex items-center gap-2 text-[#D4AF37] text-sm mt-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Calculando opções de frete...</span>
                  </div>
                )}
                {shippingError && (
                  <div className="text-red-400 text-sm mt-2">{shippingError}</div>
                )}
                {!shippingLoading && shippingOptions.length > 0 && (
                  <div className="mt-4 space-y-3">
                    <label className="text-[10px] font-sans font-bold text-[#D4AF37] tracking-widest block uppercase">OPÇÕES DE FRETE</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {shippingOptions.map((opt) => (
                        <div
                          key={opt.id}
                          onClick={() => setSelectedShipping(opt)}
                          className={`p-4 border cursor-pointer transition-all ${selectedShipping?.id === opt.id ? 'border-[#D4AF37] bg-[#D4AF37]/5' : 'border-white/10 hover:border-white/30'}`}
                        >
                          <div className="flex justify-between items-center text-sm mb-1">
                            <span className="font-bold text-white uppercase">{opt.name}</span>
                            <span className="text-[#D4AF37] font-bold">{formatPrice(Number(opt.price))}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-white/50 text-xs">Até {opt.delivery_time} dias úteis</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 03 — MÉTODO DE PAGAMENTO */}
          <div className="space-y-6">
            <div className="flex items-center gap-4 border-b border-white/10 pb-4">
              <span className="font-serif text-[24px] text-[#D4AF37]">03</span>
              <h2 className="font-sans text-[12px] font-bold tracking-[0.2em] uppercase text-white">MÉTODO DE PAGAMENTO</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button disabled type="button" className="flex flex-col items-center justify-center gap-4 p-8 border border-[#D4AF37] bg-[#D4AF37]/5 group transition-all duration-400">
                <QrCode className="text-[#D4AF37] w-8 h-8" strokeWidth={1.5} />
                <span className="text-[10px] font-sans font-bold text-white tracking-[0.2em] uppercase">PIX</span>
              </button>
              <button disabled type="button" className="flex flex-col items-center justify-center gap-4 p-8 border border-white/10 transition-all duration-400 opacity-50 cursor-not-allowed">
                <CreditCard className="text-white/50 w-8 h-8" strokeWidth={1.5} />
                <span className="text-[10px] font-sans font-bold text-white/50 tracking-[0.2em] uppercase">CARTÃO</span>
              </button>
              <button disabled type="button" className="flex flex-col items-center justify-center gap-4 p-8 border border-white/10 transition-all duration-400 opacity-50 cursor-not-allowed">
                <Barcode className="text-white/50 w-8 h-8" strokeWidth={1.5} />
                <span className="text-[10px] font-sans font-bold text-white/50 tracking-[0.2em] uppercase">BOLETO</span>
              </button>
            </div>
            <div className="mt-8 p-6 bg-[#1c1b1b] border border-white/5">
              <p className="font-sans text-white/70 text-center italic">Você será redirecionado para gerar o QR Code após confirmar o pedido.</p>
            </div>
          </div>

          {/* RESUMO DO PEDIDO */}
          <div className="bg-[#20201f] border border-white/10 p-8 space-y-6">
            <div className="flex justify-between items-center group">
              <h2 className="font-sans text-[12px] font-bold tracking-[0.2em] uppercase text-white">RESUMO DO PEDIDO ({items.length} ITENS)</h2>
              <Link href="/categoria" className="text-[10px] font-sans text-white/30 group-hover:text-[#D4AF37] uppercase tracking-widest">ALTERAR</Link>
            </div>

            <div className="space-y-4 pt-4 border-t border-white/5">
              {items.map((item) => (
                <div key={item.cartItemId} className="flex gap-4">
                  <div className="w-20 h-24 bg-[#0e0e0e] flex-shrink-0 relative overflow-hidden">
                    <Image
                      src={item.images && item.images.length > 0 ? item.images[0] : 'https://picsum.photos/seed/placeholder/800/1000'}
                      alt={item.name}
                      fill
                      className="object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="flex-grow flex flex-col justify-center">
                    <p className="font-serif text-sm text-white uppercase">{item.name}</p>
                    {item.selectedOptions && item.selectedOptions.length > 0 && (
                      <div className="mt-1 space-y-0.5">
                        {item.selectedOptions.map(opt => (
                          <p key={opt.option_id} className="text-[10px] font-sans text-white/50">
                            <span className="font-bold text-[#D4AF37]/70 uppercase">{opt.option_name}:</span> {opt.value_name}
                          </p>
                        ))}
                      </div>
                    )}
                    <p className="text-[10px] font-sans text-white/40 tracking-wider uppercase mt-1">QTD: {item.quantity}</p>
                    <p className="text-sm font-sans font-bold text-[#D4AF37] uppercase tracking-widest mt-2">
                      {formatPrice((item.promotional_price || item.price) * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2 pt-6 border-t border-white/10">
              <div className="flex justify-between text-sm">
                <span className="text-white/50 font-sans font-bold text-[10px] tracking-widest uppercase">SUBTOTAL</span>
                <span className="font-sans text-white">{formatPrice(currentTotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/50 font-sans font-bold text-[10px] tracking-widest uppercase">
                  FRETE {selectedShipping ? `(${selectedShipping.name})` : ''}
                </span>
                <span className="font-sans text-white">
                  {selectedShipping
                    ? formatPrice(Number(selectedShipping.price))
                    : cep.length === 9
                    ? 'A selecionar'
                    : '-'}
                </span>
              </div>
              <div className="flex justify-between text-xl font-serif pt-4 text-[#D4AF37] items-end">
                <span>TOTAL</span>
                <span className="text-[32px]">{formatPrice(finalTotal)}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Footer fixo de checkout */}
        <footer className="fixed bottom-0 left-0 w-full bg-[#0B0B0B] border-t border-[#D4AF37]/30 h-[88px] z-50 px-6 sm:px-16 flex items-center justify-between shadow-[0_-20px_40px_rgba(0,0,0,0.8)]">
          <div className="hidden md:flex flex-col">
            <span className="text-[10px] font-sans font-bold text-white/50 tracking-widest uppercase">Total a pagar</span>
            <span className="text-[24px] font-serif text-[#D4AF37]">{formatPrice(finalTotal)}</span>
          </div>
          <button
            type="submit"
            disabled={!selectedShipping || isProcessing}
            className="w-full md:w-auto bg-[#D4AF37] text-black font-sans font-bold h-12 px-12 text-[12px] tracking-[0.2em] hover:brightness-110 transition-all active:scale-[0.98] uppercase flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-black" />
                Processando...
              </>
            ) : (
              <>
                Confirmar Pedido
                <Lock className="w-[18px] h-[18px]" strokeWidth={2} />
              </>
            )}
          </button>
        </footer>
      </form>

      {/* Watermark decorativo */}
      <div className="fixed bottom-24 right-6 pointer-events-none opacity-10 hidden xl:block z-0">
        <div className="text-[100px] font-serif text-white/30 leading-none rotate-90 origin-bottom-right uppercase tracking-[0.2em]">
          LUMINAR
        </div>
      </div>
    </div>
  );
}
