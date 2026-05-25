import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,

  // Release Tracking
  environment: process.env.NODE_ENV,

  // Não enviar erros locais
  enabled: process.env.NODE_ENV === 'production',

  // Ignorar erros de extensões de browser e erros não-críticos
  ignoreErrors: [
    'ResizeObserver loop',
    'Non-Error exception captured',
    'Non-Error promise rejection captured',
    /^NetworkError/,
    /^ChunkLoadError/,
  ],

  beforeSend(event) {
    // Não enviar dados pessoais acidentais
    if (event.user) {
      delete event.user.ip_address;
    }
    return event;
  },
});
