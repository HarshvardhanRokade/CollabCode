import { motion, AnimatePresence } from 'framer-motion';
import { Users } from 'lucide-react';

// Using Tailwind color palettes for a more refined, premium look
const colors = [
  'bg-blue-500', 
  'bg-emerald-500', 
  'bg-amber-500',
  'bg-purple-500', 
  'bg-rose-500', 
  'bg-cyan-500'
];

export default function CollaboratorsList({ users }) {
  if (!users || users.length === 0) return null;

  return (
    <div className="flex items-center gap-4">
      
      {/* ── Live Indicator ──────────────────────── */}
      <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Live</span>
      </div>

      {/* ── Avatar Stack ────────────────────────── */}
      <div className="flex items-center -space-x-2.5">
        <AnimatePresence>
          {users.map((user, i) => (
            <motion.div
              key={user}
              initial={{ scale: 0, opacity: 0, x: -10 }}
              animate={{ scale: 1, opacity: 1, x: 0 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ delay: i * 0.05 }}
              className="relative group z-10 hover:z-50"
            >
              {/* Avatar Circle */}
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white border-2 border-[#181818] shadow-sm cursor-default transition-transform group-hover:-translate-y-1 ${colors[i % colors.length]}`}
              >
                {user.charAt(0).toUpperCase()}
              </div>

              {/* Custom Tooltip (Pure CSS) */}
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap bg-zinc-800 text-zinc-200 text-[10px] font-medium px-2 py-1 rounded shadow-xl border border-zinc-700">
                {user}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ── Active Count ────────────────────────── */}
      <div className="flex items-center gap-1.5 text-zinc-500 text-xs font-medium">
        <Users size={14} />
        <span>{users.length}</span>
      </div>

    </div>
  );
}