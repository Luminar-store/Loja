'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Loader2, LogOut, ArrowRight, ShieldCheck, Mail, Calendar, Compass, Hammer, Gem, Scissors, PackageCheck, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatPrice } from '@/lib/data';

interface OrderTimelineStep {
  step_key: string;
  title: string;
  description: string;
  is_completed: boolean;
  completed_at: string | null;
}

interface OrderWithDetails {
  id: string;
  status: string;
  payment_status: string;
  total_price: number;
  created_at: string;
  gateway_reference: string | null;
  timeline?: OrderTimelineStep[];
}

// Etapas emocionais da fabricação de joias sob encomenda (Fallback e Visual)
const defaultSteps: Record<string, { title: string; description: string; icon: any }> = {
  pending: {
    title: 'Design & Curadoria',
    description: 'Nossos mestres orquestram a curadoria de gemas e elaboração dos esboços da sua joia.',
    icon: Compass
  },
  refining: {
    title: 'Refino do Metal',
    description: 'Fundição e purificação do Ouro 18k na liga perfeita para receber as pedrarias.',
    icon: ShieldCheck
  },
  forging: {
    title: 'Forja Artística',
    description: 'O metal precioso é moldado, forjado e esculpido à mão nas proporções ideais.',
    icon: Hammer
  },
  gemsetting: {
    title: 'Cravação das Pedras',
    description: 'Lapidação final e fixação microscópica de cada diamante ou gema de luxo.',
    icon: Gem
  },
  polishing: {
    title: 'Polimento Exclusivo',
    description: 'Acabamento espelhado e polimento de alto brilho para ressaltar o metal precioso.',
    icon: Scissors
  },
  packaging: {
    title: 'Caixa de Veludo',
    description: 'A joia recebe nosso laudo certificado e é acondicionada na embalagem de luxo da grife.',
    icon: PackageCheck
  },
  shipped: {
    title: 'Remessa Assegurada',
    description: 'Despacho com seguro total e rastreamento VIP encaminhado para o seu endereço.',
    icon: Send
  }
};

