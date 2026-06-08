import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await register(userName, email, password);
      toast.success('Account created!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    background: 'var(--bg-elevated)',
    border: '1px solid #2a2a3a',
    color: 'var(--text-primary)',
    borderRadius: '8px',
    padding: '12px',
    width: '100%',
    marginTop: '6px',
    outline: 'none',
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
            Create your workspace
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              Username
            </label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              required
              placeholder="yourname"
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = 'var(--accent-purple)'}
              onBlur={e => e.target.style.borderColor = '#2a2a3a'}
            />
          </div>

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
              style={inputStyle}
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
              style={inputStyle}
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
            {loading ? 'Creating account...' : 'Create Account'}
          </motion.button>
        </form>

        <p className="text-center mt-6" style={{ color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login"
            style={{ color: 'var(--accent-gold)', textDecoration: 'none', fontWeight: 600 }}>
            Sign In
          </Link>
        </p>
      </motion.div>
    </div>
  );
}