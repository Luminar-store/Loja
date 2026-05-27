'use client';

import { useState, useEffect, startTransition } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';
import { Star, Check, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type ReviewRow = Database['public']['Tables']['product_reviews']['Row'];

interface ProductReviewsProps {
  productId: string;
  productName: string;
}

export function ProductReviews({ productId, productName }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');

  useEffect(() => {
    async function fetchReviews() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('product_reviews')
          .select('*')
          .eq('product_id', productId)
          .eq('is_approved', true)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setReviews(data || []);
      } catch (err: any) {
        console.error('Erro ao carregar avaliações:', err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchReviews();
  }, [productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !comment.trim()) {
      setSubmitError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError(null);

      const { error } = await supabase.from('product_reviews').insert({
        product_id: productId,
        reviewer_name: name,
        reviewer_email: email,
        rating,
        comment,
        is_approved: false, // Requer curadoria
        is_verified_buyer: false, // Marcado pelo admin
      });

      if (error) throw error;

      setSubmitSuccess(true);
      setName('');
      setEmail('');
      setRating(5);
      setComment('');

      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setSubmitSuccess(false);
      }, 5000);
    } catch (err: any) {
      console.error('Erro ao enviar avaliação:', err.message);
      setSubmitError('Ocorreu um erro ao enviar sua avaliação. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const averageRating = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  const starCounts = [0, 0, 0, 0, 0];
  reviews.forEach(r => {
    if (r.rating >= 1 && r.rating <= 5) {
      starCounts[r.rating - 1]++;
    }
  });

  return (
    <section className="w-full py-16 border-t border-white/5 bg-[#131313]">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
        
        {/* Lado Esquerdo: Estatísticas e Distribuição */}
        <div className="lg:col-span-5 space-y-8">
          <div className="space-y-4">
            <span className="font-sans text-[11px] font-bold text-[#D4AF37] tracking-[0.2em] uppercase">
              Curadoria & Confiança
            </span>
            <h2 className="font-serif text-[28px] text-white uppercase tracking-wider leading-tight">
              Depoimentos & Experiências
            </h2>
            <p className="font-sans text-[13px] text-white/50 leading-relaxed font-light">
              Na Luminar, cada avaliação passa por uma curadoria ética para garantir a legitimidade e a procedência. Conheça as opiniões de quem já adquiriu nossas obras de artesania.
            </p>
          </div>

          <div className="flex items-center gap-6 py-6 border-y border-white/10">
            <div className="text-center">
              <div className="font-serif text-[48px] font-bold text-white tracking-tighter leading-none">
                {averageRating}
              </div>
              <span className="font-sans text-[10px] text-white/50 tracking-widest uppercase font-bold">
                de 5.0 estrelas
              </span>
            </div>
            
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star 
                    key={s} 
                    className={`w-4 h-4 ${s <= Math.round(Number(averageRating)) ? 'text-[#D4AF37] fill-[#D4AF37]' : 'text-white/10'}`} 
                  />
                ))}
                <span className="font-mono text-[11px] text-white/50 ml-2">
                  ({reviews.length} {reviews.length === 1 ? 'avaliação' : 'avaliações'})
                </span>
              </div>

              {/* Barras de distribuição simplificadas e premium */}
              <div className="space-y-1.5 pt-1">
                {[5, 4, 3, 2, 1].map((stars) => {
                  const count = starCounts[stars - 1];
                  const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                  return (
                    <div key={stars} className="flex items-center gap-3 text-[10px] font-mono text-white/40">
                      <span className="w-3">{stars}★</span>
                      <div className="flex-1 h-[2px] bg-white/5 relative overflow-hidden">
                        <div 
                          className="absolute left-0 top-0 h-full bg-[#D4AF37] transition-all duration-500" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="w-6 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Formulário Elegante de Nova Avaliação */}
          <form onSubmit={handleSubmit} className="p-6 border border-white/10 bg-[#1A1A1A] rounded-none space-y-6">
            <h3 className="font-serif text-sm text-white uppercase tracking-widest border-b border-white/5 pb-3">
              Deixe seu Depoimento
            </h3>

            <div className="space-y-2">
              <label className="block font-sans text-[10px] font-bold text-white/70 uppercase tracking-widest">
                Sua Nota *
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setRating(s)}
                    onMouseEnter={() => setHoverRating(s)}
                    onMouseLeave={() => setHoverRating(null)}
                    className="p-1 text-white/20 hover:text-[#D4AF37] transition-colors focus:outline-none cursor-pointer"
                  >
                    <Star
                      className={`w-6 h-6 transition-all duration-200 ${
                        s <= (hoverRating ?? rating)
                          ? 'text-[#D4AF37] fill-[#D4AF37] scale-110'
                          : 'text-white/15'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block font-sans text-[10px] font-bold text-white/70 uppercase tracking-widest">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Clara de Melo"
                  className="w-full bg-transparent border-b border-white/20 focus:border-[#D4AF37] outline-none py-2 px-1 font-sans text-xs text-white transition-colors duration-300"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-sans text-[10px] font-bold text-white/70 uppercase tracking-widest">
                  E-mail *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Ex: clara@email.com"
                  className="w-full bg-transparent border-b border-white/20 focus:border-[#D4AF37] outline-none py-2 px-1 font-sans text-xs text-white transition-colors duration-300"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block font-sans text-[10px] font-bold text-white/70 uppercase tracking-widest">
                Depoimento *
              </label>
              <textarea
                required
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Compartilhe sua experiência com esta joia Luminar..."
                className="w-full bg-transparent border border-white/20 focus:border-[#D4AF37] outline-none p-3 font-sans text-xs text-white transition-colors duration-300 rounded-none resize-none leading-relaxed"
              />
            </div>

            <AnimatePresence mode="wait">
              {submitSuccess && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-3 p-4 bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37]"
                >
                  <Check className="w-5 h-5 flex-shrink-0" />
                  <p className="font-sans text-[11px] uppercase tracking-wider font-bold">
                    Obrigado! Seu depoimento foi enviado para nossa curadoria.
                  </p>
                </motion.div>
              )}

              {submitError && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 text-red-500"
                >
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="font-sans text-[11px] uppercase tracking-wider font-bold">
                    {submitError}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 border border-[#D4AF37] bg-transparent text-[#D4AF37] font-sans text-[11px] font-bold tracking-widest uppercase hover:bg-[#D4AF37] hover:text-black transition-all duration-300 disabled:opacity-50 cursor-pointer active:scale-[0.98]"
            >
              {submitting ? 'Enviando...' : 'Enviar Depoimento'}
            </button>
          </form>
        </div>

        {/* Lado Direito: Listagem de Avaliações */}
        <div className="lg:col-span-7 space-y-8">
          <h3 className="font-serif text-[18px] text-white uppercase tracking-wider border-b border-white/5 pb-4">
            Depoimentos Aprovados ({reviews.length})
          </h3>

          <div className="space-y-6 max-h-[650px] overflow-y-auto pr-2 no-scrollbar">
            {loading ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="p-6 border border-white/5 bg-[#1A1A1A]/40 animate-pulse space-y-3">
                    <div className="h-4 bg-white/10 w-1/4 rounded-none" />
                    <div className="h-3 bg-white/5 w-1/2 rounded-none" />
                    <div className="h-10 bg-white/5 w-full rounded-none" />
                  </div>
                ))}
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-16 border border-white/5 bg-[#1A1A1A]/30">
                <p className="font-sans text-xs text-white/40 uppercase tracking-widest">
                  Esta joia ainda não possui depoimentos.
                </p>
                <p className="font-sans text-[10px] text-white/35 mt-1">
                  Seja o primeiro a compartilhar sua experiência adquirindo esta obra.
                </p>
              </div>
            ) : (
              reviews.map((review) => (
                <div 
                  key={review.id}
                  className="p-6 border border-white/5 bg-[#1A1A1A]/30 hover:bg-[#1A1A1A]/50 transition-colors duration-300 relative space-y-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h4 className="font-serif text-sm text-white uppercase tracking-wider">
                        {review.reviewer_name}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-mono text-[9px] text-white/45">
                          {new Date(review.created_at).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </span>
                        {review.is_verified_buyer && (
                          <span className="flex items-center gap-1 font-sans text-[9px] font-bold text-[#D4AF37] uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full" />
                            Adquirente Verificado
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${
                            s <= review.rating 
                              ? 'text-[#D4AF37] fill-[#D4AF37]' 
                              : 'text-white/10'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <p className="font-sans text-[13px] text-white/70 leading-relaxed font-light">
                    “{review.comment}”
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </section>
  );
}
