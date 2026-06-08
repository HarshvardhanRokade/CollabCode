import { X, CheckCircle2, AlertCircle, Timer, TerminalSquare } from 'lucide-react';

export default function Terminal({ output, onClose }) {
  if (!output) return null;

  const hasError = output.error && output.error.trim().length > 0;

  return (
    <div className="flex flex-col h-full w-full bg-[#0A0A0F] font-mono selection:bg-emerald-500/30">
      
      {/* ── Terminal Header ───────────────────── */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#12121A] border-b border-zinc-800/80 shrink-0">
        <div className="flex items-center gap-5">
          
          {/* Status Indicator */}
          <div className="flex items-center gap-1.5">
            {hasError ? (
              <>
                <AlertCircle size={14} className="text-red-400" />
                <span className="text-xs font-bold tracking-wide text-red-400">Execution Error</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={14} className="text-emerald-400" />
                <span className="text-xs font-bold tracking-wide text-emerald-400">Output Success</span>
              </>
            )}
          </div>

          <div className="h-4 w-[1px] bg-zinc-700/50"></div>
          
          {/* Metadata */}
          {output.status && (
            <div className="flex items-center gap-1.5 text-zinc-500 text-xs">
              <TerminalSquare size={13} />
              <span>{output.status}</span>
            </div>
          )}
          
          {output.executionTime !== undefined && (
            <div className="flex items-center gap-1.5 text-zinc-500 text-xs">
              <Timer size={13} />
              <span>{output.executionTime}s</span>
            </div>
          )}
        </div>

        {/* Close Action */}
        <button
          onClick={onClose}
          className="text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 p-1 rounded transition-colors"
          title="Close Terminal"
        >
          <X size={16} />
        </button>
      </div>

      {/* ── Terminal Body ─────────────────────── */}
      <div className="flex-1 p-4 overflow-y-auto">
        <pre 
          className={`m-0 text-[13px] leading-relaxed whitespace-pre-wrap font-medium ${
            hasError ? 'text-red-400' : 'text-zinc-300'
          }`}
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          {hasError ? output.error : (output.output || '(no output)')}
        </pre>
      </div>
    </div>
  );
}