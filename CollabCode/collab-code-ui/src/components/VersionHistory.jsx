import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
  X, 
  GitCommit, 
  Clock, 
  User, 
  RotateCcw, 
  Camera, 
  Loader2,
  FileCode2
} from 'lucide-react';
import axiosInstance from '../api/axiosInstance';

export default function VersionHistory({ roomId, isOpen, onClose, onRestore }) {
  const [snapshots, setSnapshots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    if (isOpen) fetchSnapshots();
  }, [isOpen]);

  const fetchSnapshots = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/rooms/${roomId}/snapshots`);
      setSnapshots(res.data);
    } catch {
      toast.error('Failed to load snapshots');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (snapshot) => {
    if (!window.confirm(`Restore "${snapshot.message}"? Current code will be replaced.`))
      return;

    setRestoring(true);
    try {
      await axiosInstance.post(
        `/rooms/${roomId}/snapshots/${snapshot.id}/restore`
      );
      toast.success('Snapshot restored!');
      onRestore(snapshot.code);
      onClose();
    } catch {
      toast.error('Failed to restore snapshot');
    } finally {
      setRestoring(false);
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* ── Backdrop Overlay ───────────────────── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[300]"
          />

          {/* ── Sidebar Panel ──────────────────────── */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-[420px] bg-[#12121A] border-l border-zinc-800 z-[400] flex flex-col shadow-2xl font-sans"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 bg-[#18181b] border-b border-zinc-800/80 shrink-0">
              <div>
                <h3 className="font-serif text-xl font-bold text-zinc-100" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Version History
                </h3>
                <p className="text-zinc-500 text-xs font-medium mt-1">
                  {snapshots.length} saved {snapshots.length === 1 ? 'snapshot' : 'snapshots'}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 p-1.5 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Snapshot List Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {loading ? (
                <div className="flex flex-col items-center justify-center text-zinc-500 mt-20 gap-3">
                  <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
                  <span className="text-sm">Loading history...</span>
                </div>
              ) : snapshots.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-zinc-500 mt-20 gap-4 text-center">
                  <div className="w-12 h-12 rounded-full bg-zinc-800/50 flex items-center justify-center border border-zinc-800">
                    <Camera className="w-6 h-6 text-zinc-600" />
                  </div>
                  <div>
                    <p className="text-zinc-300 font-medium mb-1">No snapshots yet</p>
                    <p className="text-xs text-zinc-500 max-w-[250px]">
                      Click the Snapshot button in the top bar to save your first version of this code.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  {/* Timeline connecting line */}
                  <div className="absolute left-[11px] top-4 bottom-4 w-[2px] bg-zinc-800/50 rounded-full" />

                  <div className="flex flex-col gap-6">
                    {snapshots.map((snap, i) => (
                      <motion.div
                        key={snap.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="relative pl-8"
                      >
                        {/* Timeline Node Icon */}
                        <div className={`absolute left-0 top-1.5 w-6 h-6 rounded-full flex items-center justify-center ring-4 ring-[#12121A] ${
                          i === 0 ? 'bg-emerald-500/20 text-emerald-500' : 'bg-zinc-800 text-zinc-500'
                        }`}>
                          <GitCommit size={14} />
                        </div>

                        {/* Snapshot Card */}
                        <div 
                          onClick={() => setSelected(selected?.id === snap.id ? null : snap)}
                          className={`group rounded-xl p-4 cursor-pointer transition-all border ${
                            selected?.id === snap.id
                              ? 'bg-purple-500/5 border-purple-500/30'
                              : 'bg-[#18181b] border-zinc-800 hover:border-zinc-700 hover:bg-[#1c1c24]'
                          }`}
                        >
                          <div className="flex justify-between items-start gap-4">
                            <div className="min-w-0 flex-1">
                              <h4 className="text-zinc-200 text-sm font-semibold truncate mb-2 group-hover:text-white transition-colors">
                                {snap.message}
                              </h4>
                              
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-zinc-500">
                                <div className="flex items-center gap-1.5">
                                  <User size={12} />
                                  <span className="truncate max-w-[100px]">{snap.savedByName}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <Clock size={12} />
                                  <span>{formatDate(snap.createdAt)}</span>
                                </div>
                              </div>
                            </div>

                            <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-1 bg-[#0A0A0F] text-purple-400 border border-purple-500/20 rounded">
                              <FileCode2 size={10} />
                              {snap.language}
                            </span>
                          </div>

                          {/* Expanded Code & Action */}
                          <AnimatePresence>
                            {selected?.id === snap.id && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="pt-4 mt-4 border-t border-zinc-800/80">
                                  <pre className="bg-[#0A0A0F] border border-zinc-800/80 rounded-lg p-3 text-[11px] font-mono text-zinc-400 max-h-[200px] overflow-auto whitespace-pre-wrap break-all custom-scrollbar">
                                    {snap.code || '(empty file)'}
                                  </pre>

                                  <motion.button
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRestore(snap);
                                    }}
                                    disabled={restoring}
                                    className={`w-full mt-3 py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm font-bold transition-all ${
                                      restoring
                                        ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                                        : 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-500/20'
                                    }`}
                                  >
                                    {restoring ? (
                                      <><Loader2 size={16} className="animate-spin" /> Restoring...</>
                                    ) : (
                                      <><RotateCcw size={16} /> Restore This Version</>
                                    )}
                                  </motion.button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}