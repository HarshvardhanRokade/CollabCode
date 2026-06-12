import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import { ArrowLeft, Trash2, RefreshCcw, FileCode2, Loader2, AlertCircle } from 'lucide-react';
import Navbar from '../components/Navbar';
import axiosInstance from '../api/axiosInstance';

export default function Trash() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTrash();
  }, []);

  const fetchTrash = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/rooms/trash');
      setRooms(res.data);
    } catch {
      toast.error('Failed to load trash');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (roomId) => {
    try {
      await axiosInstance.post(`/rooms/${roomId}/restore`);
      setRooms(prev => prev.filter(r => r.id !== roomId));
      toast.success('Workspace restored!');
    } catch {
      toast.error('Failed to restore workspace');
    }
  };

  const handlePermanentDelete = async (roomId) => {
    if (!window.confirm('Permanently delete this workspace? This cannot be undone.')) return;
    try {
      await axiosInstance.delete(`/rooms/${roomId}/permanent`);
      setRooms(prev => prev.filter(r => r.id !== roomId));
      toast.success('Workspace permanently deleted');
    } catch {
      toast.error('Failed to delete workspace');
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] font-sans text-zinc-300 selection:bg-purple-500/30 flex flex-col relative overflow-hidden">
      
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LCAyNTUsIDI1NSwgMC4wNCkiLz48L3N2Zz4=')] [mask-image:linear-gradient(to_bottom,white,transparent)] pointer-events-none" />

      <Toaster toastOptions={{ style: { background: '#18181b', color: '#e4e4e7', border: '1px solid #27272a' } }} />
      
      <div className="relative z-10">
        <Navbar />
      </div>

      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-12 relative z-10 flex flex-col">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <button 
                onClick={() => navigate('/dashboard')} 
                className="text-zinc-500 hover:text-zinc-300 transition-colors bg-[#12121A] hover:bg-zinc-800 p-2 rounded-xl border border-zinc-800"
              >
                <ArrowLeft size={20} />
              </button>
              <h2 className="font-serif text-4xl font-bold text-white tracking-wide flex items-center gap-3" style={{ fontFamily: "'Playfair Display', serif" }}>
                <Trash2 className="text-zinc-500" size={32} />
                Trash
              </h2>
            </div>
            <p className="text-zinc-500 font-medium mt-3 ml-[60px]">
              Workspaces here can be restored or permanently deleted.
            </p>
          </div>
        </div>

        {/* List Body */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-zinc-500">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            <p className="font-medium tracking-wide">Loading deleted workspaces...</p>
          </div>
        ) : rooms.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center bg-[#12121A]/50 border border-zinc-800/50 border-dashed rounded-3xl mt-4"
          >
            <div className="w-16 h-16 bg-zinc-800/30 rounded-2xl border border-zinc-800 flex items-center justify-center mb-6">
              <Trash2 className="w-8 h-8 text-zinc-600" />
            </div>
            <p className="text-xl font-bold text-zinc-200 mb-2">Trash is empty</p>
            <p className="text-sm text-zinc-500 max-w-sm">
              Any workspaces you delete will temporarily appear here.
            </p>
          </motion.div>
        ) : (
          <div className="flex flex-col gap-4 mt-4">
            {rooms.map((room, i) => (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-[#12121A]/90 backdrop-blur-sm border border-zinc-800 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 transition-all hover:border-zinc-700"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-zinc-800/50 border border-zinc-700/50 flex items-center justify-center shrink-0">
                    <FileCode2 className="w-5 h-5 text-zinc-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-zinc-100 mb-1">
                      {room.name}
                    </h3>
                    <span className="inline-block px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 bg-zinc-800/50 border border-zinc-700 rounded">
                      {room.language}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleRestore(room.id)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors"
                  >
                    <RefreshCcw size={16} />
                    Restore
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handlePermanentDelete(room.id)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors"
                  >
                    <AlertCircle size={16} />
                    Delete Forever
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}