'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, ExternalLink, Loader2, ArrowLeft, ArrowRight, User } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import toast from 'react-hot-toast';

interface Customer {
  id: string;
  created_at: string;
  email: string;
  name: string | null;
  total_spent: number;
  orders_count: number;
}

export default function CustomersPage() {
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  
  // Paginação
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 8;

  const fetchCustomers = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('customers')
        .select('*', { count: 'exact' });

      // Aplica a busca por nome ou e-mail, se preenchido
      if (search.trim()) {
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
      }

      // Paginação e ordenação
      const { data, count, error } = await query
        .order('total_spent', { ascending: false })
        .range(page * itemsPerPage, (page + 1) * itemsPerPage - 1);

      if (error) throw error;

      setCustomers(data || []);
      setTotalCount(count || 0);
    } catch (err: any) {
      console.error(err);
      toast.error('Erro ao ler clientes do banco.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(0); // Reinicia para a primeira página ao buscar
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-serif text-white tracking-wide">Clientes</h1>
          <p className="text-white/50 text-sm mt-1">Gerencie e analise a base de clientes reais da Luminar.</p>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#131313] border border-white/5 rounded-2xl overflow-hidden"
      >
        {/* Barra de Busca */}
        <div className="p-4 border-b border-white/5 flex flex-col sm:flex-row gap-4 items-center justify-between bg-[#1A1A1A]/50">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input 
              type="text" 
              value={search}
              onChange={handleSearchChange}
              placeholder="Buscar por nome ou email..." 
              className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg py-2 pl-9 pr-4 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#d4af37] transition-all"
            />
          </div>
          <div className="text-xs text-white/40 font-mono">
            Total Encontrado: {totalCount} clientes
          </div>
        </div>

        {/* Tabela de Clientes */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex h-48 items-center justify-center bg-black/10">
              <Loader2 className="w-6 h-6 animate-spin text-[#d4af37]" />
            </div>
          ) : customers.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-white/30 text-xs">
              <User className="w-6 h-6 mb-2 opacity-50" />
              Nenhum cliente cadastrado ou encontrado.
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-white/50 uppercase tracking-widest bg-[#1A1A1A]/30 border-b border-white/5 font-mono">
                <tr>
                  <th className="px-6 py-4 font-medium">Cliente</th>
                  <th className="px-6 py-4 font-medium">Email</th>
                  <th className="px-6 py-4 font-medium">Total Gasto</th>
                  <th className="px-6 py-4 font-medium">Pedidos</th>
                  <th className="px-6 py-4 font-medium">Cliente Desde</th>
                  <th className="px-6 py-4 font-medium text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 bg-black/10">
                {customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4 font-medium text-white flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#1A1A1A] border border-white/10 flex items-center justify-center text-xs font-bold text-[#d4af37] uppercase select-none">
                        {(customer.name || customer.email).substring(0, 2)}
                      </div>
                      {customer.name || 'Sem nome cadastrado'}
                    </td>
                    <td className="px-6 py-4 text-white/70 font-mono text-xs">{customer.email}</td>
                    <td className="px-6 py-4 font-serif text-[#d4af37] font-semibold">
                      R$ {customer.total_spent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-white/70 font-mono text-xs">{customer.orders_count}</td>
                    <td className="px-6 py-4 text-white/70 text-xs">
                      {format(parseISO(customer.created_at), "MMM 'de' yyyy", { locale: ptBR })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        type="button" 
                        onClick={() => toast.success(`E-mail enviado para ${customer.email}!`)}
                        className="inline-flex items-center justify-center p-2 text-white/40 hover:text-[#d4af37] hover:bg-[#d4af37]/10 rounded-lg transition-colors border border-transparent hover:border-[#d4af37]/20"
                        title="Enviar E-mail"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Rodapé de Paginação */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-white/5 bg-[#1A1A1A]/40 flex justify-between items-center text-xs font-mono">
            <span className="text-white/40">Página {page + 1} de {totalPages}</span>
            <div className="flex gap-2">
              <button 
                type="button"
                disabled={page === 0} 
                onClick={() => setPage(prev => prev - 1)}
                className="p-1.5 border border-white/10 hover:bg-white/5 disabled:opacity-20 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button 
                type="button"
                disabled={page === totalPages - 1} 
                onClick={() => setPage(prev => prev + 1)}
                className="p-1.5 border border-white/10 hover:bg-white/5 disabled:opacity-20 rounded-lg transition-colors"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
