import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Loader2, ArrowRight, Code2 } from 'lucide-react';

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
    <div className="flex min-h-screen w-full bg-[#0A0A0F] text-zinc-300 font-sans selection:bg-emerald-500/30">
      <Toaster 
        toastOptions={{
          style: { background: '#18181b', color: '#e4e4e7', border: '1px solid #27272a' }
        }} 
      />

      {/* ── Left Pane: Interactive Form ──────────────── */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-16 lg:px-24 xl:px-32 relative z-10">
        
        {/* Brand Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Code2 className="text-white w-6 h-6" />
            </div>
            <h1 className="font-serif text-3xl font-bold text-white tracking-wide" style={{ fontFamily: "'Playfair Display', serif" }}>
              CollabCode
            </h1>
          </div>
          <p className="text-zinc-500 font-medium">Log in to your real-time workspace.</p>
        </motion.div>

        {/* Form Container */}
        <motion.form 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleSubmit} 
          className="space-y-5"
        >
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-zinc-400 pl-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 rounded-xl py-3 pl-11 pr-4 text-zinc-100 placeholder-zinc-600 outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between pl-1">
              <label className="text-sm font-semibold text-zinc-400">Password</label>
              <a href="#" className="text-xs text-emerald-500 hover:text-emerald-400 transition-colors">Forgot password?</a>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 rounded-xl py-3 pl-11 pr-4 text-zinc-100 placeholder-zinc-600 outline-none transition-all"
              />
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className={`w-full mt-4 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${
              loading 
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed shadow-none' 
                : 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-emerald-500/20'
            }`}
          >
            {loading ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Authenticating...</>
            ) : (
              <>Sign In <ArrowRight className="w-4 h-4" /></>
            )}
          </motion.button>
        </motion.form>

        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-8 text-sm text-zinc-500 text-center lg:text-left"
        >
          Don't have an account?{' '}
          <Link to="/register" className="text-white font-semibold hover:text-emerald-400 transition-colors">
            Create a workspace
          </Link>
        </motion.p>
      </div>

      {/* ── Right Pane: Atmospheric Visual ───────────── */}
      <div className="hidden lg:flex w-1/2 bg-[#0c0c12] border-l border-zinc-800/50 relative overflow-hidden items-center justify-center">
        {/* Abstract Background Glows */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

        {/* Floating Code Snippet Window */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10 w-[80%] max-w-lg bg-[#181818]/80 backdrop-blur-md border border-zinc-800 rounded-2xl shadow-2xl shadow-black overflow-hidden"
        >
          {/* Mac-style Window Controls */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800/80 bg-[#141414]/50">
            <div className="w-3 h-3 rounded-full bg-zinc-700" />
            <div className="w-3 h-3 rounded-full bg-zinc-700" />
            <div className="w-3 h-3 rounded-full bg-zinc-700" />
            <span className="ml-2 text-xs font-mono text-zinc-500">OperationTransform.js</span>
          </div>
          {/* Mock Code Body */}
          <div className="p-6 font-mono text-sm text-zinc-400 space-y-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            <p><span className="text-purple-400">import</span> {'{ applyOp }'} <span className="text-purple-400">from</span> <span className="text-emerald-400">'ot-algorithm'</span>;</p>
            <br/>
            <p><span className="text-blue-400">class</span> <span className="text-amber-300">Document</span> {'{'}</p>
            <p className="pl-4">constructor(initialState) {'{'}</p>
            <p className="pl-8"><span className="text-purple-400">this</span>.state = initialState;</p>
            <p className="pl-8"><span className="text-purple-400">this</span>.version = <span className="text-orange-400">0</span>;</p>
            <p className="pl-4">{'}'}</p>
            <br/>
            <p className="pl-4"><span className="text-blue-400">async</span> applyCollaboration(op) {'{'}</p>
            <p className="pl-8"><span className="text-purple-400">await</span> synchronize(op);</p>
            <p className="pl-8"><span className="text-zinc-600">{'// Resolving concurrent edits...'}</span></p>
            <p className="pl-4">{'}'}</p>
            <p>{'}'}</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}