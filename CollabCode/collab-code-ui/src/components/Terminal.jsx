import { X, CheckCircle2, AlertCircle, Timer, TerminalSquare, HardDrive, Loader2 } from 'lucide-react';

export default function Terminal({ output, onClose, onStdinChange, stdin, isExecuting }) {
  const hasError = output?.error && output.error.trim().length > 0;

  return (
    <div className="flex flex-col h-full w-full bg-[#0A0A0F] font-mono selection:bg-emerald-500/30">
      
      {/* ── Terminal Header ───────────────────── */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#12121A] border-b border-zinc-800/80 shrink-0">
        <div className="flex items-center gap-5">
          
          {/* Status Indicator */}
          <div className="flex items-center gap-1.5">
            {isExecuting ? (
              <>
                <Loader2 size={14} className="text-amber-400 animate-spin" />
                <span className="text-xs font-bold tracking-wide text-amber-400">Running...</span>
              </>
            ) : output ? (
              hasError ? (
                <>
                  <AlertCircle size={14} className="text-red-400" />
                  <span className="text-xs font-bold tracking-wide text-red-400">Execution Error</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={14} className="text-emerald-400" />
                  <span className="text-xs font-bold tracking-wide text-emerald-400">Output Success</span>
                </>
              )
            ) : (
              <>
                <TerminalSquare size={14} className="text-zinc-400" />
                <span className="text-xs font-bold tracking-wide text-zinc-400">Ready</span>
              </>
            )}
          </div>

          <div className="h-4 w-[1px] bg-zinc-700/50"></div>
          
          {/* Metadata */}
          {output?.status && (
            <div className="flex items-center gap-1.5 text-zinc-500 text-xs">
              <TerminalSquare size={13} />
              <span>{output.status}</span>
            </div>
          )}
          
          {output?.executionTime !== undefined && output.executionTime > 0 && (
            <div className="flex items-center gap-1.5 text-zinc-500 text-xs">
              <Timer size={13} />
              <span>{output.executionTime}s</span>
            </div>
          )}

          {output?.memoryUsed !== undefined && output.memoryUsed > 0 && (
            <div className="flex items-center gap-1.5 text-zinc-500 text-xs">
              <HardDrive size={13} />
              <span>{output.memoryUsed} KB</span>
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

      {/* ── Terminal Body (Split Pane) ────────── */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Output Panel */}
        <div className="flex-1 p-4 overflow-y-auto border-r border-zinc-800/80">
          <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-3">
            Output
          </div>

          {/* Loading State */}
          {isExecuting && (
            <div className="text-[13px] text-amber-400/80 font-medium animate-pulse">
              Running your code...
            </div>
          )}

          {/* Empty State */}
          {!isExecuting && !output && (
            <div className="text-[13px] text-zinc-600 font-medium">
              Click Run to execute your code.
            </div>
          )}

          {/* Error Output */}
          {!isExecuting && output && hasError && (
            <pre 
              className="m-0 text-[13px] leading-relaxed whitespace-pre-wrap font-medium break-all text-red-400"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              {output.error}
            </pre>
          )}

          {/* Success Output */}
          {!isExecuting && output && !hasError && (
            <pre 
              className="m-0 text-[13px] leading-relaxed whitespace-pre-wrap font-medium break-all text-zinc-300"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              {output.output || '(no output)'}
            </pre>
          )}
        </div>

        {/* Stdin Panel */}
        <div className="w-64 md:w-72 shrink-0 flex flex-col p-4 bg-[#0A0A0F]">
          <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-3">
            Standard Input (stdin)
          </div>
          
          <textarea
            value={stdin || ''}
            onChange={(e) => onStdinChange(e.target.value)}
            placeholder="Type program input here before running..."
            className="flex-1 bg-[#12121A] border border-zinc-800 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 rounded-lg p-3 text-zinc-300 text-xs outline-none resize-none transition-all custom-scrollbar placeholder:text-zinc-600"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          />
          
          <p className="text-[10px] text-zinc-500 mt-2 flex items-center justify-between">
            <span>Each line = one input()</span>
            <span className="opacity-50">↵</span>
          </p>
        </div>

      </div>
    </div>
  );
}