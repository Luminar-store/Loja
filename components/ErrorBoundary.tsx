'use client';

import { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  context?: string;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

/**
 * Error Boundary para capturar erros de render em componentes críticos.
 * Exibe uma mensagem amigável sem expor detalhes técnicos ao usuário.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[ErrorBoundary:${this.props.context ?? 'unknown'}]`, error, info);

    // Enviar para Sentry se disponível
    if (typeof window !== 'undefined' && 'Sentry' in window) {
      (window as any).Sentry?.captureException(error, { extra: info });
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, errorMessage: '' });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center p-8 min-h-[200px] bg-red-500/5 border border-red-500/20 rounded-2xl">
          <AlertTriangle className="text-red-400 w-8 h-8 mb-4" />
          <p className="text-white font-sans font-bold text-sm mb-2">
            Algo deu errado.
          </p>
          <p className="text-white/50 text-xs text-center mb-6 max-w-sm">
            Não foi possível carregar este componente. Por favor, tente novamente.
          </p>
          <button
            onClick={this.handleReset}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-4 py-2.5 rounded-lg uppercase tracking-widest transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Tentar Novamente
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
