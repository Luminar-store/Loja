import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Finalizar Compra | Luminar Joias',
  description: 'Conclua seu pedido sob encomenda de forma rápida, segura e encriptada.',
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
  alternates: {
    canonical: '/checkout',
  },
};

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
