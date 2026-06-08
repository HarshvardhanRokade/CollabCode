import { motion } from 'framer-motion';

export default function Terminal({ output, onClose }) {
  if (!output) return null;

  const hasError = output.error && output.error.trim().length > 0;

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: '200px', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      style={{
        background: '#0D0D14',
        borderTop: `1px solid ${hasError ? 'var(--accent-red)' : 'var(--accent-green)'}`,
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '13px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Terminal header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 16px',
        borderBottom: '1px solid var(--bg-elevated)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{
            color: hasError ? 'var(--accent-red)' : 'var(--accent-green)',
            fontWeight: 600,
            fontSize: '12px',
          }}>
            {hasError ? '✗ Error' : '✓ Output'}
          </span>
          {output.status && (
            <span style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>
              {output.status}
            </span>
          )}
          {output.executionTime > 0 && (
            <span style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>
              ⏱ {output.executionTime}s
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '16px',
          }}
        >
          ✕
        </button>
      </div>

      {/* Terminal output */}
      <div style={{
        padding: '12px 16px',
        overflowY: 'auto',
        flex: 1,
      }}>
        {hasError ? (
          <pre style={{ color: 'var(--accent-red)', margin: 0, whiteSpace: 'pre-wrap' }}>
            {output.error}
          </pre>
        ) : (
          <pre style={{ color: 'var(--accent-green)', margin: 0, whiteSpace: 'pre-wrap' }}>
            {output.output || '(no output)'}
          </pre>
        )}
      </div>
    </motion.div>
  );
}