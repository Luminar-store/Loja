import type { Metadata } from 'next';
import { Noto_Serif, Manrope } from 'next/font/google';
import './globals.css';
import { LayoutWrapper } from '@/components/LayoutWrapper';

const notoSerif = Noto_Serif({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-noto-serif',
});

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['300', '400', '600'],
  variable: '--font-manrope',
});

export const metadata: Metadata = {
  title: 'Luminar Joias | The Black Box',
  description: 'Exclusividade e elegância em alta joalheria. Bem-vindo à Luminar Joias.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${notoSerif.variable} ${manrope.variable} dark w-full`} suppressHydrationWarning>
      <head />
      <body className="bg-[#131313] text-[#e5e2e1] font-sans antialiased min-h-[100dvh] w-full flex flex-col selection:bg-[#D4AF37] selection:text-black pb-16 md:pb-0">
        <LayoutWrapper>
          {children}
        </LayoutWrapper>
      </body>
    </html>
  );
}
