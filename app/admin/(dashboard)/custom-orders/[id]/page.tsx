import { customOrdersService } from '@/services/custom-orders.service';
import { notFound } from 'next/navigation';
import { CustomOrderDetails } from '@/components/admin/custom-orders/CustomOrderDetails';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Detalhes do Pedido Personalizado | Luminar Admin',
};

export default async function CustomOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  let order = null;
  try {
    order = await customOrdersService.getOrderById(resolvedParams.id);
  } catch(e) {
    console.error(e);
  }

  if (!order) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <CustomOrderDetails initialOrder={order} />
    </div>
  );
}
