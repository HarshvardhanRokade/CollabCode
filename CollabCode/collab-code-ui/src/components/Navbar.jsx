import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav style={{
      background: 'var(--bg-surface)',
      borderBottom: '1px solid var(--bg-elevated)',
      padding: '0 24px',
      height: '64px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      {/* Logo */}
      <motion.h1
        whileHover={{ scale: 1.02 }}
        onClick={() => navigate('/dashboard')}
        style={{
          fontFamily: 'Playfair Display, serif',
          color: 'var(--accent-gold)',
          fontSize: '1.5rem',
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        CollabCode
      </motion.h1>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          👋 {user?.userName}
        </span>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleLogout}
          style={{
            background: 'transparent',
            border: '1px solid var(--accent-red)',
            color: 'var(--accent-red)',
            borderRadius: '8px',
            padding: '6px 16px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          Logout
        </motion.button>
      </div>
    </nav>
  );
}