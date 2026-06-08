import { motion, AnimatePresence } from 'framer-motion';

const colors = [
  '#6C63FF', '#F5A623', '#00D68F',
  '#FF4757', '#00BCD4', '#FF6B35'
];

export default function CollaboratorsList({ users }) {
  if (users.length === 0) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
        🟢 Live
      </span>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <AnimatePresence>
          {users.map((user, i) => (
            <motion.div
              key={user}
              initial={{ scale: 0, opacity: 0, x: -10 }}
              animate={{ scale: 1, opacity: 1, x: 0 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ delay: i * 0.05 }}
              title={user}
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: colors[i % colors.length],
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '13px',
                fontWeight: 700,
                color: 'white',
                border: '2px solid var(--bg-surface)',
                marginLeft: i > 0 ? '-8px' : '0',
                cursor: 'default',
                position: 'relative',
                zIndex: users.length - i,
              }}
            >
              {user[0].toUpperCase()}
              {/* Online dot */}
              <div style={{
                position: 'absolute',
                bottom: '1px',
                right: '1px',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: 'var(--accent-green)',
                border: '1px solid var(--bg-surface)',
              }} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <span style={{
        color: 'var(--text-secondary)',
        fontSize: '12px',
        marginLeft: '4px',
      }}>
        {users.length} online
      </span>
    </div>
  );
}