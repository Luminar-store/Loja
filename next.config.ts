import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Corrigido: lint deve falhar o build para detectar problemas
  eslint: {
    ignoreDuringBuilds: false,
    dirs: ['app', 'components', 'lib', 'hooks', 'services', 'context', 'contexts'],
  },

  typescript: {
    ignoreBuildErrors: false,
  },

  // Removido: output standalone é para Docker/self-hosted, não Vercel
  // output: 'standalone',

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.in',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },

  transpilePackages: ['motion'],

  webpack: (config, { dev }) => {
    // HMR desabilitado em AI Studio via DISABLE_HMR env var.
    if (dev && process.env.DISABLE_HMR === 'true') {
      config.watchOptions = {
        ignored: /.*/,
      };
    }
    return config;
  },
};

export default withSentryConfig(nextConfig, {
  // Sentry project config
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Silenciar output do Sentry no build
  silent: !process.env.CI,

  // Upload source maps apenas em produção
  disableLogger: true,

  // Não verificar versão em dev
  autoInstrumentServerFunctions: process.env.NODE_ENV === 'production',
});
