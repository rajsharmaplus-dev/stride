import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
          <div className="bg-red-50 p-6 rounded-[2.5rem] border border-red-100 mb-8 shadow-xl shadow-red-500/5">
            <AlertTriangle size={48} className="text-red-500 mx-auto" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-3">Something went wrong</h1>
          <p className="text-slate-500 font-medium max-w-md mx-auto mb-10 leading-relaxed">
            Stride encountered an unexpected internal error. Your session data is safe, but the current view could not be rendered.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95"
            >
              <RefreshCw size={16} />
              Reload Application
            </button>
            <button
              onClick={() => {
                this.setState({ hasError: false });
                window.location.href = '/';
              }}
              className="flex items-center gap-2 px-8 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95"
            >
              <Home size={16} />
              Return Home
            </button>
          </div>
          
          {import.meta.env.DEV && (
            <div className="mt-12 p-6 bg-slate-100 rounded-2xl text-left max-w-2xl w-full overflow-auto border border-slate-200">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 text-center">Developer Trace</p>
              <pre className="text-xs text-red-600 font-mono whitespace-pre-wrap leading-relaxed">
                {this.state.error?.stack}
              </pre>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
