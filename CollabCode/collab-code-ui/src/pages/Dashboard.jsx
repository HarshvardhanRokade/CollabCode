import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import { 
  Plus, Trash2, Users, Globe, Lock, Code2, 
  X, Loader2, FileCode2, ChevronLeft, ChevronRight, Search 
} from 'lucide-react';
import Navbar from '../components/Navbar';
import axiosInstance from '../api/axiosInstance';

const PAGE_SIZE = 9;

export default function Dashboard() {
  // ── Core State ──
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newRoom, setNewRoom] = useState({
    name: '',
    language: 'javascript',
    isPublic: true,
  });

  // ── Pagination State ──
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);

  // ── Search & Filter State ──
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [languageFilter, setLanguageFilter] = useState('all');

  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setCurrentPage(1); 
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    fetchRooms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, search, languageFilter]);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage,
        pageSize: PAGE_SIZE,
      });
      if (search) params.append('search', search);
      if (languageFilter !== 'all') params.append('language', languageFilter);

      const res = await axiosInstance.get(`/rooms?${params}`);
      setRooms(res.data.rooms);
      setTotalPages(res.data.totalPages);
      setTotalCount(res.data.totalCount);
      setHasNextPage(res.data.hasNextPage);
      setHasPreviousPage(res.data.hasPreviousPage);
    } catch {
      toast.error('Failed to load workspaces');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!newRoom.name.trim()) {
      toast.error('Workspace name is required');
      return;
    }
    setCreating(true);
    try {
      const res = await axiosInstance.post('/rooms', newRoom);
      setShowCreateModal(false);
      setNewRoom({ name: '', language: 'javascript', isPublic: true });
      toast.success('Workspace created!');
      
      setCurrentPage(1);
      setSearch('');
      setSearchInput('');
      setLanguageFilter('all');
      
      navigate(`/editor/${res.data.id}`);
    } catch {
      toast.error('Failed to provision workspace');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteRoom = async (roomId, e) => {
    e.stopPropagation();
    if (!window.confirm('Move this workspace to trash?')) return;
    try {
      await axiosInstance.delete(`/rooms/${roomId}`);
      setRooms(prev => prev.filter(r => r.id !== roomId));
      setTotalCount(prev => prev - 1);
      toast.success('Moved to trash');
      
      if (rooms.length === 1 && currentPage > 1) {
        setCurrentPage(prev => prev - 1);
      }
    } catch {
      toast.error('Failed to delete workspace');
    }
  };

  const handleLanguageFilter = (lang) => {
    setLanguageFilter(lang);
    setCurrentPage(1);
  };

  const languages = [
    'javascript', 'typescript', 'python',
    'java', 'csharp', 'cpp', 'go', 'rust'
  ];

  const languageTheme = {
    javascript: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
    typescript: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    python:     'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    java:       'text-red-500 bg-red-500/10 border-red-500/20',
    csharp:     'text-purple-500 bg-purple-500/10 border-purple-500/20',
    cpp:        'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
    go:         'text-cyan-500 bg-cyan-500/10 border-cyan-500/20',
    rust:       'text-orange-500 bg-orange-500/10 border-orange-500/20',
  };

  return (
    <div className="min-h-screen bg-theme-base font-sans text-theme-text selection:bg-purple-500/30 flex flex-col relative overflow-hidden transition-colors duration-300">
      
      {/* Dynamic Background Pattern */}
      <div 
        className="absolute inset-0 pointer-events-none transition-colors duration-300"
        style={{
          backgroundImage: 'var(--pattern-dots)',
          maskImage: 'linear-gradient(to bottom, white, transparent)',
          WebkitMaskImage: 'linear-gradient(to bottom, white, transparent)'
        }}
      />

      <Toaster toastOptions={{ style: { background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' } }} />
      
      <div className="relative z-10">
        <Navbar />
      </div>

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-12 relative z-10 flex flex-col">
        
        {/* ── Header ──────────────────────────────── */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h2 className="font-serif text-4xl font-bold text-theme-text tracking-wide transition-colors" style={{ fontFamily: "'Playfair Display', serif" }}>
              My Workspaces
            </h2>
            <p className="text-theme-muted font-medium mt-2 flex items-center gap-2 transition-colors">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {totalCount} workspace{totalCount !== 1 ? 's' : ''} total
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/trash')}
              className="flex items-center gap-2 bg-theme-surface hover:bg-theme-elevated text-theme-text px-5 py-3 rounded-xl font-bold text-sm transition-colors border border-theme-border shadow-sm"
            >
              <Trash2 size={18} />
              Trash
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-5 py-3 rounded-xl font-bold text-sm transition-colors shadow-lg shadow-purple-500/20 border border-purple-500/50"
            >
              <Plus size={18} />
              New Workspace
            </motion.button>
          </div>
        </div>

        {/* ── Search + Filter Bar ─────────────────── */}
        <div className="flex flex-col md:flex-row gap-4 mb-8 items-start md:items-center justify-between">
          
          <div className="relative w-full md:max-w-[300px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-theme-muted w-4 h-4 pointer-events-none" />
            <input
              type="text"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Search workspaces..."
              className="w-full bg-theme-surface border border-theme-border text-theme-text rounded-xl py-2.5 pl-10 pr-10 outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all text-sm placeholder:text-theme-muted shadow-sm"
            />
            {searchInput && (
              <button
                onClick={() => { setSearchInput(''); setSearch(''); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-muted hover:text-theme-text transition-colors"
                title="Clear Search"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleLanguageFilter('all')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                languageFilter === 'all'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                  : 'bg-theme-surface border border-theme-border text-theme-muted hover:bg-theme-elevated hover:text-theme-text shadow-sm'
              }`}
            >
              All
            </button>

            {languages.map(lang => (
              <button
                key={lang}
                onClick={() => handleLanguageFilter(lang)}
                className={`px-4 py-1.5 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider transition-all border ${
                  languageFilter === lang
                    ? languageTheme[lang] + ' shadow-md'
                    : 'bg-theme-surface border-theme-border text-theme-muted hover:bg-theme-elevated hover:text-theme-text shadow-sm'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>

        {/* ── Active Filters Indicator ────────────── */}
        <AnimatePresence>
          {(search || languageFilter !== 'all') && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-3 mb-6 text-xs text-theme-muted flex-wrap overflow-hidden"
            >
              <span>Showing {totalCount} result{totalCount !== 1 ? 's' : ''} for:</span>
              
              {search && (
                <span className="flex items-center gap-1.5 bg-theme-elevated border border-theme-border px-3 py-1 rounded-full text-theme-text">
                  <Search size={12} />
                  "{search}"
                </span>
              )}
              
              {languageFilter !== 'all' && (
                <span className={`px-2.5 py-1 rounded-full font-mono font-bold uppercase tracking-wider border ${languageTheme[languageFilter]}`}>
                  {languageFilter}
                </span>
              )}
              
              <button
                onClick={() => {
                  setSearchInput('');
                  setSearch('');
                  setLanguageFilter('all');
                  setCurrentPage(1);
                }}
                className="text-red-500 hover:text-red-400 ml-2 font-medium transition-colors hover:underline"
              >
                Clear all filters
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Rooms Grid ──────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-theme-surface border border-theme-border rounded-2xl p-6 h-40 flex flex-col justify-between shadow-sm">
                <div>
                  <div className="w-24 h-5 bg-theme-elevated rounded animate-pulse mb-4" />
                  <div className="w-3/4 h-6 bg-theme-elevated rounded animate-pulse" />
                </div>
                <div className="w-1/3 h-4 bg-theme-elevated rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : rooms.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center bg-theme-surface border border-theme-border border-dashed rounded-3xl"
          >
            <div className="w-16 h-16 bg-theme-elevated rounded-2xl border border-theme-border flex items-center justify-center mb-6 shadow-sm">
              {search || languageFilter !== 'all' ? (
                <Search className="w-8 h-8 text-theme-muted" />
              ) : (
                <Code2 className="w-8 h-8 text-theme-muted" />
              )}
            </div>
            <p className="text-xl font-bold text-theme-text mb-2">
              {search || languageFilter !== 'all' ? 'No workspaces found' : 'No active workspaces'}
            </p>
            <p className="text-sm text-theme-muted max-w-sm">
              {search || languageFilter !== 'all' 
                ? 'Try adjusting your search query or language filter to find what you are looking for.' 
                : 'Provision your first real-time environment to start collaborating with your team.'}
            </p>
          </motion.div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rooms.map((room, i) => (
                <motion.div
                  key={room.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ y: -4 }}
                  onClick={() => navigate(`/editor/${room.id}`)}
                  className="group bg-theme-surface border border-theme-border hover:border-purple-500/40 rounded-2xl p-6 cursor-pointer relative transition-all hover:shadow-xl shadow-sm flex flex-col h-44"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 rounded-xl bg-theme-elevated border border-theme-border flex items-center justify-center">
                      <FileCode2 className={`w-5 h-5 ${languageTheme[room.language]?.split(' ')[0] || 'text-theme-muted'}`} />
                    </div>
                    
                    {/* ── Delete Button & Badge Group ── */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleDeleteRoom(room.id, e)}
                        className="p-1.5 text-theme-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                        title="Move to Trash"
                      >
                        <Trash2 size={16} />
                      </button>
                      <span className={`px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider rounded border ${languageTheme[room.language] || 'text-theme-muted bg-theme-elevated border-theme-border'}`}>
                        {room.language}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-theme-text truncate pr-8 group-hover:text-purple-500 transition-colors">
                    {room.name}
                  </h3>

                  <div className="mt-auto flex items-center justify-between pt-4 border-t border-theme-border">
                    <span className="flex items-center gap-1.5 text-xs font-medium text-theme-muted">
                      <Users size={14} /> 
                      {room.participantCount || 0}
                    </span>
                    <span className={`flex items-center gap-1.5 text-xs font-medium ${room.isPublic ? 'text-emerald-500' : 'text-amber-500'}`}>
                      {room.isPublic ? <Globe size={12} /> : <Lock size={12} />}
                      {room.isPublic ? 'Public' : 'Private'}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* ── Pagination Controls ───────────────── */}
            {totalPages > 1 && (
              <div className="mt-auto pt-12 flex flex-col items-center gap-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => hasPreviousPage && setCurrentPage(p => p - 1)}
                    disabled={!hasPreviousPage}
                    className="flex items-center gap-1 px-4 py-2.5 rounded-xl border border-theme-border text-theme-muted text-sm font-bold transition-colors hover:bg-theme-elevated hover:text-theme-text disabled:opacity-50 disabled:cursor-not-allowed bg-theme-surface shadow-sm"
                  >
                    <ChevronLeft size={16} />
                    <span className="hidden sm:inline">Previous</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-10 h-10 rounded-xl border text-sm font-bold flex items-center justify-center transition-all ${
                          page === currentPage
                            ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/20'
                            : 'bg-theme-surface border-theme-border text-theme-muted hover:bg-theme-elevated hover:text-theme-text shadow-sm'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => hasNextPage && setCurrentPage(p => p + 1)}
                    disabled={!hasNextPage}
                    className="flex items-center gap-1 px-4 py-2.5 rounded-xl border border-theme-border text-theme-muted text-sm font-bold transition-colors hover:bg-theme-elevated hover:text-theme-text disabled:opacity-50 disabled:cursor-not-allowed bg-theme-surface shadow-sm"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* ── Create Room Modal ───────────────────── */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[200] p-4"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-theme-surface border border-theme-border rounded-2xl p-8 w-full max-w-[440px] shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="font-serif text-2xl font-bold text-theme-text" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Provision Workspace
                </h3>
                <button onClick={() => setShowCreateModal(false)} className="text-theme-muted hover:text-theme-text transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateRoom} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-theme-muted pl-1">Workspace Name</label>
                  <input
                    type="text"
                    value={newRoom.name}
                    onChange={e => setNewRoom(p => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Authentication Service"
                    required
                    autoFocus
                    className="w-full bg-theme-base border border-theme-border focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 rounded-xl px-4 py-3 text-sm text-theme-text placeholder:text-theme-muted outline-none transition-all shadow-inner"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-theme-muted pl-1">Primary Language</label>
                  <div className="relative">
                    <select
                      value={newRoom.language}
                      onChange={e => setNewRoom(p => ({ ...p, language: e.target.value }))}
                      className="w-full bg-theme-base border border-theme-border focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 rounded-xl px-4 py-3 text-sm text-theme-text outline-none transition-all cursor-pointer appearance-none font-mono shadow-inner"
                    >
                      {languages.map(lang => (
                        <option key={lang} value={lang} className="bg-theme-surface">{lang}</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-theme-muted">
                      ▼
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2 pb-4">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      id="isPublic"
                      checked={newRoom.isPublic}
                      onChange={e => setNewRoom(p => ({ ...p, isPublic: e.target.checked }))}
                      className="peer w-5 h-5 appearance-none border border-theme-border rounded bg-theme-base checked:bg-purple-500 checked:border-purple-500 transition-colors cursor-pointer"
                    />
                    <svg className="absolute w-3 h-3 pointer-events-none left-1 top-1 text-white opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 14 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1 5L4.5 8.5L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <label htmlFor="isPublic" className="text-sm font-medium text-theme-text cursor-pointer select-none">
                    Make this workspace public
                  </label>
                </div>

                <div className="flex gap-3 pt-2 border-t border-theme-border">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-theme-muted bg-theme-base hover:bg-theme-elevated hover:text-theme-text transition-colors border border-theme-border"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-purple-600 hover:bg-purple-500 transition-colors disabled:bg-theme-elevated disabled:text-theme-muted flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 disabled:shadow-none"
                  >
                    {creating ? <Loader2 size={16} className="animate-spin" /> : null}
                    {creating ? 'Creating...' : 'Launch Workspace'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}