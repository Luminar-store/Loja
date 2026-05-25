'use client';

import { motion } from 'motion/react';
import { TrendingUp, Users, ShoppingBag, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const CHART_DATA = [
  { name: 'Seg', uv: 4000, pv: 2400, amt: 2400 },
  { name: 'Ter', uv: 3000, pv: 1398, amt: 2210 },
  { name: 'Qua', uv: 2000, pv: 9800, amt: 2290 },
  { name: 'Qui', uv: 2780, pv: 3908, amt: 2000 },
  { name: 'Sex', uv: 1890, pv: 4800, amt: 2181 },
  { name: 'Sáb', uv: 2390, pv: 3800, amt: 2500 },
  { name: 'Dom', uv: 3490, pv: 4300, amt: 2100 },
];

const STATS = [
  { name: 'Receita Total', value: 'R$ 145.280', change: '+12.5%', isPositive: true, icon: DollarSign },
  { name: 'Pedidos Hoje', value: '24', change: '+5.2%', isPositive: true, icon: ShoppingBag },
  { name: 'Produtos Vendidos', value: '186', change: '-2.4%', isPositive: false, icon: PackageIcon },
  { name: 'Ticket Médio', value: 'R$ 6.053', change: '+8.1%', isPositive: true, icon: TrendingUp },
];

function PackageIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M16.5 9.4 7.5 4.21"></path>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
      <line x1="12" y1="22.08" x2="12" y2="12"></line>
    </svg>
  )
}

const RECENT_ORDERS = [
  { id: '#ORD-001', customer: 'Mariana Silva', date: 'Hoje, 14:30', status: 'Pago', total: 'R$ 12.500' },
  { id: '#ORD-002', customer: 'Carlos Eduardo', date: 'Hoje, 11:15', status: 'Processando', total: 'R$ 4.280' },
  { id: '#ORD-003', customer: 'Ana Beatriz', date: 'Ontem, 16:45', status: 'Enviado', total: 'R$ 18.900' },
  { id: '#ORD-004', customer: 'Juliana Costa', date: 'Ontem, 09:20', status: 'Entregue', total: 'R$ 3.150' },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-serif text-white tracking-wide">Visão Geral</h1>
          <p className="text-white/50 text-sm mt-1">Acompanhe as métricas da sua loja em tempo real.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((stat, i) => {
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
                <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${stat.isPositive ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'}`}>
                  {stat.isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {stat.change}
                </div>
              </div>
              <div>
                <p className="text-white/50 text-xs uppercase tracking-widest font-bold mb-1">{stat.name}</p>
                <h3 className="text-3xl font-serif text-white">{stat.value}</h3>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Placeholder for Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="lg:col-span-2 bg-[#131313] border border-white/5 p-6 rounded-2xl"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-serif">Desempenho de Vendas</h3>
            <select className="bg-[#1A1A1A] border border-white/10 text-white text-xs px-3 py-1.5 rounded-lg outline-none focus:border-[#d4af37]">
              <option>Últimos 7 dias</option>
              <option>Últimos 30 dias</option>
              <option>Este ano</option>
            </select>
          </div>
          <div className="h-[300px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={CHART_DATA}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d4af37" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#d4af37" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value/1000}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1A1A1A', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#d4af37' }}
                />
                <Area type="monotone" dataKey="uv" stroke="#d4af37" strokeWidth={2} fillOpacity={1} fill="url(#colorUv)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Recent Orders */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="bg-[#131313] border border-white/5 p-6 rounded-2xl"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-serif">Últimos Pedidos</h3>
            <button className="text-[#d4af37] text-xs font-bold uppercase tracking-widest hover:text-white transition-colors">Ver todos</button>
          </div>
          
          <div className="space-y-4">
            {RECENT_ORDERS.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-[#1A1A1A] transition-colors border border-transparent hover:border-white/5">
                <div>
                  <p className="text-sm font-medium text-white">{order.customer}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-white/40">{order.id}</span>
                    <span className="w-1 h-1 bg-white/20 rounded-full"></span>
                    <span className="text-xs text-white/40">{order.date}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-serif text-[#d4af37] mb-1">{order.total}</p>
                  <span className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded border ${
                    order.status === 'Pago' ? 'text-green-400 border-green-400/20 bg-green-400/10' :
                    order.status === 'Processando' ? 'text-yellow-400 border-yellow-400/20 bg-yellow-400/10' :
                    order.status === 'Enviado' ? 'text-blue-400 border-blue-400/20 bg-blue-400/10' :
                    'text-white/60 border-white/10 bg-white/5'
                  }`}>{order.status}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
