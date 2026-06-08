import { motion } from 'framer-motion';

const languages = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python',     label: 'Python' },
  { value: 'java',       label: 'Java' },
  { value: 'csharp',     label: 'C#' },
  { value: 'cpp',        label: 'C++' },
  { value: 'go',         label: 'Go' },
  { value: 'rust',       label: 'Rust' },
];

export default function LanguageSelector({ value, onChange }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid #2a2a3a',
        color: 'var(--accent-gold)',
        borderRadius: '8px',
        padding: '6px 12px',
        fontSize: '13px',
        cursor: 'pointer',
        outline: 'none',
        fontFamily: 'JetBrains Mono, monospace',
      }}
    >
      {languages.map(lang => (
        <option key={lang.value} value={lang.value}>
          {lang.label}
        </option>
      ))}
    </select>
  );
}