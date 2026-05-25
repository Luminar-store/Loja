'use client';

import { motion } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const SALES_DATA = [
  { name: 'Jan', sales: 4000 },
  { name: 'Fev', sales: 3000 },
  { name: 'Mar', sales: 5000 },
  { name: 'Abr', sales: 2780 },
  { name: 'Mai', sales: 6890 },
  { name: 'Jun', sales: 4390 },
];

const CONVERSION_DATA = [
  { name: 'Seg', rate: 2.1 },
  { name: 'Ter', rate: 2.4 },
  { name: 'Qua', rate: 2.0 },
  { name: 'Qui', rate: 2.8 },
  { name: 'Sex', rate: 3.5 },
  { name: 'Sáb', rate: 4.2 },
  { name: 'Dom', rate: 3.8 },
];

export default function AnalyticsPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-serif text-white tracking-wide">Analytics</h1>
          <p className="text-white/50 text-sm mt-1">Análise profunda de métricas de conversão e vendas.</p>
        </div>
        <select className="bg-[#1A1A1A] border border-white/10 text-white text-sm px-4 py-2.5 rounded-lg outline-none focus:border-[#d4af37]">
          <option>Últimos 30 dias</option>
          <option>Últimos 3 meses</option>
          <option>Este ano</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#131313] border border-white/5 p-6 rounded-2xl"
        >
          <div className="mb-6">
            <h3 className="text-lg font-serif">Receita por Mês</h3>
            <p className="text-white/50 text-xs mt-1 uppercase tracking-widest font-bold">Volume de vendas (R$)</p>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={SALES_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value/1000}k`} />
                <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: '#1A1A1A', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} itemStyle={{ color: '#d4af37' }} />
                <Bar dataKey="sales" fill="#d4af37" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Conversion Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#131313] border border-white/5 p-6 rounded-2xl"
        >
          <div className="mb-6">
            <h3 className="text-lg font-serif">Taxa de Conversão</h3>
            <p className="text-white/50 text-xs mt-1 uppercase tracking-widest font-bold">% de visitantes que compraram</p>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={CONVERSION_DATA} margin={{ top: 10, right: 10, left: -40, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                <Tooltip contentStyle={{ backgroundColor: '#1A1A1A', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} itemStyle={{ color: '#d4af37' }} />
                <Line type="monotone" dataKey="rate" stroke="#d4af37" strokeWidth={3} dot={{ fill: '#0B0B0B', stroke: '#d4af37', strokeWidth: 2, r: 4 }} activeDot={{ r: 6, fill: '#d4af37' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Funnel Metrics */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 bg-[#131313] border border-white/5 p-6 rounded-2xl"
        >
          <h3 className="text-lg font-serif mb-6">Funil de Vendas</h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-[#1A1A1A] rounded-xl border border-white/5">
              <p className="text-white/50 text-xs uppercase tracking-widest font-bold mb-2">Sessões</p>
              <h4 className="text-2xl font-serif text-white">45.280</h4>
            </div>
            <div className="p-4 bg-[#1A1A1A] rounded-xl border border-white/5">
              <p className="text-white/50 text-xs uppercase tracking-widest font-bold mb-2">Produto Visualizado</p>
              <h4 className="text-2xl font-serif text-white">18.400</h4>
              <p className="text-xs text-white/40 mt-1">40.6% das sessões</p>
            </div>
            <div className="p-4 bg-[#1A1A1A] rounded-xl border border-white/5">
              <p className="text-white/50 text-xs uppercase tracking-widest font-bold mb-2">Adicionado ao Carrinho</p>
              <h4 className="text-2xl font-serif text-white">3.120</h4>
              <p className="text-xs text-white/40 mt-1">16.9% das visualizações</p>
            </div>
            <div className="p-4 bg-[#1A1A1A] rounded-xl border border-[#d4af37]/20 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#d4af37]"></div>
              <p className="text-[#d4af37] text-xs uppercase tracking-widest font-bold mb-2 ml-2">Compras Concluídas</p>
              <h4 className="text-2xl font-serif text-white ml-2">845</h4>
              <p className="text-xs text-white/40 mt-1 ml-2">27.0% dos carrinhos</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
