import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { LogOut, Code2, Sun, Moon } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="flex items-center justify-between h-16 px-6 bg-theme-surface border-b border-theme-border sticky top-0 z-[100] font-sans shadow-sm transition-colors duration-300">
      
      {/* ── Brand Logo ──────────────────────────── */}
      <motion.div
        whileHover={{ scale: 1.02 }}
        onClick={() => navigate('/dashboard')}
        className="flex items-center gap-2.5 cursor-pointer group"
      >
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/40 transition-shadow">
          <Code2 className="text-white w-5 h-5" />
        </div>
        <h1 
          className="font-serif text-xl font-bold text-theme-text tracking-wide transition-colors" 
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          CollabCode
        </h1>
      </motion.div>

      {/* ── User & Actions ──────────────────────── */}
      <div className="flex items-center gap-4">
        
        {/* Theme Toggle */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleTheme}
          className="w-9 h-9 flex items-center justify-center rounded-lg bg-theme-elevated border border-theme-border text-theme-muted hover:text-theme-text transition-colors"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </motion.button>

        <div className="h-6 w-[1px] bg-theme-border mx-1"></div>

        {/* User Profile Display */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end hidden sm:flex">
            <span className="text-xs text-theme-muted font-medium tracking-wide uppercase transition-colors">Developer</span>
            <span className="text-sm font-semibold text-theme-text transition-colors">
              {user?.userName || 'Guest'}
            </span>
          </div>
          <div className="w-9 h-9 rounded-full bg-theme-elevated border-2 border-theme-border flex items-center justify-center text-sm font-bold text-emerald-500 shadow-inner transition-colors">
            {user?.userName?.charAt(0).toUpperCase() || 'U'}
          </div>
        </div>

        <div className="h-6 w-[1px] bg-theme-border mx-1"></div>

        {/* Logout Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-500 hover:text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg transition-colors shadow-sm"
        >
          <LogOut size={14} />
          <span className="hidden sm:inline">Logout</span>
        </motion.button>
      </div>
    </nav>
  );
}