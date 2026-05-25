'use client';

import { usePathname } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CartDrawer } from '@/components/CartDrawer';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import { AuthProvider } from '@/contexts/AuthContext';
import { CartProvider } from '@/context/CartContext';

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');

  if (isAdmin) {
    return (
      <AuthProvider>
        <main className="flex-1 w-full bg-[#0B0B0B] min-h-[100dvh] text-white">
          {children}
        </main>
      </AuthProvider>
    );
  }

  return (
    <CartProvider>
      <Navbar />
      <main className="flex-1 w-full pt-20">
        {children}
      </main>
      <Footer />
      <CartDrawer />
      <WhatsAppButton />
    </CartProvider>
  );
}
