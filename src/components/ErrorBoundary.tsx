import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  props: Props;
  state: State;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught React Error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-2xl">
            <span className="text-4xl mb-4 block">⚠️</span>
            <h1 className="text-xl font-black text-amber-400 mb-2">Ops! Ocorreu um imprevisto</h1>
            <p className="text-xs text-slate-300 mb-6">
              Ocorreu um erro inesperado na interface. Clique no botão abaixo para recarregar o sistema.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-3 px-4 rounded-2xl transition shadow-lg text-sm"
            >
              Recarregar Sistema
            </button>
            {this.state.error && (
              <details className="mt-4 text-left">
                <summary className="text-[10px] text-slate-500 cursor-pointer">Ver detalhes técnicos</summary>
                <pre className="text-[10px] text-red-300 bg-slate-950 p-2 rounded-xl mt-2 overflow-x-auto font-mono">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
