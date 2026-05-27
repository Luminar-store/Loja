'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  BarChart2, 
  Settings, 
  LogOut,
  Menu,
  X,
  Image as ImageIcon
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const MENU_ITEMS = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Produtos', href: '/admin/products', icon: Package },
  { name: 'Pedidos', href: '/admin/orders', icon: ShoppingCart },
  { name: 'Categorias', href: '/admin/categories', icon: Package },
  { name: 'Banners', href: '/admin/banners', icon: ImageIcon },
  { name: 'Personalizados', href: '/admin/custom-orders', icon: Users },
  { name: 'Clientes', href: '/admin/customers', icon: Users },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart2 },
  { name: 'Configurações', href: '/admin/settings', icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { signOut } = useAuth();

  return (
    <>
      <button 
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-[#1A1A1A] rounded-md text-white"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div className={`fixed inset-y-0 left-0 z-40 bg-[#131313] border-r border-white/5 w-64 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6">
          <Link href="/admin/dashboard" className="flex items-center gap-2" onClick={() => setIsOpen(false)}>
            <span className="font-serif text-2xl text-[#d4af37] tracking-widest uppercase">Luminar</span>
          </Link>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {MENU_ITEMS.map((item) => {
            const isActive = pathname?.startsWith(item.href);
            const Icon = item.icon;
            
            return (
              <Link 
                key={item.href} 
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive ? 'bg-[#d4af37]/10 text-[#d4af37]' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
              >
                <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-[#d4af37]' : 'text-white/40 group-hover:text-white/80'}`} />
                <span className="font-sans text-sm font-medium tracking-wide">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5">
          <button 
            onClick={signOut}
            className="flex items-center gap-3 px-4 py-3 text-white/50 hover:text-white hover:bg-white/5 rounded-xl transition-all duration-200 group w-full"
          >
            <LogOut className="w-5 h-5 text-white/40 group-hover:text-white/80 transition-colors" />
            <span className="font-sans text-sm font-medium tracking-wide">Sair</span>
          </button>
        </div>
      </div>
    </>
  );
}
