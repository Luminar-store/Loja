'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  Users, 
  ShoppingBag, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight, 
  Loader2, 
  Package, 
  Calendar 
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '@/lib/supabase';
import { format, subDays, startOfDay, endOfDay, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface DashboardStats {
  revenue: number;
  ordersTodayCount: number;
  totalCustomers: number;
  averageTicket: number;
}

interface RecentOrder {
  id: string;
  customerName: string;
  date: string;
  status: string;
  total: number;
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    revenue: 0,
    ordersTodayCount: 0,
    totalCustomers: 0,
    averageTicket: 0
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [chartData, setChartData] = useState<{ name: string; vendas: number }[]>([]);
  const [timeRange, setTimeRange] = useState('7'); // '7' dias por padrão

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // 1. Carrega todas as ordens
        const { data: orders, error: ordersError } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });

        if (ordersError) throw ordersError;

        // 2. Carrega quantidade de clientes
        const { count: customersCount, error: custError } = await supabase
          .from('customers')
          .select('*', { count: 'exact', head: true });

        if (custError) throw custError;

        const totalCustomersVal = customersCount || 0;

        // --- Cálculos de Métricas Reais ---
        const today = new Date();
        const startOfToday = startOfDay(today);
        const endOfToday = endOfDay(today);

        let revenueSum = 0;
        let ordersToday = 0;
        let validOrdersCount = 0;

        (orders || []).forEach(order => {
          const orderDate = parseISO(order.created_at);
          const price = order.total_price || 0;

          // Receita total de pedidos pagos ou não cancelados
          if (order.status !== 'Cancelado' && order.status !== 'cancelado') {
            revenueSum += price;
            validOrdersCount++;
          }

          // Pedidos criados hoje
          if (orderDate >= startOfToday && orderDate <= endOfToday) {
            ordersToday++;
          }
        });

        const avgTicket = validOrdersCount > 0 ? revenueSum / validOrdersCount : 0;

        setStats({
          revenue: revenueSum,
          ordersTodayCount: ordersToday,
          totalCustomers: totalCustomersVal,
          averageTicket: avgTicket
        });

        // --- Mapeia Pedidos Recentes Reais (Máximo 5) ---
        const mappedRecent: RecentOrder[] = (orders || []).slice(0, 5).map(order => {
          const orderDate = parseISO(order.created_at);
          return {
            id: order.gateway_reference || `#ORD-${order.id.slice(0, 6).toUpperCase()}`,
            customerName: order.customer_name || 'Cliente Indefinido',
            date: format(orderDate, "dd 'de' MMM, HH:mm", { locale: ptBR }),
            status: order.status || 'Pendente',
            total: order.total_price || 0
          };
        });
        setRecentOrders(mappedRecent);

        // --- Geração de Dados Reais do Gráfico de Vendas ---
        const daysToFetch = Number(timeRange);
        const tempChartData = [];

        for (let i = daysToFetch - 1; i >= 0; i--) {
          const targetDay = subDays(today, i);
          const dayName = format(targetDay, daysToFetch > 7 ? 'dd/MM' : 'eee', { locale: ptBR });
          
          let dayVendas = 0;
          (orders || []).forEach(order => {
            const orderDate = parseISO(order.created_at);
            if (isSameDay(orderDate, targetDay) && order.status !== 'Cancelado' && order.status !== 'cancelado') {
              dayVendas += order.total_price || 0;
            }
          });

          tempChartData.push({
            name: dayName.charAt(0).toUpperCase() + dayName.slice(1),
            vendas: dayVendas
          });
        }
        setChartData(tempChartData);

      } catch (err: any) {
        console.error('Erro ao carregar dados do Dashboard:', err.message);
        toast.error('Erro ao conectar com as tabelas de pedidos e clientes.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [timeRange]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#d4af37]" />
      </div>
    );
  }

  const statItems = [
    { name: 'Receita Total', value: `R$ ${stats.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, change: 'Banco Real', isPositive: true, icon: DollarSign },
    { name: 'Pedidos Hoje', value: String(stats.ordersTodayCount), change: 'Hoje', isPositive: true, icon: ShoppingBag },
    { name: 'Clientes Reais', value: String(stats.totalCustomers), change: 'Base Ativa', isPositive: true, icon: Users },
    { name: 'Ticket Médio', value: `R$ ${stats.averageTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, change: 'Média Vendas', isPositive: true, icon: TrendingUp },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-serif text-white tracking-wide">Visão Geral</h1>
          <p className="text-white/50 text-sm mt-1">Acompanhe as vendas e métricas reais do seu e-commerce Luminar.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statItems.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="bg-[#131313] border border-white/5 p-6 rounded-2xl hover:border-white/10 transition-colors"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-[#1A1A1A] rounded-xl text-[#d4af37]">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-full text-green-400 bg-green-400/10">
                  <ArrowUpRight className="w-3 h-3" />
                  {stat.change}
                </div>
              </div>
              <div>
                <p className="text-white/50 text-xs uppercase tracking-widest font-bold mb-1">{stat.name}</p>
                <h3 className="text-2xl font-serif text-white tracking-wide">{stat.value}</h3>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Desempenho de Vendas */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="lg:col-span-2 bg-[#131313] border border-white/5 p-6 rounded-2xl"
        >
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-serif">Desempenho de Vendas</h3>
              <p className="text-xs text-white/40 mt-1">Volume total arrecadado das vendas ativas por período.</p>
            </div>
            <select 
              value={timeRange} 
              onChange={e => setTimeRange(e.target.value)}
              className="bg-[#1A1A1A] border border-white/10 text-white text-xs px-3 py-1.5 rounded-lg outline-none focus:border-[#d4af37] transition-colors"
            >
              <option value="7">Últimos 7 dias</option>
              <option value="15">Últimos 15 dias</option>
              <option value="30">Últimos 30 dias</option>
            </select>
          </div>
          <div className="h-[300px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorVendas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d4af37" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#d4af37" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(value) => `R$ ${Number(value || 0).toLocaleString('pt-BR')}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1A1A1A', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  itemStyle={{ color: '#d4af37' }}
                  formatter={(value) => [`R$ ${Number(value || 0).toLocaleString('pt-BR')}`, 'Vendas']}
                />
                <Area type="monotone" dataKey="vendas" stroke="#d4af37" strokeWidth={2} fillOpacity={1} fill="url(#colorVendas)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Últimos Pedidos Reais */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="bg-[#131313] border border-white/5 p-6 rounded-2xl flex flex-col justify-between"
        >
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-serif">Últimos Pedidos</h3>
              <Link href="/admin/orders" className="text-[#d4af37] text-xs font-bold uppercase tracking-widest hover:text-white transition-colors">
                Ver todos
              </Link>
            </div>
            
            {recentOrders.length === 0 ? (
              <div className="h-48 border border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center text-white/30 text-xs">
                <ShoppingBag className="w-5 h-5 mb-2 opacity-55" />
                Nenhum pedido efetuado ainda.
              </div>
            ) : (
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-[#1A1A1A] transition-colors border border-transparent hover:border-white/5">
                    <div className="min-w-0 flex-grow pr-3">
                      <p className="text-xs font-bold text-white truncate">{order.customerName}</p>
                      <div className="flex items-center gap-1.5 mt-1 font-mono text-[9px] text-white/40">
                        <span>{order.id}</span>
                        <span>•</span>
                        <span>{order.date}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-serif text-[#d4af37] mb-1 font-bold">R$ {order.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      <span className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                        order.status === 'Pago' || order.status === 'pago' || order.status === 'Aprovado' ? 'text-green-400 border-green-400/20 bg-green-400/10' :
                        order.status === 'Processando' || order.status === 'processando' ? 'text-yellow-400 border-yellow-400/20 bg-yellow-400/10' :
                        order.status === 'Enviado' || order.status === 'enviado' ? 'text-blue-400 border-blue-400/20 bg-blue-400/10' :
                        'text-white/60 border-white/10 bg-white/5'
                      }`}>{order.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
