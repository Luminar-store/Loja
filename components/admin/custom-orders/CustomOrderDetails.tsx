'use client';

import { CustomOrder } from '@/types/custom-orders';
import { useState } from 'react';
import { customOrdersService } from '@/services/custom-orders.service';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';

interface CustomOrderDetailsProps {
  initialOrder: CustomOrder;
}

const STATUS_OPTIONS = ['pending', 'Em Produção', 'Finalizado', 'Enviado'];

export function CustomOrderDetails({ initialOrder }: CustomOrderDetailsProps) {
  const [order, setOrder] = useState<CustomOrder>(initialOrder);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    setIsUpdating(true);
    try {
      await customOrdersService.updateOrderStatus(order.id, newStatus);
      setOrder({ ...order, status: newStatus });
      toast.success('Status atualizado');
    } catch {
      toast.error('Erro ao atualizar status');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/admin/custom-orders" className="text-white/50 hover:text-white transition-colors flex items-center gap-2 font-sans text-sm tracking-widest uppercase mb-4">
          <ArrowLeft className="w-5 h-5" strokeWidth={2} />
          Voltar
        </Link>
      </div>

      <div className="bg-[#1A1A1A] p-6 lg:p-10 rounded-2xl border border-white/5 space-y-10">
        
        {/* Header section with status */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-white/10 pb-6">
          <div className="space-y-2">
            <h1 className="font-serif text-3xl text-white">Pedido #{order.id.slice(0,8)}</h1>
            <p className="font-sans text-white/50 text-sm">
              Criado em {order.created_at ? format(new Date(order.created_at), "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: ptBR }) : '-'}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[10px] uppercase tracking-widest font-bold text-white/40">Status do Pedido</label>
            <select
              value={order.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={isUpdating}
              className="bg-[#131313] border border-white/10 text-white text-sm rounded-lg focus:ring-[#D4AF37] focus:border-[#D4AF37] block w-full p-2.5 outline-none font-sans appearance-none disabled:opacity-50"
            >
              {STATUS_OPTIONS.map(status => (
                <option key={status} value={status}>
                  {status === 'pending' ? 'Pedido Recebido' : status}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Customer Info */}
        <section className="space-y-4">
          <h2 className="font-sans text-[12px] uppercase tracking-[0.2em] text-[#D4AF37] font-bold">Informações do Cliente</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-[#131313] p-4 rounded-xl border border-white/5">
              <span className="block text-[10px] uppercase tracking-widest text-white/40 mb-1">Nome</span>
              <span className="text-white font-sans">{order.customer_name || 'Não fornecido'}</span>
            </div>
            <div className="bg-[#131313] p-4 rounded-xl border border-white/5">
              <span className="block text-[10px] uppercase tracking-widest text-white/40 mb-1">WhatsApp</span>
              <span className="text-white font-sans">{order.customer_phone || 'Não fornecido'}</span>
              {order.customer_phone && (
                <a 
                  href={`https://wa.me/${order.customer_phone.replace(/\D/g, '')}`} 
                  target="_blank" 
                  className="text-[10px] text-[#D4AF37] hover:underline ml-2"
                >
                  Abrir WhatsApp
                </a>
              )}
            </div>
          </div>
        </section>

        {/* Specification */}
        <section className="space-y-4">
          <h2 className="font-sans text-[12px] uppercase tracking-[0.2em] text-[#D4AF37] font-bold">Especificações da Joia</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-[#131313] p-4 rounded-xl border border-white/5">
              <span className="block text-[10px] uppercase tracking-widest text-white/40 mb-1">Modelo</span>
              <span className="text-white font-sans">{order.model}</span>
            </div>
            <div className="bg-[#131313] p-4 rounded-xl border border-white/5">
              <span className="block text-[10px] uppercase tracking-widest text-white/40 mb-1">Material</span>
              <span className="text-white font-sans">{order.material}</span>
            </div>
            <div className="bg-[#131313] p-4 rounded-xl border border-white/5">
              <span className="block text-[10px] uppercase tracking-widest text-white/40 mb-1">Comprimento</span>
              <span className="text-white font-sans">{order.length}</span>
            </div>
            <div className="bg-[#131313] p-4 rounded-xl border border-white/5">
              <span className="block text-[10px] uppercase tracking-widest text-white/40 mb-1">Espessura</span>
              <span className="text-white font-sans">{order.thickness}</span>
            </div>
          </div>
        </section>

        {/* Notes & Image */}
        <section className="grid md:grid-cols-2 gap-8">
          {order.notes && (
            <div className="space-y-4">
              <h2 className="font-sans text-[12px] uppercase tracking-[0.2em] text-[#D4AF37] font-bold">Observações</h2>
              <div className="bg-[#131313] p-4 rounded-xl border border-white/5 h-full min-h-[#8rem]">
                <p className="text-white/70 font-sans text-sm whitespace-pre-wrap">{order.notes}</p>
              </div>
            </div>
          )}
          
          {order.reference_image && (
            <div className="space-y-4">
              <h2 className="font-sans text-[12px] uppercase tracking-[0.2em] text-[#D4AF37] font-bold">Imagem de Referência</h2>
              <div className="bg-[#131313] p-2 rounded-xl border border-white/5 w-fit">
                <a href={order.reference_image} target="_blank" rel="noreferrer">
                  <Image 
                    src={order.reference_image} 
                    alt="Referência" 
                    width={200}
                    height={200}
                    className="rounded-lg object-cover"
                    unoptimized
                  />
                </a>
              </div>
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