export default function ClienteAreaPage() {
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null);

  useEffect(() => {
    // 2. Carrega pedidos e timelines da nuvem
    const loadCustomerData = async (userId: string) => {
      try {
        // Carrega pedidos
        const { data: dbOrders, error: ordersError } = await supabase
          .from('orders')
          .select('*')
          .eq('customer_id', userId)
          .order('created_at', { ascending: false });

        if (ordersError) throw ordersError;

        const mappedOrders: OrderWithDetails[] = [];

        for (const order of (dbOrders || [])) {
          // Carrega timeline customizada se existir
          const { data: dbTimeline } = await supabase
            .from('order_timeline')
            .select('*')
            .eq('order_id', order.id)
            .order('created_at', { ascending: true });

          // Monta a timeline reativa a partir de etapas físicas ou padrão baseada no status atual do pedido
          const timelineSteps: OrderTimelineStep[] = [];
          const statusKeys = ['pending', 'refining', 'forging', 'gemsetting', 'polishing', 'packaging', 'shipped'];
          
          // Mapeamento automático inteligente baseado em status da tabela
          let currentStepIndex = 0;
          if (order.status === 'processing') currentStepIndex = 3; // Cravando/polindo
          else if (order.status === 'shipped') currentStepIndex = 6; // Enviado
          else if (order.status === 'delivered') currentStepIndex = 6;

          statusKeys.forEach((key, idx) => {
            const dbStep = dbTimeline?.find(s => s.step_key === key);
            timelineSteps.push({
              step_key: key,
              title: dbStep?.title || defaultSteps[key].title,
              description: dbStep?.description || defaultSteps[key].description,
              is_completed: dbStep?.is_completed || (idx <= currentStepIndex),
              completed_at: dbStep?.completed_at || (idx <= currentStepIndex ? order.updated_at : null)
            });
          });

          mappedOrders.push({
            ...order,
            timeline: timelineSteps
          });
        }

        setOrders(mappedOrders);
        if (mappedOrders.length > 0) {
          setSelectedOrder(mappedOrders[0]);
        }
      } catch (err: any) {
        console.error('[ClienteArea] Erro ao carregar dados:', err.message);
      }
    };

    // 1. Escuta mudanças na autenticação do Supabase
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) {
        await loadCustomerData(session.user.id);
      }
      setPageLoading(false);
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        await loadCustomerData(session.user.id);
      } else {
        setOrders([]);
        setSelectedOrder(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // 3. Login sem senha (Magic Link)
  const handleMagicLinkLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    try {
      setAuthLoading(true);
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/cliente`
        }
      });

      if (error) throw error;
      toast.success('Magic Link enviado com sucesso! Verifique seu e-mail.');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao enviar e-mail.');
    } finally {
      setAuthLoading(false);
    }
  };

  // 4. Logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('Sessão encerrada.');
  };

  if (pageLoading) {
    return (
      <div className="w-full min-h-[70vh] flex items-center justify-center bg-[#090909]">
        <Loader2 className="w-8 h-8 animate-spin text-[#d4af37]" />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#080808] text-white py-12 lg:py-20 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <AnimatePresence mode="wait">
          
          {/* FLUXO 1: LOGIN (Se não estiver autenticado) */}
          {!user ? (
            <motion.div 
              key="login"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="max-w-md mx-auto bg-[#101010] border border-white/10 p-8 rounded-[2px] shadow-2xl space-y-8"
            >
              <div className="text-center space-y-2">
                <div className="w-10 h-10 border border-[#D4AF37]/30 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="text-[#D4AF37] w-4 h-4 animate-pulse" />
                </div>
                <h1 className="font-serif text-xl uppercase tracking-[0.2em]">Área Concierge</h1>
                <p className="text-[10px] font-sans text-white/40 tracking-widest uppercase">Acompanhe a confecção da sua joia</p>
              </div>

              <form onSubmit={handleMagicLinkLogin} className="space-y-6">
                <div className="relative">
                  <label className="text-[9px] font-sans font-bold text-[#D4AF37] tracking-[0.2em] block mb-2 uppercase">E-mail Cadastrado na Compra</label>
                  <input 
                    required 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-transparent border-b border-white/20 py-3 text-sm text-white focus:outline-none focus:border-[#D4AF37] transition-colors rounded-none" 
                    placeholder="nome@provedor.com" 
                    type="email" 
                  />
                </div>

                <button
                  type="submit"
                  disabled={authLoading || !email}
                  className="w-full bg-[#D4AF37] text-black font-sans font-bold h-12 text-[10px] tracking-[0.25em] hover:bg-[#ebce67] transition-all active:scale-[0.98] uppercase flex items-center justify-center gap-2 disabled:opacity-50 rounded-[1px]"
                >
                  {authLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-black" />
                  ) : (
                    <>
                      Enviar Link Mágico
                      <Mail className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>

              <div className="text-center pt-4 border-t border-white/5">
                <p className="text-[9px] text-white/30 leading-relaxed uppercase tracking-widest">
                  Para segurança criptográfica, enviamos um link de login imediato sem senhas. Acesse sua caixa de e-mail após clicar.
                </p>
              </div>
            </motion.div>
          ) : (
            
            // FLUXO 2: PAINEL EXCLUSIVO (Se logado)
            <motion.div 
              key="panel"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-12"
            >
              
              {/* Header do Painel */}
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-6 pb-6 border-b border-white/10">
                <div>
                  <span className="text-[9px] font-sans font-bold tracking-[0.25em] text-[#D4AF37] uppercase">Sessão Exclusiva</span>
                  <h2 className="font-serif text-2xl uppercase tracking-widest text-white mt-1">Sua Galeria VIP</h2>
                  <p className="text-white/40 text-xs mt-1 font-light">Seja bem-vindo. Abaixo encontram-se seus pedidos e o acompanhamento artesanal.</p>
                </div>
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-[10px] font-sans text-white/50 hover:text-white uppercase tracking-widest font-bold border border-white/10 hover:border-white/20 bg-white/[0.01] px-4 py-2.5 rounded-[1px]"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sair
                </button>
              </div>

              {orders.length === 0 ? (
                <div className="text-center py-16 bg-[#101010] border border-white/5 rounded-[1px]">
                  <p className="text-white/50 text-sm font-sans font-light">Nenhum pedido sob encomenda registrado para este e-mail ainda.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  
                  {/* Menu Lateral de Pedidos (Lado Esquerdo) */}
                  <div className="lg:col-span-4 space-y-4">
                    <span className="text-[9px] font-sans font-bold tracking-[0.2em] text-[#D4AF37] uppercase block mb-1">Selecione o Pedido</span>
                    <div className="space-y-3">
                      {orders.map(order => (
                        <div
                          key={order.id}
                          onClick={() => setSelectedOrder(order)}
                          className={`p-4 border cursor-pointer transition-all duration-300 rounded-[1px] ${selectedOrder?.id === order.id ? 'border-[#d4af37] bg-[#d4af37]/[0.02]' : 'border-white/10 bg-white/[0.01] hover:border-white/20'}`}
                        >
                          <div className="flex justify-between items-center text-xs mb-1">
                            <span className="font-mono font-bold text-white uppercase truncate">
                              {order.gateway_reference ?? `#ORD-${order.id.slice(0, 8).toUpperCase()}`}
                            </span>
                            <span className="text-[#d4af37] font-bold text-[11px]">{formatPrice(order.total_price)}</span>
                          </div>
                          <div className="flex justify-between items-center text-[9px] text-white/40 tracking-wider mt-2">
                            <span>{new Date(order.created_at).toLocaleDateString('pt-BR')}</span>
                            <span className="uppercase text-[#d4af37]/80">{order.status === 'processing' ? 'Forjando' : order.status === 'pending' ? 'Curadoria' : 'Despachado'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Detalhe da Timeline Emocional (Lado Direito - Principal) */}
                  <div className="lg:col-span-8 bg-[#101010] border border-white/10 p-6 sm:p-8 rounded-[2px] shadow-lg space-y-8">
                    {selectedOrder && (
                      <>
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-white/5">
                          <div>
                            <span className="text-[9px] font-sans font-bold tracking-[0.2em] text-white/40 uppercase">Acompanhamento de Confecção</span>
                            <h3 className="font-mono text-sm font-bold text-white uppercase mt-1">
                              Ref: {selectedOrder.gateway_reference ?? `#ORD-${selectedOrder.id.slice(0, 8).toUpperCase()}`}
                            </h3>
                          </div>
                          <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-[#d4af37] border border-[#d4af37]/35 bg-[#d4af37]/5 px-3 py-1.5 rounded-[1px]">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Sob Encomenda (7-15 dias)</span>
                          </div>
                        </div>

                        {/* Desenho da Timeline Emocional */}
                        <div className="relative pl-6 sm:pl-8 space-y-8 border-l border-white/15 ml-4 py-2">
                          {selectedOrder.timeline?.map((stepData, idx) => {
                            const StepIcon = defaultSteps[stepData.step_key]?.icon || Compass;
                            return (
                              <div key={stepData.step_key} className="relative group">
                                {/* Bolinha e Icone da Etapa */}
                                <div className={`absolute left-[-39px] sm:left-[-47px] top-0 w-8 h-8 rounded-full border flex items-center justify-center transition-all ${stepData.is_completed ? 'bg-[#d4af37] border-[#d4af37] text-black shadow-lg shadow-[#d4af37]/15' : 'bg-[#101010] border-white/15 text-white/30'}`}>
                                  <StepIcon className="w-4 h-4" strokeWidth={stepData.is_completed ? 2 : 1.2} />
                                </div>

                                <div className="space-y-1">
                                  <div className="flex items-center gap-3">
                                    <h4 className={`text-xs font-serif uppercase tracking-widest ${stepData.is_completed ? 'text-[#d4af37] font-bold' : 'text-white/40'}`}>
                                      {stepData.title}
                                    </h4>
                                    {stepData.is_completed && (
                                      <span className="text-[8px] bg-[#d4af37]/10 text-[#d4af37] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded-[1px]">
                                        Concluído
                                      </span>
                                    )}
                                  </div>
                                  <p className={`text-[11px] font-sans font-light leading-relaxed max-w-lg ${stepData.is_completed ? 'text-white/70' : 'text-white/20'}`}>
                                    {stepData.description}
                                  </p>
                                  {stepData.is_completed && stepData.completed_at && (
                                    <span className="text-[9px] font-mono text-white/30 block mt-1">
                                      Atualizado em: {new Date(stepData.completed_at).toLocaleDateString('pt-BR')}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
