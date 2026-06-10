import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, LayoutDashboard, TerminalSquare } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0A0A0F] font-sans p-6 text-center selection:bg-purple-500/30">
      
      {/* ── Animated 404 ──────────────────────── */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', bounce: 0.4 }}
      >
        <h1 
          className="font-serif text-[8rem] sm:text-[10rem] font-bold bg-gradient-to-br from-purple-500 to-emerald-400 bg-clip-text text-transparent leading-none tracking-tighter drop-shadow-2xl" 
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          404
        </h1>
      </motion.div>

      {/* ── Message ───────────────────────────── */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col items-center gap-3 mt-4 mb-8"
      >
        <h2 
          className="text-2xl sm:text-3xl font-bold text-zinc-100" 
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Page Not Found
        </h2>
        <p className="text-sm text-zinc-500 max-w-[400px] leading-relaxed">
          Looks like this path doesn't exist or was moved. Let's get you back to your workspace.
        </p>
      </motion.div>

      {/* ── Code Snippet Decoration ───────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="w-full max-w-md bg-[#12121A] border border-zinc-800 rounded-xl p-5 text-left font-mono text-xs sm:text-[13px] text-zinc-400 shadow-2xl shadow-black/50"
      >
        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-zinc-800/80">
          <TerminalSquare size={14} className="text-zinc-500" />
          <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
            Router Output
          </span>
        </div>
        <div className="leading-relaxed">
          <span className="text-red-400">Error</span>
          <span className="text-zinc-300">: Route </span>
          <span className="text-amber-400">"{window.location.pathname}"</span>
          <span className="text-zinc-300"> not found</span>
          <br /><br />
          <span className="text-purple-400">suggestion</span>
          <span className="text-zinc-300">: navigate to </span>
          <span className="text-emerald-400">"/dashboard"</span>
        </div>
      </motion.div>

      {/* ── Actions ───────────────────────────── */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex flex-wrap justify-center gap-4 mt-8"
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-zinc-300 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 transition-colors"
        >
          <ArrowLeft size={16} />
          Go Back
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-purple-600 hover:bg-purple-500 shadow-lg shadow-purple-500/20 transition-all border border-purple-500/50"
        >
          <LayoutDashboard size={16} />
          Dashboard
        </motion.button>
      </motion.div>

    </div>
  );
}