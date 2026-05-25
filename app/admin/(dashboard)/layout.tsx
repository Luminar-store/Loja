'use client';

import { useEffect } from 'react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { validateSupabaseConnection } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Toaster } from 'react-hot-toast';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Validar conexão com o Supabase
    validateSupabaseConnection();
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/admin/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex flex-col h-screen overflow-hidden bg-[#0B0B0B] text-white items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#d4af37] mb-4" />
        <p className="tracking-widest uppercase text-xs font-bold text-white/50">Restaurando sessão...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#0B0B0B] text-white">
      <Toaster position="top-right" toastOptions={{ style: { background: '#333', color: '#fff' } }} />
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#0B0B0B] p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
