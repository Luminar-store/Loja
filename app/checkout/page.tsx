'use client';

import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/data';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, Award, QrCode, CreditCard, Barcode, Lock, Sparkles, PhoneCall, HelpCircle, X, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CheckoutPage() {
  const { cartItems: items, subtotal, clearCart } = useCart();
  const [step, setStep] = useState(1);

  // Estados dos formulários
  const [cep, setCep] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  
  const [addressData, setAddressData] = useState({ street: '', neighborhood: '', city: '', state: '' });
  const [shippingOptions, setShippingOptions] = useState<any[]>([]);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingError, setShippingError] = useState<string | null>(null);
  const [selectedShipping, setSelectedShipping] = useState<any | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'credit_card' | 'pix'>('credit_card');

  // Referência do Timer de Debounce para Abandono de Carrinho (AUD-002)
  const abandonTimerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionIdRef = useRef<string>('');

  // 1. Inicializa o session_id único de visitante na primeira carga
  useEffect(() => {
    let savedSessionId = localStorage.getItem('@luminar:session_id');
    if (!savedSessionId) {
      savedSessionId = `sess_${Math.random().toString(36).substring(2, 15)}`;
      localStorage.setItem('@luminar:session_id', savedSessionId);
    }
    sessionIdRef.current = savedSessionId;
  }, []);

  // 2. Debounce Reativo de Captura de Carrinho Abandonado (Conversão de Leads)
  const triggerCartAbandonment = useCallback(() => {
    if (abandonTimerRef.current) clearTimeout(abandonTimerRef.current);

    abandonTimerRef.current = setTimeout(async () => {
      if (!email && !phone) return; // Só envia se o lead digitar algum canal de contato

      try {
        await fetch('/api/checkout/abandoned', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: sessionIdRef.current,
            email,
            phone,
            name,
            items: items.map(item => ({
              id: item.id,
              quantity: item.quantity,
              price: item.promotional_price || item.price,
              options: item.selectedOptions || []
            }))
          })
        });
      } catch (err) {
        console.error('[CartRecovery] Erro silencioso ao registrar abandono:', err);
      }
    }, 1500); // 1.5 segundos de inatividade de digitação
  }, [email, phone, name, items]);

  // Dispara o abandono toda vez que o lojista altera dados de contato
  useEffect(() => {
    triggerCartAbandonment();
    return () => {
      if (abandonTimerRef.current) clearTimeout(abandonTimerRef.current);
    };
  }, [email, phone, name, triggerCartAbandonment]);

  // 3. ViaCEP: Busca endereço automaticamente
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
      // Silencioso
    }
  }, []);

  // Máscara reativa de CEP
  const handleCepChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 8) value = value.slice(0, 8);

    const formattedCep = value.length > 5 ? value.replace(/^(\d{5})(\d{1,3})/, '$1-$2') : value;
    setCep(formattedCep);

    if (value.length === 8) {
      setShippingLoading(true);
      setShippingError(null);

      await fetchAddressByCep(value);

      const cartWeight = items.reduce((acc, item) => acc + (Number(item.weight) || 0.3) * item.quantity, 0);

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
          setShippingError(data.error || 'Erro ao cotar frete.');
        }
      } catch {
        setShippingError('Erro de conexão ao cotar frete.');
      } finally {
        setShippingLoading(false);
      }
    } else {
      setShippingOptions([]);
      setSelectedShipping(null);
      setAddressData({ street: '', neighborhood: '', city: '', state: '' });
    }
  }, [items, fetchAddressByCep]);

  // Máscara reativa de telefone
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 11) val = val.slice(0, 11);
    
    if (val.length > 6) {
      val = `(${val.slice(0, 2)}) ${val.slice(2, 7)}-${val.slice(7)}`;
    } else if (val.length > 2) {
      val = `(${val.slice(0, 2)}) ${val.slice(2)}`;
    } else if (val.length > 0) {
      val = `(${val}`;
    }
    setPhone(val);
  };

  // Submit - Redirecionamento ao Link Seguro da InfinitePay
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedShipping) {
      toast.error('Selecione um método de frete para continuar!');
      return;
    }

    setIsProcessing(true);

    try {
      const formData = new FormData(e.currentTarget);
      const customer = {
        name,
        email,
        phone,
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
        // Marca o status da recuperação de carrinho local como recovered antes do redirect
        try {
          await fetch('/api/checkout/abandoned', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId: sessionIdRef.current,
              status: 'recovered'
            })
          });
        } catch (_) {}

        // Redireciona de forma transparente para a InfinitePay
        window.location.href = data.checkout_url;
      } else {
        toast.error(data.error || 'Erro ao processar o checkout.');
        setIsProcessing(false);
      }
    } catch {
      toast.error('Erro de rede. Verifique sua conexão e tente novamente.');
      setIsProcessing(false);
    }
  };

  const currentTotal = subtotal;
  const shippingCost = selectedShipping ? Number(selectedShipping.price) : 0;
  const finalTotal = currentTotal + shippingCost;

  if (items.length === 0) {
    return (
      <div className="w-full min-h-[70vh] flex flex-col items-center justify-center px-6 bg-[#090909]">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="w-12 h-12 border border-[#D4AF37]/30 flex items-center justify-center mx-auto mb-6 rounded-none">
            <Sparkles className="text-[#D4AF37] w-5 h-5 animate-pulse" />
          </div>
          <h1 className="font-serif text-2xl text-white uppercase tracking-[0.2em] mb-4">Seleção Vazia</h1>
          <p className="font-sans text-white/50 text-sm mb-8 leading-relaxed">Você não possui nenhuma joia sob encomenda em sua sacola de luxo no momento.</p>
          <Link href="/categoria" className="inline-block bg-[#D4AF37] text-black font-sans text-[10px] font-bold px-10 py-3.5 tracking-[0.22em] uppercase hover:bg-[#ebce67] transition-all rounded-[2px]">
            Explorar Peças
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#080808] text-white pb-32">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 lg:py-20">
        
        {/* Cabeçalho Minimalista Luxury */}
        <div className="mb-12 lg:mb-20 text-center space-y-3">
          <span className="text-[10px] font-sans font-bold tracking-[0.3em] text-[#D4AF37] uppercase">Finalização Segura</span>
          <h1 className="font-serif text-3xl sm:text-4xl uppercase tracking-[0.15em] text-white">Alta Joalheria</h1>
          <div className="w-12 h-[1px] bg-[#D4AF37]/40 mx-auto mt-4"></div>
          <p className="font-sans text-white/40 text-xs mt-2 max-w-2xl mx-auto px-4 leading-relaxed">Peças exclusivas confeccionadas artesanalmente em Ouro 18k sob encomenda (produção artesanal de 7 a 15 dias úteis).</p>
        </div>

        <form onSubmit={handleSubmit} autoComplete="on">
          <div className="flex flex-col-reverse lg:grid lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            
            {/* Bloco de Formulários (Lado Esquerdo) */}
            <div className="lg:col-span-7 w-full space-y-12 sm:space-y-16">
              
              {/* 01 — CONTATO DO CLIENTE */}
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-4 border-b border-white/10 pb-3">
                  <span className="font-serif text-xl text-[#D4AF37] italic">01.</span>
                  <h2 className="font-sans text-[11px] font-bold tracking-[0.25em] uppercase text-white">Contato Exclusivo</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="sm:col-span-2">
                    <label className="text-[9px] font-sans font-bold text-[#D4AF37] tracking-[0.2em] block mb-2 uppercase">Nome Completo</label>
                    <input 
                      required 
                      name="name" 
                      value={name}
                      onChange={e => setName(e.target.value)}
                      autoComplete="name"
                      className="w-full bg-white/[0.02] border border-white/10 h-12 px-4 text-sm text-white focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/30 transition-all duration-300 font-sans rounded-[2px]" 
                      placeholder="Nome para faturamento e laudo" 
                      type="text" 
                      maxLength={100} 
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-sans font-bold text-[#D4AF37] tracking-[0.2em] block mb-2 uppercase">E-mail para Recibo</label>
                    <input 
                      required 
                      name="email" 
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      autoComplete="email"
                      className="w-full bg-white/[0.02] border border-white/10 h-12 px-4 text-sm text-white focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/30 transition-all duration-300 font-sans rounded-[2px]" 
                      placeholder="seuemail@luxo.com" 
                      type="email" 
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-sans font-bold text-[#D4AF37] tracking-[0.2em] block mb-2 uppercase">WhatsApp Concierge</label>
                    <input 
                      required 
                      name="phone" 
                      value={phone}
                      onChange={handlePhoneChange}
                      autoComplete="tel"
                      inputMode="tel"
                      className="w-full bg-white/[0.02] border border-white/10 h-12 px-4 text-sm text-white focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/30 transition-all duration-300 font-sans rounded-[2px]" 
                      placeholder="(00) 00000-0000" 
                      type="tel" 
                    />
                  </div>
                </div>
              </motion.div>

              {/* 02 — ENDEREÇO DE ENVIO */}
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-4 border-b border-white/10 pb-3">
                  <span className="font-serif text-xl text-[#D4AF37] italic">02.</span>
                  <h2 className="font-sans text-[11px] font-bold tracking-[0.25em] uppercase text-white">Local de Entrega</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {/* CEP */}
                  <div className="sm:col-span-1">
                    <label className="text-[9px] font-sans font-bold text-[#D4AF37] tracking-[0.2em] block mb-2 uppercase">CEP</label>
                    <input 
                      required 
                      name="cep" 
                      value={cep} 
                      onChange={handleCepChange} 
                      autoComplete="postal-code"
                      inputMode="numeric"
                      className="w-full bg-white/[0.02] border border-white/10 h-12 px-4 text-sm text-white focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/30 transition-all duration-300 font-sans rounded-[2px]" 
                      placeholder="00000-000" 
                      type="text" 
                      maxLength={9} 
                    />
                  </div>

                  {/* Rua */}
                  <div className="sm:col-span-2">
                    <label className="text-[9px] font-sans font-bold text-[#D4AF37] tracking-[0.2em] block mb-2 uppercase">Logradouro / Endereço</label>
                    <input 
                      required 
                      name="street" 
                      value={addressData.street} 
                      onChange={(e) => setAddressData(d => ({ ...d, street: e.target.value }))} 
                      autoComplete="street-address"
                      className="w-full bg-white/[0.02] border border-white/10 h-12 px-4 text-sm text-white focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/30 transition-all duration-300 font-sans rounded-[2px]" 
                      placeholder="Rua, Avenida, Praça..." 
                      type="text" 
                    />
                  </div>

                  {/* Número */}
                  <div className="sm:col-span-1">
                    <label className="text-[9px] font-sans font-bold text-[#D4AF37] tracking-[0.2em] block mb-2 uppercase">Número</label>
                    <input 
                      required 
                      name="number" 
                      className="w-full bg-white/[0.02] border border-white/10 h-12 px-4 text-sm text-white focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/30 transition-all duration-300 font-sans rounded-[2px]" 
                      placeholder="123" 
                      type="text" 
                      maxLength={20} 
                    />
                  </div>

                  {/* Complemento */}
                  <div className="sm:col-span-2">
                    <label className="text-[9px] font-sans font-bold text-[#D4AF37] tracking-[0.2em] block mb-2 uppercase">Complemento</label>
                    <input 
                      name="complement" 
                      className="w-full bg-white/[0.02] border border-white/10 h-12 px-4 text-sm text-white focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/30 transition-all duration-300 font-sans rounded-[2px]" 
                      placeholder="Apto, Casa, Bloco (Opcional)" 
                      type="text" 
                      maxLength={100} 
                    />
                  </div>

                  {/* Cidade e Estado (ViaCEP Auto) */}
                  {addressData.city && (
                    <div className="sm:col-span-3 grid grid-cols-3 gap-6">
                      <div className="col-span-2">
                        <label className="text-[9px] font-sans font-bold text-[#D4AF37] tracking-[0.2em] block mb-2 uppercase">Cidade</label>
                        <input readOnly value={addressData.city} className="w-full bg-white/[0.02] border border-white/10 h-12 px-4 text-sm text-white/50 cursor-not-allowed outline-none font-sans rounded-[2px]" type="text" />
                      </div>
                      <div className="col-span-1">
                        <label className="text-[9px] font-sans font-bold text-[#D4AF37] tracking-[0.2em] block mb-2 uppercase">Estado</label>
                        <input readOnly value={addressData.state} className="w-full bg-white/[0.02] border border-white/10 h-12 px-4 text-sm text-white/50 cursor-not-allowed outline-none font-sans rounded-[2px]" type="text" />
                      </div>
                    </div>
                  )}

                  {/* Métodos de Entrega (SuperFrete / Fallback R$ 29,90) */}
                  <div className="sm:col-span-3">
                    <AnimatePresence>
                      {shippingLoading && (
                        <div className="space-y-3 mt-4">
                          <label className="text-[9px] font-sans font-bold text-[#D4AF37] tracking-[0.2em] block uppercase">Cotação Segura</label>
                          {/* Skeletons Shimmer Dourados Cinematográficos (AUD-004) */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {[1, 2].map((i) => (
                              <div key={i} className="h-16 border border-white/5 bg-gradient-to-r from-white/[0.02] via-[#D4AF37]/5 to-white/[0.02] bg-[length:200%_100%] animate-pulse p-4 flex flex-col justify-between">
                                <div className="h-3 w-20 bg-white/10"></div>
                                <div className="h-2.5 w-12 bg-[#D4AF37]/20"></div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {shippingError && (
                        <div className="mt-4 p-4 border border-red-900/30 bg-red-950/10 text-red-300 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <span>{shippingError} Usaremos nossa taxa de entrega padrão de R$ 29,90.</span>
                          <button 
                            type="button" 
                            onClick={async () => {
                              // Força cálculo novamente
                              setCep(c => c);
                              handleCepChange({ target: { value: cep } } as any);
                            }}
                            className="text-[10px] text-[#D4AF37] font-bold uppercase tracking-wider underline hover:text-white"
                          >
                            Tentar Novamente
                          </button>
                        </div>
                      )}

                      {!shippingLoading && shippingOptions.length > 0 && (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="mt-6 space-y-3"
                        >
                          <label className="text-[9px] font-sans font-bold text-[#D4AF37] tracking-[0.2em] block uppercase">Opções de Envio Assegurado</label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {shippingOptions.map((opt) => (
                              <div
                                key={opt.id}
                                onClick={() => setSelectedShipping(opt)}
                                className={`p-4 border rounded-[1px] cursor-pointer transition-all duration-300 ${selectedShipping?.id === opt.id ? 'border-[#D4AF37] bg-[#D4AF37]/[0.03]' : 'border-white/10 bg-white/[0.01] hover:border-white/30'}`}
                              >
                                <div className="flex justify-between items-center text-xs mb-1">
                                  <span className="font-bold text-white tracking-widest uppercase">{opt.name}</span>
                                  <span className="text-[#D4AF37] font-bold">{formatPrice(Number(opt.price))}</span>
                                </div>
                                <span className="text-white/40 text-[10px]">Prazo: Até {opt.delivery_time} dias úteis</span>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>

              {/* 03 — MÉTODO DE PAGAMENTO (InfinitePay Redirect) */}
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-4 border-b border-white/10 pb-3">
                  <span className="font-serif text-xl text-[#D4AF37] italic">03.</span>
                  <h2 className="font-sans text-[11px] font-bold tracking-[0.25em] uppercase text-white">Transação Segura</h2>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    type="button" 
                    onClick={() => setPaymentMethod('credit_card')}
                    className={`flex flex-col items-center justify-center gap-3 p-6 border transition-all duration-300 rounded-[2px] ${paymentMethod === 'credit_card' ? 'border-[#D4AF37] bg-[#D4AF37]/[0.05]' : 'border-white/10 bg-white/[0.01] hover:border-white/30'}`}
                  >
                    <CreditCard className={`${paymentMethod === 'credit_card' ? 'text-[#D4AF37]' : 'text-white/40'} w-6 h-6 transition-colors`} strokeWidth={1.2} />
                    <span className={`text-[9px] font-sans font-bold tracking-[0.2em] uppercase transition-colors ${paymentMethod === 'credit_card' ? 'text-white' : 'text-white/40'}`}>Cartão</span>
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setPaymentMethod('pix')}
                    className={`flex flex-col items-center justify-center gap-3 p-6 border transition-all duration-300 rounded-[2px] ${paymentMethod === 'pix' ? 'border-[#D4AF37] bg-[#D4AF37]/[0.05]' : 'border-white/10 bg-white/[0.01] hover:border-white/30'}`}
                  >
                    <QrCode className={`${paymentMethod === 'pix' ? 'text-[#D4AF37]' : 'text-white/40'} w-6 h-6 transition-colors`} strokeWidth={1.2} />
                    <span className={`text-[9px] font-sans font-bold tracking-[0.2em] uppercase transition-colors ${paymentMethod === 'pix' ? 'text-white' : 'text-white/40'}`}>PIX Direto</span>
                  </button>
                </div>

                <div className="p-6 bg-white/[0.02] border border-white/5 rounded-[2px] w-full min-w-0">
                  <AnimatePresence mode="wait">
                    {paymentMethod === 'credit_card' ? (
                      <motion.div 
                        key="credit_card"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.2 }}
                        className="text-center space-y-4 w-full min-w-0"
                      >
                        <Lock className="w-5 h-5 text-[#D4AF37] mx-auto opacity-70" strokeWidth={1.5} />
                        <p className="font-sans text-white/70 text-xs leading-relaxed w-full">
                          Você será redirecionado para o ambiente criptografado da <strong className="text-white">InfinitePay</strong>. Lá, você poderá inserir com total segurança os dados do seu cartão de crédito e parcelar sua joia em até <strong className="text-[#D4AF37]">12x</strong>.
                        </p>
                      </motion.div>
                    ) : (
                      <motion.div 
                        key="pix"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.2 }}
                        className="text-center space-y-4 w-full min-w-0"
                      >
                        <QrCode className="w-5 h-5 text-[#D4AF37] mx-auto opacity-70" strokeWidth={1.5} />
                        <p className="font-sans text-white/70 text-xs leading-relaxed w-full">
                          Ao confirmar seu pedido, um <strong className="text-white">código PIX Copia e Cola</strong> (e QR Code) será gerado. O pagamento é processado instantaneamente, agilizando o início da produção artesanal da sua joia.
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            </div>

            {/* Resumo do Pedido (Lado Direito - Fixo Estilo Shopify) */}
            <div className="lg:col-span-5 space-y-8 lg:sticky lg:top-8 pb-10 w-full min-w-0">
              <div className="bg-[#101010] border border-white/10 p-6 sm:p-8 space-y-6 rounded-[2px] shadow-lg w-full">
                <div className="flex justify-between items-center pb-4 border-b border-white/5">
                  <h2 className="font-sans text-[11px] font-bold tracking-[0.2em] uppercase text-[#D4AF37]">Joias Solicitadas ({items.length})</h2>
                  <Link href="/categoria" className="text-[9px] font-sans text-white/40 hover:text-white uppercase tracking-widest transition-colors">Ajustar</Link>
                </div>

                {/* Lista de Peças */}
                <div className="space-y-4 max-h-72 overflow-y-auto pr-2 custom-scroll">
                  {items.map((item) => (
                    <div key={item.cartItemId} className="flex gap-4">
                      <div className="w-16 h-20 bg-[#161616] flex-shrink-0 relative overflow-hidden border border-white/5">
                        <Image
                          src={item.images && item.images.length > 0 ? item.images[0] : '/images/placeholder-premium.svg'}
                          alt={item.name}
                          fill
                          className="object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="flex-grow flex flex-col justify-center min-w-0">
                        <p className="font-serif text-xs text-white uppercase truncate">{item.name}</p>
                        {item.selectedOptions && item.selectedOptions.length > 0 && (
                          <div className="mt-1 space-y-0.5">
                            {item.selectedOptions.map(opt => (
                              <p key={opt.option_id} className="text-[9px] font-sans text-white/40 truncate">
                                <span className="font-bold text-[#D4AF37]/75 uppercase">{opt.option_name}:</span> {opt.value_name}
                              </p>
                            ))}
                          </div>
                        )}
                        <span className="text-[9px] font-sans text-white/30 tracking-widest uppercase mt-0.5">Quantidade: {item.quantity}</span>
                        <span className="text-xs font-sans font-bold text-[#D4AF37] uppercase tracking-wider mt-1.5">
                          {formatPrice((item.promotional_price || item.price) * item.quantity)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Valores Recalculados */}
                <div className="space-y-3 pt-6 border-t border-white/10 text-xs">
                  <div className="flex justify-between">
                    <span className="text-white/40 font-sans font-bold text-[9px] tracking-widest uppercase">Subtotal</span>
                    <span className="font-sans text-white">{formatPrice(currentTotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40 font-sans font-bold text-[9px] tracking-widest uppercase">Frete Assegurado</span>
                    <span className="font-sans text-white">
                      {selectedShipping
                        ? formatPrice(Number(selectedShipping.price))
                        : cep.length === 9
                        ? 'Cotando...'
                        : 'A selecionar'}
                    </span>
                  </div>
                  
                  {/* Bloco de Credenciais Concierge */}
                  <div className="p-4 bg-white/[0.01] border border-white/5 space-y-2 mt-4">
                    <div className="flex items-center gap-2 text-[9px] font-bold text-[#D4AF37] tracking-wider uppercase">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Garantia Vitalícia Luminar</span>
                    </div>
                    <p className="text-[9px] text-white/40 leading-relaxed">
                      Todas as peças acompanham certificado de autenticidade eterno de Ouro 18k e pedrarias. Remessa 100% segurada contra perdas e extravios.
                    </p>
                  </div>

                  {/* Valor Total */}
                  <div className="flex justify-between text-[#D4AF37] pt-4 border-t border-white/10 items-end">
                    <span className="font-serif text-sm">TOTAL</span>
                    <span className="text-2xl sm:text-3xl font-serif tracking-wide">{formatPrice(finalTotal)}</span>
                  </div>
                </div>
              </div>
              
              {/* WhatsApp Concierge VIP Widget (Se tiver dúvidas ou frete falhar) */}
              <div className="p-4 bg-[#111110] border border-[#D4AF37]/15 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-white tracking-widest uppercase">Atendimento Concierge</p>
                  <p className="text-[9px] text-white/40">Dúvidas sobre o frete ou personalizações?</p>
                </div>
                <a 
                  href="https://wa.me/5575988313060?text=Olá,%20gostaria%20de%20um%20atendimento%20VIP%20sobre%20as%20joias%20da%20Luminar." 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/20 hover:bg-[#d4af37] hover:text-black transition-all text-[9px] font-bold uppercase tracking-wider"
                >
                  <PhoneCall className="w-3 h-3" />
                  VIP Chat
                </a>
              </div>
            </div>
          </div>

          {/* Rodapé de checkout fixo */}
          <footer className="fixed bottom-0 left-0 w-full bg-[#090909] border-t border-[#D4AF37]/30 h-auto min-h-[88px] z-50 px-4 sm:px-12 flex items-center justify-between shadow-[0_-20px_40px_rgba(0,0,0,0.8)] pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-4">
            <div className="hidden sm:flex flex-col">
              <span className="text-[9px] font-sans font-bold text-white/40 tracking-widest uppercase">Total a pagar</span>
              <span className="text-xl font-serif text-[#D4AF37]">{formatPrice(finalTotal)}</span>
            </div>
            <button
              type="submit"
              disabled={!selectedShipping || isProcessing}
              className="w-full sm:w-auto bg-[#D4AF37] text-black font-sans font-bold h-12 px-12 text-[10px] tracking-[0.25em] hover:bg-[#ebce67] transition-all active:scale-[0.98] uppercase flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed rounded-[2px]"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-black" />
                  Redirecionando...
                </>
              ) : (
                <>
                  Confirmar Pedido
                  <Lock className="w-3.5 h-3.5" strokeWidth={2.2} />
                </>
              )}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
