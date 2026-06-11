import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import { Plus, Trash2, Users, Globe, Lock, Code2, X, Loader2, FileCode2, ChevronLeft, ChevronRight } from 'lucide-react';
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

  const navigate = useNavigate();

  // Fetch rooms whenever currentPage changes
  useEffect(() => {
    fetchRooms(currentPage);
  }, [currentPage]);

  const fetchRooms = async (page) => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/rooms?page=${page}&pageSize=${PAGE_SIZE}`);
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
      
      // Reset to page 1 to see the new room
      setCurrentPage(1);
      fetchRooms(1);
      
      navigate(`/editor/${res.data.id}`);
    } catch {
      toast.error('Failed to provision workspace');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteRoom = async (roomId, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this workspace?')) return;
    try {
      await axiosInstance.delete(`/rooms/${roomId}`);
      setRooms(prev => prev.filter(r => r.id !== roomId));
      setTotalCount(prev => prev - 1);
      toast.success('Workspace deleted');
      
      // If we deleted the last item on the current page, go back one page
      if (rooms.length === 1 && currentPage > 1) {
        setCurrentPage(prev => prev - 1);
      }
    } catch {
      toast.error('Failed to delete workspace');
    }
  };

  const languages = [
    'javascript', 'typescript', 'python',
    'java', 'csharp', 'cpp', 'go', 'rust'
  ];

  const languageTheme = {
    javascript: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    typescript: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    python:     'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    java:       'text-red-400 bg-red-400/10 border-red-400/20',
    csharp:     'text-purple-400 bg-purple-400/10 border-purple-400/20',
    cpp:        'text-indigo-400 bg-indigo-400/10 border-indigo-400/20',
    go:         'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
    rust:       'text-orange-400 bg-orange-400/10 border-orange-400/20',
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] font-sans text-zinc-300 selection:bg-purple-500/30 flex flex-col relative overflow-hidden">
      
      {/* Subtle dot grid background pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LCAyNTUsIDI1NSwgMC4wNCkiLz48L3N2Zz4=')] [mask-image:linear-gradient(to_bottom,white,transparent)] pointer-events-none" />

      <Toaster toastOptions={{ style: { background: '#18181b', color: '#e4e4e7', border: '1px solid #27272a' } }} />
      
      <div className="relative z-10">
        <Navbar />
      </div>

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-12 relative z-10 flex flex-col">
        
        {/* ── Header ──────────────────────────────── */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-12">
          <div>
            <h2 className="font-serif text-4xl font-bold text-white tracking-wide" style={{ fontFamily: "'Playfair Display', serif" }}>
              My Workspaces
            </h2>
            <p className="text-zinc-500 font-medium mt-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {totalCount} workspace{totalCount !== 1 ? 's' : ''} total
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-5 py-3 rounded-xl font-bold text-sm transition-colors shadow-lg shadow-purple-500/20 border border-purple-500/50 shrink-0"
          >
            <Plus size={18} />
            New Workspace
          </motion.button>
        </div>

        {/* ── Rooms Grid ──────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-[#12121A]/80 backdrop-blur-sm border border-zinc-800 rounded-2xl p-6 h-40 flex flex-col justify-between">
                <div>
                  <div className="w-24 h-5 bg-zinc-800/50 rounded animate-pulse mb-4" />
                  <div className="w-3/4 h-6 bg-zinc-800/50 rounded animate-pulse" />
                </div>
                <div className="w-1/3 h-4 bg-zinc-800/50 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : rooms.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center bg-[#12121A]/50 border border-zinc-800/50 border-dashed rounded-3xl"
          >
            <div className="w-16 h-16 bg-zinc-800/30 rounded-2xl border border-zinc-800 flex items-center justify-center mb-6">
              <Code2 className="w-8 h-8 text-zinc-600" />
            </div>
            <p className="text-xl font-bold text-zinc-200 mb-2">No active workspaces</p>
            <p className="text-sm text-zinc-500 max-w-sm">
              Provision your first real-time environment to start collaborating with your team.
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
                  className="group bg-[#12121A]/90 backdrop-blur-sm border border-zinc-800 hover:border-purple-500/40 rounded-2xl p-6 cursor-pointer relative transition-all hover:shadow-2xl hover:shadow-purple-500/5 flex flex-col h-44"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 rounded-xl bg-zinc-800/50 border border-zinc-700/50 flex items-center justify-center">
                      <FileCode2 className={`w-5 h-5 ${languageTheme[room.language]?.split(' ')[0] || 'text-zinc-400'}`} />
                    </div>
                    <span className={`px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider rounded border ${languageTheme[room.language] || 'text-zinc-400 bg-zinc-800 border-zinc-700'}`}>
                      {room.language}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-zinc-100 truncate pr-8 group-hover:text-purple-400 transition-colors">
                    {room.name}
                  </h3>

                  <div className="mt-auto flex items-center justify-between pt-4 border-t border-zinc-800/50">
                    <span className="flex items-center gap-1.5 text-xs font-medium text-zinc-500">
                      <Users size={14} /> 
                      {room.participantCount || 0}
                    </span>
                    <span className={`flex items-center gap-1.5 text-xs font-medium ${room.isPublic ? 'text-emerald-500' : 'text-amber-500'}`}>
                      {room.isPublic ? <Globe size={12} /> : <Lock size={12} />}
                      {room.isPublic ? 'Public' : 'Private'}
                    </span>
                  </div>

                  <button
                    onClick={(e) => handleDeleteRoom(room.id, e)}
                    className="absolute top-5 right-5 p-2 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                    title="Delete Workspace"
                  >
                    <Trash2 size={16} />
                  </button>
                </motion.div>
              ))}
            </div>

            {/* ── Pagination Controls ───────────────── */}
            {totalPages > 1 && (
              <div className="mt-auto pt-12 flex flex-col items-center gap-4">
                <div className="flex items-center gap-3">
                  
                  {/* Previous Button */}
                  <button
                    onClick={() => hasPreviousPage && setCurrentPage(p => p - 1)}
                    disabled={!hasPreviousPage}
                    className="flex items-center gap-1 px-4 py-2.5 rounded-xl border border-zinc-800 text-zinc-400 text-sm font-bold transition-colors hover:bg-zinc-800 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-zinc-400"
                  >
                    <ChevronLeft size={16} />
                    <span className="hidden sm:inline">Previous</span>
                  </button>

                  {/* Page Numbers */}
                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-10 h-10 rounded-xl border text-sm font-bold flex items-center justify-center transition-all ${
                          page === currentPage
                            ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/20'
                            : 'border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  {/* Next Button */}
                  <button
                    onClick={() => hasNextPage && setCurrentPage(p => p + 1)}
                    disabled={!hasNextPage}
                    className="flex items-center gap-1 px-4 py-2.5 rounded-xl border border-zinc-800 text-zinc-400 text-sm font-bold transition-colors hover:bg-zinc-800 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-zinc-400"
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-[#12121A] border border-zinc-800 rounded-2xl p-8 w-full max-w-[440px] shadow-2xl shadow-black"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="font-serif text-2xl font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Provision Workspace
                </h3>
                <button onClick={() => setShowCreateModal(false)} className="text-zinc-500 hover:text-zinc-300">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateRoom} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-zinc-400 pl-1">Workspace Name</label>
                  <input
                    type="text"
                    value={newRoom.name}
                    onChange={e => setNewRoom(p => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Authentication Service"
                    required
                    autoFocus
                    className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-zinc-400 pl-1">Primary Language</label>
                  <div className="relative">
                    <select
                      value={newRoom.language}
                      onChange={e => setNewRoom(p => ({ ...p, language: e.target.value }))}
                      className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 rounded-xl px-4 py-3 text-sm text-zinc-100 outline-none transition-all cursor-pointer appearance-none font-mono"
                    >
                      {languages.map(lang => (
                        <option key={lang} value={lang} className="bg-zinc-900">{lang}</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-zinc-500">
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
                      className="peer w-5 h-5 appearance-none border border-zinc-700 rounded bg-zinc-900/50 checked:bg-purple-500 checked:border-purple-500 transition-colors cursor-pointer"
                    />
                    <svg className="absolute w-3 h-3 pointer-events-none left-1 top-1 text-white opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 14 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1 5L4.5 8.5L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <label htmlFor="isPublic" className="text-sm font-medium text-zinc-300 cursor-pointer select-none">
                    Make this workspace public
                  </label>
                </div>

                <div className="flex gap-3 pt-2 border-t border-zinc-800/80">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-zinc-400 bg-zinc-800/50 hover:bg-zinc-800 hover:text-zinc-200 transition-colors border border-zinc-700/50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-purple-600 hover:bg-purple-500 transition-colors disabled:bg-zinc-800 disabled:text-zinc-500 flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 disabled:shadow-none"
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