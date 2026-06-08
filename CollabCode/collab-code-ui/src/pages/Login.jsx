import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: 'var(--bg-primary)' }}>
      <Toaster />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-elevated)' }}
        className="w-full max-w-md p-8 rounded-2xl shadow-2xl"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 style={{
            fontFamily: 'Playfair Display, serif',
            color: 'var(--accent-gold)',
            fontSize: '2rem',
            fontWeight: 700
          }}>
            CollabCode
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
            Sign in to your workspace
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid #2a2a3a',
                color: 'var(--text-primary)',
                borderRadius: '8px',
                padding: '12px',
                width: '100%',
                marginTop: '6px',
                outline: 'none',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--accent-purple)'}
              onBlur={e => e.target.style.borderColor = '#2a2a3a'}
            />
          </div>

          <div>
            <label style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid #2a2a3a',
                color: 'var(--text-primary)',
                borderRadius: '8px',
                padding: '12px',
                width: '100%',
                marginTop: '6px',
                outline: 'none',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--accent-purple)'}
              onBlur={e => e.target.style.borderColor = '#2a2a3a'}
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            style={{
              background: loading ? 'var(--bg-elevated)' : 'var(--accent-purple)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '12px',
              width: '100%',
              fontSize: '16px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '8px',
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </motion.button>
        </form>

        <p className="text-center mt-6" style={{ color: 'var(--text-secondary)' }}>
          Don't have an account?{' '}
          <Link to="/register"
            style={{ color: 'var(--accent-gold)', textDecoration: 'none', fontWeight: 600 }}>
            Register
          </Link>
        </p>
      </motion.div>
    </div>
  );
}