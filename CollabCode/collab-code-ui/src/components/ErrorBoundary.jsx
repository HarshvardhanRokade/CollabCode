import { Component } from 'react';
import { ServerCrash, ArrowLeft } from 'lucide-react';

export default class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#0A0A0F] p-6 font-sans selection:bg-red-500/30">
          
          {/* Icon Container */}
          <div className="w-16 h-16 mb-6 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shadow-lg shadow-red-500/5">
            <ServerCrash className="w-8 h-8 text-red-500" />
          </div>
          
          {/* Text Content */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-zinc-100 mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
              Something went wrong
            </h2>
            <p className="text-sm text-zinc-500 max-w-md mx-auto leading-relaxed">
              {this.state.error?.message || 'An unexpected layout or rendering error occurred in the workspace. Please return to the dashboard and try again.'}
            </p>
          </div>
          
          {/* Action Button */}
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="flex items-center gap-2 px-6 py-2.5 bg-zinc-800/50 hover:bg-zinc-800 text-zinc-300 hover:text-white text-sm font-semibold rounded-xl transition-all border border-zinc-700/50 hover:border-zinc-700"
          >
            <ArrowLeft size={16} /> 
            Back to Dashboard
          </button>

        </div>
      );
    }
    
    return this.props.children;
  }
}