'use client';

import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Search, Filter, Loader2, RefreshCw, AlertCircle, Receipt } from 'lucide-react';
import { useOrders, type Order } from '@/hooks/useOrders';
import { formatPrice } from '@/lib/data';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  paid: { label: 'Pago', className: 'bg-green-400/10 text-green-400 border-green-400/20' },
  pending: { label: 'Pendente', className: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20' },
  production: { label: 'Em Produção', className: 'bg-blue-400/10 text-blue-400 border-blue-400/20' },
  shipped: { label: 'Enviado', className: 'bg-violet-400/10 text-violet-400 border-violet-400/20' },
  delivered: { label: 'Entregue', className: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20' },
  cancelled: { label: 'Cancelado', className: 'bg-red-400/10 text-red-400 border-red-400/20' },
};

function getPaymentStatusConfig(status: string | null) {
  return STATUS_CONFIG[status ?? ''] ?? { label: status ?? '—', className: 'bg-white/10 text-white/70 border-white/20' };
}

export default function OrdersPage() {
  const { orders, loading, error, refetch } = useOrders();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const filtered = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        !search ||
        order.order_nsu?.toLowerCase().includes(search.toLowerCase()) ||
        order.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
        order.customer_email?.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        filterStatus === 'all' ||
        order.payment_status === filterStatus ||
        order.status === filterStatus;

      return matchesSearch && matchesStatus;
    });
  }, [orders, search, filterStatus]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-serif text-white tracking-wide">Pedidos</h1>
          <p className="text-white/50 text-sm mt-1">
            {loading ? 'Carregando...' : `${orders.length} pedidos encontrados`}
          </p>
        </div>
        <button
          onClick={refetch}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 border border-white/10 rounded-lg text-sm text-white/70 hover:text-white hover:border-white/20 transition-all bg-[#1A1A1A] disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#131313] border border-white/5 rounded-2xl overflow-hidden"
      >
        {/* Barra de filtros */}
        <div className="p-4 border-b border-white/5 flex flex-col sm:flex-row gap-4 items-center justify-between bg-[#1A1A1A]/50">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              placeholder="Buscar por NSU, cliente ou email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg py-2 pl-9 pr-4 text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#d4af37] transition-all"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-white/40 flex-shrink-0" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-[#1A1A1A] border border-white/10 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-[#d4af37] transition-all w-full sm:w-auto"
            >
              <option value="all">Todos os status</option>
              <option value="pending">Pendente</option>
              <option value="paid">Pago</option>
              <option value="production">Em Produção</option>
              <option value="shipped">Enviado</option>
              <option value="delivered">Entregue</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>
        </div>

        {/* Tabela */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-white/50 uppercase tracking-widest bg-[#1A1A1A]/30">
              <tr>
                <th className="px-6 py-4 font-medium">NSU / Pedido</th>
                <th className="px-6 py-4 font-medium">Cliente</th>
                <th className="px-6 py-4 font-medium">Data</th>
                <th className="px-6 py-4 font-medium">Valor Total</th>
                <th className="px-6 py-4 font-medium">Pagamento</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-white/50">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#d4af37]" />
                    Carregando pedidos...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <AlertCircle className="w-6 h-6 mx-auto mb-2 text-red-400" />
                    <p className="text-red-400 text-sm">{error}</p>
                    <button onClick={refetch} className="mt-3 text-xs text-white/50 hover:text-white underline">
                      Tentar novamente
                    </button>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-white/50">
                    {search || filterStatus !== 'all' ? 'Nenhum pedido corresponde aos filtros.' : 'Nenhum pedido cadastrado ainda.'}
                  </td>
                </tr>
              ) : (
                filtered.map((order: Order) => {
                  const paymentConf = getPaymentStatusConfig(order.payment_status);
                  const statusConf = getPaymentStatusConfig(order.status);
                  return (
                    <tr key={order.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-6 py-4 font-medium text-white font-mono text-xs">
                        {order.order_nsu ?? order.id.slice(0, 8)}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-white font-medium">{order.customer_name ?? '—'}</p>
                          <p className="text-white/40 text-xs">{order.customer_email ?? ''}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-white/70">
                        {format(new Date(order.created_at), "dd/MM/yy 'às' HH:mm", { locale: ptBR })}
                      </td>
                      <td className="px-6 py-4 font-serif text-[#d4af37]">
                        {order.total_price != null ? formatPrice(order.total_price) : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] uppercase tracking-widest border font-medium ${paymentConf.className}`}>
                          {paymentConf.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] uppercase tracking-widest border font-medium ${statusConf.className}`}>
                          {statusConf.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-3 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          {order.receipt_url && (
                            <a
                              href={order.receipt_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-white/50 hover:text-[#d4af37] hover:bg-[#d4af37]/10 rounded-lg transition-colors"
                              title="Ver comprovante"
                            >
                              <Receipt className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-white/5 flex items-center justify-between text-sm text-white/50">
          <span>{filtered.length} de {orders.length} pedidos</span>
        </div>
      </motion.div>
    </div>
  );
}
