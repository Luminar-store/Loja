'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'motion/react';
import { CheckCircle, Package, MapPin, MessageCircle } from 'lucide-react';
import { useCart } from '@/context/CartContext';

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderNsu = searchParams.get('order');
  const { clearCart } = useCart();

  // ✅ Limpar carrinho AQUI — só após a confirmação de pagamento bem-sucedida
  // O cliente foi redirecionado de volta pelo InfinitePay após pagar
  useEffect(() => {
    clearCart();
  }, [clearCart]);

  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '5575988313060';

  return (
    <div className="w-full min-h-[80vh] flex flex-col items-center justify-center px-6 py-16">

      {/* Ícone animado */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 15, stiffness: 200, delay: 0.1 }}
        className="relative mb-8"
      >
        <div className="w-24 h-24 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center">
          <CheckCircle className="w-12 h-12 text-[#D4AF37]" strokeWidth={1.5} />
        </div>
        {/* Pulse ring */}
        <div className="absolute inset-0 rounded-full border border-[#D4AF37]/30 animate-ping" />
      </motion.div>

      {/* Título */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-center mb-4"
      >
        <h1 className="font-serif text-4xl md:text-5xl text-[#D4AF37] uppercase tracking-[0.1em] mb-3">
          Pedido Confirmado
        </h1>
        <p className="font-sans text-white/60 max-w-md text-center leading-relaxed">
          Seu pagamento foi recebido com sucesso. Nossa equipe já começou a preparar sua peça exclusiva.
        </p>
      </motion.div>

      {/* NSU */}
      {orderNsu && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="mb-10 px-6 py-3 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-lg"
        >
          <p className="font-sans text-[10px] text-[#D4AF37] uppercase tracking-widest mb-1 text-center">
            Número do Pedido
          </p>
          <p className="font-mono text-white font-bold tracking-wider text-center">
            {orderNsu}
          </p>
        </motion.div>
      )}

      {/* Cards informativos */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl w-full mb-10"
      >
        {[
          {
            icon: <CheckCircle className="w-6 h-6 text-[#D4AF37]" strokeWidth={1.5} />,
            title: 'Pagamento Aprovado',
            desc: 'Seu pagamento foi confirmado e o pedido está em fila de produção.',
          },
          {
            icon: <Package className="w-6 h-6 text-[#D4AF37]" strokeWidth={1.5} />,
            title: 'Produção: 7–15 dias',
            desc: 'Cada peça é produzida artesanalmente sob encomenda.',
          },
          {
            icon: <MapPin className="w-6 h-6 text-[#D4AF37]" strokeWidth={1.5} />,
            title: 'Entrega Rastreada',
            desc: 'Você receberá o código de rastreio assim que enviarmos.',
          },
        ].map((card, i) => (
          <div
            key={i}
            className="bg-[#131313] border border-white/5 rounded-xl p-6 flex flex-col items-center text-center gap-3"
          >
            {card.icon}
            <p className="font-sans text-sm font-bold text-white uppercase tracking-wide">
              {card.title}
            </p>
            <p className="font-sans text-xs text-white/50 leading-relaxed">{card.desc}</p>
          </div>
        ))}
      </motion.div>

      {/* CTAs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        {orderNsu && (
          <Link
            href={`/rastreio?id=${orderNsu}`}
            className="flex items-center gap-2 border border-[#D4AF37] text-[#D4AF37] px-8 py-4 font-sans text-[11px] uppercase tracking-[0.2em] hover:bg-[#D4AF37] hover:text-black transition-all active:scale-95"
          >
            <MapPin className="w-4 h-4" />
            Acompanhar Pedido
          </Link>
        )}
        <a
          href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent('Olá! Acabei de realizar um pedido na Luminar Joias e gostaria de confirmar.')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-[#D4AF37] text-black px-8 py-4 font-sans font-bold text-[11px] uppercase tracking-[0.2em] hover:brightness-110 transition-all active:scale-95"
        >
          <MessageCircle className="w-4 h-4" />
          Falar no WhatsApp
        </a>
      </motion.div>

      {/* Link para continuar comprando */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
        className="mt-12"
      >
        <Link
          href="/"
          className="font-sans text-[10px] text-white/30 uppercase tracking-widest hover:text-[#D4AF37] transition-colors"
        >
          Continuar Explorando a Coleção →
        </Link>
      </motion.div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full min-h-[80vh] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
