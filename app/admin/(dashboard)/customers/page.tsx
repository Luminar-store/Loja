'use client';

import { motion } from 'motion/react';
import { Search, ExternalLink } from 'lucide-react';

const CUSTOMERS_MOCK = [
  { id: '1', name: 'Mariana Silva', email: 'mariana.silva@email.com', spent: 'R$ 38.500', orders: 4, joined: 'Mar 2025' },
  { id: '2', name: 'Carlos Eduardo', email: 'carlos.edu@email.com', spent: 'R$ 14.800', orders: 2, joined: 'Ago 2025' },
  { id: '3', name: 'Ana Beatriz', email: 'ana.beatriz@email.com', spent: 'R$ 22.500', orders: 1, joined: 'Nov 2026' },
  { id: '4', name: 'Juliana Costa', email: 'juhcosta@email.com', spent: 'R$ 54.900', orders: 7, joined: 'Jan 2024' },
];

export default function CustomersPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-serif text-white tracking-wide">Clientes</h1>
          <p className="text-white/50 text-sm mt-1">Gerencie a base de clientes da Luminar.</p>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#131313] border border-white/5 rounded-2xl overflow-hidden"
      >
        <div className="p-4 border-b border-white/5 flex flex-col sm:flex-row gap-4 items-center justify-between bg-[#1A1A1A]/50">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input 
              type="text" 
              placeholder="Buscar por nome ou email..." 
              className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg py-2 pl-9 pr-4 text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#d4af37] transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-white/50 uppercase tracking-widest bg-[#1A1A1A]/30">
              <tr>
                <th className="px-6 py-4 font-medium">Cliente</th>
                <th className="px-6 py-4 font-medium">Email</th>
                <th className="px-6 py-4 font-medium">Total Gasto</th>
                <th className="px-6 py-4 font-medium">Pedidos</th>
                <th className="px-6 py-4 font-medium">Cliente Desde</th>
                <th className="px-6 py-4 font-medium text-right">Perfil</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {CUSTOMERS_MOCK.map((customer) => (
                <tr key={customer.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-4 font-medium text-white flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#1A1A1A] border border-white/10 flex items-center justify-center text-xs font-bold text-[#d4af37] uppercase">
                      {customer.name.substring(0,2)}
                    </div>
                    {customer.name}
                  </td>
                  <td className="px-6 py-4 text-white/70">{customer.email}</td>
                  <td className="px-6 py-4 font-serif text-[#d4af37]">{customer.spent}</td>
                  <td className="px-6 py-4 text-white/70">{customer.orders}</td>
                  <td className="px-6 py-4 text-white/70">{customer.joined}</td>
                  <td className="px-6 py-4 text-right">
                    <button className="inline-flex items-center justify-center p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
