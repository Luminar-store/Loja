import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Otimização para builds em sandboxes restritos de memória (CI/CD)
  experimental: {
    cpus: 1,
  },

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

// Se DISABLE_SENTRY for verdadeiro (comum em builds de sandboxes com pouca RAM),
// exporta a configuração limpa do Next.js sem carregar plugins de Webpack pesados do Sentry.
const finalConfig = process.env.DISABLE_SENTRY === 'true'
  ? nextConfig
  : withSentryConfig(nextConfig, {
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

export default finalConfig;
