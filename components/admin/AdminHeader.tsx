import { Bell, Search } from 'lucide-react';
import Image from 'next/image';

export function AdminHeader() {
  return (
    <header className="h-20 bg-[#0B0B0B] border-b border-white/5 flex items-center justify-between px-6 pl-16 md:pl-6 sticky top-0 z-30">
      <div className="flex-1 max-w-xl hidden md:flex">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input 
            type="text" 
            placeholder="Buscar produtos, pedidos ou clientes..." 
            className="w-full bg-[#131313] border border-white/5 rounded-full py-2 pl-10 pr-4 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#d4af37]/50 focus:bg-[#1A1A1A] transition-all"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-6 ml-auto">
        <button className="relative text-white/60 hover:text-white transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#d4af37] rounded-full"></span>
        </button>
        
        <div className="flex items-center gap-3 border-l border-white/10 pl-6 cursor-pointer group">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-white group-hover:text-[#d4af37] transition-colors">Helena Martins</p>
            <p className="text-xs text-white/50 uppercase tracking-wider font-bold">Administrador</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#1A1A1A] border border-[#d4af37]/30 p-0.5 overflow-hidden relative">
            <Image 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuATGpP3MkFYBgsyzxY43vVkjmkJeDRr07FA9pQw8LRU1v1P_21wOw5oXXDlZ9TMqOJJl9HoAQmv0EWq4WNFRWEIQb900Mz0NZArwjfaCUbYTtCUKJyaaSTY4Lu6KDkAcpMIqmU6IeK28F9aCGWUyCxTEhtD-1RtlLN9Js2tsgNwNvQtF45VYvYMhvfuRBIpywOn3QfN41j7N74wo3fjJ4jJ3tC4JqK-gbXGgPHo3D3v4ZTHKHRxmiYiLjtRzG4Gxb7Bdr8HVjm--i4" 
              alt="Admin" 
              fill
              className="object-cover rounded-full"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
