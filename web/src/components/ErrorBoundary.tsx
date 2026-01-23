import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });

    // Log to analytics/error tracking service
    try {
      // Could send to Firebase Analytics or other service
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack
      });
    } catch (e) {
      // Ignore logging errors
    }
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 shadow-xl max-w-md w-full text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={40} className="text-red-500" />
            </div>

            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              Что-то пошло не так
            </h1>
            <p className="text-slate-500 mb-6">
              Произошла непредвиденная ошибка. Попробуйте обновить страницу или вернуться на главную.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-left overflow-auto max-h-40">
                <p className="text-xs font-mono text-red-600 break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={this.handleRetry}
                className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform"
              >
                <RefreshCw size={18} />
                Повторить
              </button>
              <button
                onClick={this.handleGoHome}
                className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform"
              >
                <Home size={18} />
                На главную
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook-based error boundary for async errors
export const useErrorHandler = () => {
  const handleError = (error: Error, context?: string) => {
    console.error(`Error${context ? ` in ${context}` : ''}:`, error);
    // Could dispatch to error tracking service
  };

  return { handleError };
};
