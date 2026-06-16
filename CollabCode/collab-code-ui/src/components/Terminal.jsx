import { X, CheckCircle2, AlertCircle, Timer, TerminalSquare, HardDrive, Loader2 } from 'lucide-react';

export default function Terminal({ output, onClose, onStdinChange, stdin, isExecuting }) {
  const hasError = output?.error && output.error.trim().length > 0;
  
  // Helper to determine if the status is a failure code from Judge0
  const isFailedStatus = output?.status === 'Timeout' || output?.status === 'Unavailable';

  return (
    <div className="flex flex-col h-full w-full bg-theme-base font-mono selection:bg-emerald-500/30 transition-colors duration-300">
      
      {/* ── Terminal Header ───────────────────── */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-theme-surface border-b border-theme-border shrink-0 transition-colors duration-300">
        <div className="flex items-center gap-5">
          
          {/* Status Indicator */}
          <div className="flex items-center gap-1.5">
            {isExecuting ? (
              <>
                <Loader2 size={14} className="text-amber-500 animate-spin" />
                <span className="text-xs font-bold tracking-wide text-amber-500">Running...</span>
              </>
            ) : output ? (
              hasError ? (
                <>
                  <AlertCircle size={14} className="text-red-500" />
                  <span className="text-xs font-bold tracking-wide text-red-500">Execution Error</span>
                </>
              ) : isFailedStatus ? (
                <>
                  <AlertCircle size={14} className="text-red-500" />
                  <span className="text-xs font-bold tracking-wide text-red-500">Execution Failed</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  <span className="text-xs font-bold tracking-wide text-emerald-500">Output Success</span>
                </>
              )
            ) : (
              <>
                <TerminalSquare size={14} className="text-theme-muted" />
                <span className="text-xs font-bold tracking-wide text-theme-muted">Ready</span>
              </>
            )}
          </div>

          <div className="h-4 w-[1px] bg-theme-border"></div>
          
          {/* Metadata */}
          {output?.status && (
            <div className={`flex items-center gap-1.5 text-xs font-medium ${isFailedStatus ? 'text-red-500' : 'text-theme-muted'}`}>
              <TerminalSquare size={13} />
              <span>
                {output.status === 'Timeout' && '⏱ '}
                {output.status === 'Unavailable' && '🔌 '}
                {output.status}
              </span>
            </div>
          )}
          
          {output?.executionTime !== undefined && output.executionTime > 0 && (
            <div className="flex items-center gap-1.5 text-theme-muted text-xs font-medium">
              <Timer size={13} />
              <span>{output.executionTime}s</span>
            </div>
          )}

          {output?.memoryUsed !== undefined && output.memoryUsed > 0 && (
            <div className="flex items-center gap-1.5 text-theme-muted text-xs font-medium">
              <HardDrive size={13} />
              <span>{output.memoryUsed} KB</span>
            </div>
          )}
        </div>

        {/* Close Action */}
        <button
          onClick={onClose}
          className="text-theme-muted hover:text-theme-text hover:bg-theme-elevated p-1 rounded transition-colors"
          title="Close Terminal"
        >
          <X size={16} />
        </button>
      </div>

      {/* ── Terminal Body (Split Pane) ────────── */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Output Panel */}
        <div className="flex-1 p-4 overflow-y-auto border-r border-theme-border transition-colors duration-300">
          <div className="text-[10px] text-theme-muted uppercase tracking-widest font-bold mb-3">
            Output
          </div>

          {/* Loading State */}
          {isExecuting && (
            <div className="text-[13px] text-amber-500 font-medium animate-pulse">
              Running your code...
            </div>
          )}

          {/* Empty State */}
          {!isExecuting && !output && (
            <div className="text-[13px] text-theme-muted font-medium">
              Click Run to execute your code.
            </div>
          )}

          {/* Error Output */}
          {!isExecuting && output && hasError && (
            <pre 
              className="m-0 text-[13px] leading-relaxed whitespace-pre-wrap font-medium break-all text-red-500"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              {output.error}
            </pre>
          )}

          {/* Success Output */}
          {!isExecuting && output && !hasError && (
            <pre 
              className={`m-0 text-[13px] leading-relaxed whitespace-pre-wrap font-medium break-all ${isFailedStatus ? 'text-red-500' : 'text-theme-text'}`}
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              {isFailedStatus ? 'The execution exceeded the server limits and was aborted.' : (output.output || '(no output)')}
            </pre>
          )}
        </div>

        {/* Stdin Panel */}
        <div className="w-64 md:w-72 shrink-0 flex flex-col p-4 bg-theme-base transition-colors duration-300">
          <div className="text-[10px] text-theme-muted uppercase tracking-widest font-bold mb-3">
            Standard Input (stdin)
          </div>
          
          <textarea
            value={stdin || ''}
            onChange={(e) => onStdinChange(e.target.value)}
            placeholder="Type program input here before running..."
            className="flex-1 bg-theme-surface border border-theme-border focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 rounded-lg p-3 text-theme-text text-xs outline-none resize-none transition-all custom-scrollbar placeholder:text-theme-muted shadow-sm"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          />
          
          <p className="text-[10px] text-theme-muted mt-2 flex items-center justify-between font-medium">
            <span>Each line = one input()</span>
            <span className="opacity-50">↵</span>
          </p>
        </div>

      </div>
    </div>
  );
}