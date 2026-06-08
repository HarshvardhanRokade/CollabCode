import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Lock, Loader2, ArrowRight, Code2 } from 'lucide-react';

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

  return (
    <div className="flex min-h-screen w-full bg-[#0A0A0F] text-zinc-300 font-sans selection:bg-emerald-500/30">
      <Toaster 
        toastOptions={{
          style: { background: '#18181b', color: '#e4e4e7', border: '1px solid #27272a' }
        }} 
      />

      {/* ── Left Pane: Interactive Form ──────────────── */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-16 lg:px-24 xl:px-32 relative z-10 py-12">
        
        {/* Brand Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Code2 className="text-white w-6 h-6" />
            </div>
            <h1 className="font-serif text-3xl font-bold text-white tracking-wide" style={{ fontFamily: "'Playfair Display', serif" }}>
              CollabCode
            </h1>
          </div>
          <p className="text-zinc-500 font-medium">Join the ultimate collaborative IDE.</p>
        </motion.div>

        {/* Form Container */}
        <motion.form 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleSubmit} 
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-zinc-400 pl-1">Developer Handle</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                required
                placeholder="Username"
                className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 rounded-xl py-3 pl-11 pr-4 text-zinc-100 placeholder-zinc-600 outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-zinc-400 pl-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="E-mail"
                className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 rounded-xl py-3 pl-11 pr-4 text-zinc-100 placeholder-zinc-600 outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-zinc-400 pl-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Minimum 6 characters"
                className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 rounded-xl py-3 pl-11 pr-4 text-zinc-100 placeholder-zinc-600 outline-none transition-all"
              />
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className={`w-full mt-6 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${
              loading 
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed shadow-none' 
                : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/20'
            }`}
          >
            {loading ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Provisioning...</>
            ) : (
              <>Create Account <ArrowRight className="w-4 h-4" /></>
            )}
          </motion.button>
        </motion.form>

        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-8 text-sm text-zinc-500 text-center lg:text-left"
        >
          Already have an account?{' '}
          <Link to="/login" className="text-white font-semibold hover:text-purple-400 transition-colors">
            Sign In
          </Link>
        </motion.p>
      </div>

      {/* ── Right Pane: Atmospheric Visual ───────────── */}
      <div className="hidden lg:flex w-1/2 bg-[#0c0c12] border-l border-zinc-800/50 relative overflow-hidden items-center justify-center">
        {/* Abstract Background Glows */}
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

        {/* System Logs / Server initialization mock */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10 w-[80%] max-w-lg bg-[#181818]/80 backdrop-blur-md border border-zinc-800 rounded-2xl shadow-2xl shadow-black overflow-hidden"
        >
          <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800/80 bg-[#141414]/50">
            <div className="w-3 h-3 rounded-full bg-zinc-700" />
            <div className="w-3 h-3 rounded-full bg-zinc-700" />
            <div className="w-3 h-3 rounded-full bg-zinc-700" />
            <span className="ml-2 text-xs font-mono text-zinc-500">signalr-hub-init.sh</span>
          </div>
          <div className="p-6 font-mono text-sm text-zinc-400 space-y-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            <p className="text-emerald-400">➜ <span className="text-blue-400">~</span> starting environment...</p>
            <p className="text-zinc-500">[10:02:41] Initializing WebSocket Hub</p>
            <p className="text-zinc-500">[10:02:42] Validating JWT Configuration</p>
            <p className="text-zinc-500">[10:02:42] Room Isolation Protocol Active</p>
            <p className="text-emerald-400 mt-4 font-bold">✔ System Ready.</p>
            <div className="w-2 h-4 bg-zinc-400 animate-pulse mt-2" />
          </div>
        </motion.div>
      </div>
    </div>
  );
}