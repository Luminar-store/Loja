import { Metadata } from 'next';
import { customOrdersService } from '@/services/custom-orders.service';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Pedidos Personalizados | Luminar Admin',
};

// Next.js 15+ allows async components anywhere but in Pages we should make them async and await data
export default async function CustomOrdersPage() {
  let orders: any[] = [];
  try {
    orders = await customOrdersService.getOrders();
  } catch(e) {
    console.error(e);
  }

  const getStatusColor = (status: string) => {
    switch(status.toLowerCase()) {
      case 'pending': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'em produção': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'finalizado': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'enviado': return 'bg-green-500/10 text-green-500 border-green-500/20';
      default: return 'bg-white/5 text-white/50 border-white/10';
    }
  };

  const getStatusText = (status: string) => {
    switch(status.toLowerCase()) {
      case 'pending': return 'Pedido Recebido';
      case 'em produção': return 'Em Produção';
      case 'finalizado': return 'Finalizado';
      case 'enviado': return 'Enviado';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl text-white">Pedidos Personalizados</h1>
          <p className="text-sm text-white/50 mt-1 font-sans">Gerencie orçamentos e pedidos via WhatsApp</p>
        </div>
      </div>

      <div className="bg-[#1A1A1A] border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-white/40 text-xs uppercase tracking-widest font-sans">
                <th className="p-4 sm:p-6 font-medium">Cliente</th>
                <th className="p-4 sm:p-6 font-medium">Peça</th>
                <th className="p-4 sm:p-6 font-medium">Data</th>
                <th className="p-4 sm:p-6 font-medium">Status</th>
                <th className="p-4 sm:p-6 font-medium text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-white/40 text-sm font-sans">
                    Nenhum pedido personalizado encontrado.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="p-4 sm:p-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-white">{order.customer_name || 'Anônimo'}</span>
                        <span className="text-xs text-white/50">{order.customer_phone || '-'}</span>
                      </div>
                    </td>
                    <td className="p-4 sm:p-6">
                      <div className="flex flex-col">
                        <span className="text-sm text-white">{order.model}</span>
                        <span className="text-xs text-[#D4AF37]">{order.material} • {order.length}</span>
                      </div>
                    </td>
                    <td className="p-4 sm:p-6 text-sm text-white/70 font-sans">
                      {order.created_at ? format(new Date(order.created_at), "dd 'de' MMM, yy", { locale: ptBR }) : '-'}
                    </td>
                    <td className="p-4 sm:p-6">
                      <span className={`inline-flex px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest border ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                    </td>
                    <td className="p-4 sm:p-6 text-right">
                      <a href={`/admin/custom-orders/${order.id}`} className="text-[#D4AF37] text-sm hover:underline font-bold uppercase tracking-widest text-[10px]">
                        Ver Detalhes
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
