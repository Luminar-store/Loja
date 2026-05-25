'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { customOrdersService } from '@/services/custom-orders.service';
import { CustomOrder } from '@/types/custom-orders';
import { Loader2, Search, Check, Gem } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Image from 'next/image';
import Link from 'next/link';

// Simple visual tracking steps
const STEPS = [
  { id: 'pending', label: 'Pedido Recebido' },
  { id: 'Em Produção', label: 'Em Produção' },
  { id: 'Finalizado', label: 'Finalizado' },
  { id: 'Enviado', label: 'Enviado' }
];

function OrderTracking() {
  const searchParams = useSearchParams();
  const idFromUrl = searchParams.get('id') || '';
  
  const [searchId, setSearchId] = useState(idFromUrl);
  const [order, setOrder] = useState<CustomOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchOrder = async (id: string) => {
    if (!id) return;
    setLoading(true);
    setError('');
    setOrder(null);
    try {
      // In a real app we'd need an unauthenticated "tracking" endpoint or RLS rule tweak 
      // allowing read access if ID is known. Assuming we can read it:
      const data = await customOrdersService.getOrderById(id);
      setOrder(data);
    } catch (err) {
      setError('Pedido não encontrado. Verifique o código informado.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (idFromUrl) {
      // Run async fetch without triggering sync setState warning
      const fetchInitial = async () => {
        await fetchOrder(idFromUrl);
      };
      fetchInitial();
    }
  }, [idFromUrl]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrder(searchId);
  };

  const currentStepIndex = order 
    ? STEPS.findIndex(s => s.id.toLowerCase() === order.status.toLowerCase())
    : -1;

  return (
    <div className="w-full min-h-[60vh] max-w-3xl mx-auto px-6 py-20 flex flex-col items-center">
      <div className="text-center mb-12">
        <h1 className="font-serif text-[32px] text-white uppercase tracking-[0.1em]">Acompanhar Pedido</h1>
        <p className="font-sans text-white/50 mt-2">Acompanhe a produção da sua joia Luminar.</p>
      </div>

      <form onSubmit={handleSearch} className="w-full max-w-md relative mb-16">
        <input 
          type="text" 
          placeholder="Código do pedido (ex: f1a2...)" 
          value={searchId}
          onChange={(e) => setSearchId(e.target.value)}
          className="w-full bg-[#131313] border border-white/10 rounded-none py-4 pl-6 pr-14 text-white focus:outline-none focus:border-[#D4AF37] transition-all font-sans"
        />
        <button 
          type="submit" 
          disabled={loading}
          className="absolute right-0 top-0 h-full px-4 text-white/50 hover:text-[#D4AF37] transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
        </button>
      </form>

      {error && (
        <div className="text-red-400 font-sans text-sm mb-8 text-center bg-red-400/10 px-6 py-3 rounded">
          {error}
        </div>
      )}

      {order && (
        <div className="w-full bg-[#0e0e0e] border border-white/10 p-8">
          
          <div className="border-b border-white/5 pb-6 mb-8 text-center sm:text-left flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <p className="font-sans text-[10px] text-white/40 uppercase tracking-[0.2em] mb-1">Pedido</p>
              <h2 className="font-serif text-2xl text-[#D4AF37] uppercase">{order.id.slice(0,8)}</h2>
            </div>
            <div className="sm:text-right">
              <p className="font-sans text-[10px] text-white/40 uppercase tracking-[0.2em] mb-1">Status Atual</p>
              <p className="font-sans text-lg text-white capitalize font-bold tracking-widest">{order.status === 'pending' ? 'Pedido Recebido' : order.status}</p>
            </div>
          </div>

          {/* Graphical Tracker */}
          <div className="relative mb-16">
            <div className="absolute top-1/2 left-4 right-4 h-[2px] bg-white/10 -translate-y-1/2 z-0 hidden sm:block"></div>
            <div 
              className="absolute top-1/2 left-4 h-[2px] bg-[#D4AF37] -translate-y-1/2 z-0 hidden sm:block transition-all duration-700" 
              style={{ width: `calc(${Math.max(0, currentStepIndex)} * (100% / 3) - 1rem)` }}
            ></div>

            <div className="relative z-10 flex flex-col sm:flex-row justify-between gap-8 sm:gap-0">
              {STEPS.map((step, index) => {
                const isCompleted = currentStepIndex >= index;
                const isCurrent = currentStepIndex === index;
                
                return (
                  <div key={step.id} className="flex sm:flex-col items-center gap-4 sm:gap-3">
                    <div 
                      className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                        isCompleted 
                          ? 'bg-[#D4AF37] border-[#D4AF37] text-black' 
                          : 'bg-[#131313] border-white/20 text-white/20'
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="w-4 h-4" strokeWidth={3} />
                      ) : (
                        <span className="font-sans text-[10px] font-bold">{index + 1}</span>
                      )}
                    </div>
                    <span 
                      className={`font-sans text-[10px] sm:text-xs uppercase tracking-widest font-bold ${
                        isCurrent ? 'text-[#D4AF37]' : isCompleted ? 'text-white/80' : 'text-white/30'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-8 border-t border-white/5 pt-8">
            <div>
              <p className="font-sans text-[10px] text-white/40 uppercase tracking-[0.2em] mb-2">Item</p>
              <p className="font-sans text-white text-sm">{order.model}</p>
              <p className="font-sans text-[#D4AF37] text-xs mt-1">{order.material} • {order.length}</p>
            </div>
            <div className="sm:text-right">
              <p className="font-sans text-[10px] text-white/40 uppercase tracking-[0.2em] mb-2">Data do Pedido</p>
              <p className="font-sans text-white text-sm">
                {order.created_at ? format(new Date(order.created_at), "dd 'de' MMM, yyyy", { locale: ptBR }) : '-'}
              </p>
            </div>
          </div>

        </div>
      )}

      {/* Exclusivity note */}
      <div className="mt-20 text-center max-w-md opacity-40">
        <Gem className="text-[#D4AF37] mb-4 mx-auto w-6 h-6" strokeWidth={1} />
        <p className="font-sans text-[10px] uppercase tracking-widest leading-relaxed">
          Cada peça Luminar é produzida sob encomenda. Nosso prazo de confecção é de 7 a 15 dias úteis, garantindo qualidade excepcional e atenção a todos os detalhes.
        </p>
      </div>

    </div>
  );
}

export default function TrackingPage() {
  return (
    <Suspense fallback={<div className="w-full min-h-[50vh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" /></div>}>
      <OrderTracking />
    </Suspense>
  );
}
