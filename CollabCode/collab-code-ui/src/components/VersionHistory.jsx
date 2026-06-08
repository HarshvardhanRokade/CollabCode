import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
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
    if (!confirm(`Restore "${snapshot.message}"? Current code will be replaced.`))
      return;

    setRestoring(true);
    try {
      await axiosInstance.post(
        `/rooms/${roomId}/snapshots/${snapshot.id}/restore`
      );
      toast.success('Snapshot restored! 🔄');
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
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              zIndex: 300,
            }}
          />

          {/* Panel — slides in from right */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              width: '420px',
              background: 'var(--bg-surface)',
              borderLeft: '1px solid var(--bg-elevated)',
              zIndex: 400,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid var(--bg-elevated)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div>
                <h3 style={{
                  fontFamily: 'Playfair Display, serif',
                  color: 'var(--text-primary)',
                  fontSize: '1.2rem',
                  fontWeight: 700,
                }}>
                  Version History
                </h3>
                <p style={{
                  color: 'var(--text-secondary)',
                  fontSize: '13px',
                  marginTop: '4px',
                }}>
                  {snapshots.length} snapshot{snapshots.length !== 1 ? 's' : ''}
                </p>
              </div>
              <button
                onClick={onClose}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '20px',
                  padding: '4px',
                }}
              >
                ✕
              </button>
            </div>

            {/* Snapshot List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
              {loading ? (
                <div style={{
                  textAlign: 'center',
                  color: 'var(--text-secondary)',
                  marginTop: '40px'
                }}>
                  Loading snapshots...
                </div>
              ) : snapshots.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  color: 'var(--text-secondary)',
                  marginTop: '40px',
                }}>
                  <div style={{ fontSize: '32px', marginBottom: '12px' }}>📸</div>
                  <p>No snapshots yet</p>
                  <p style={{ fontSize: '13px', marginTop: '8px' }}>
                    Click the 📸 Snapshot button to save your first version
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {snapshots.map((snap, i) => (
                    <motion.div
                      key={snap.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => setSelected(
                        selected?.id === snap.id ? null : snap
                      )}
                      style={{
                        background: selected?.id === snap.id
                          ? 'var(--bg-elevated)'
                          : 'var(--bg-primary)',
                        border: `1px solid ${selected?.id === snap.id
                          ? 'var(--accent-purple)'
                          : 'var(--bg-elevated)'}`,
                        borderRadius: '10px',
                        padding: '14px',
                        cursor: 'pointer',
                      }}
                    >
                      {/* Snapshot header */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '4px',
                          }}>
                            {/* Timeline dot */}
                            <div style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              background: i === 0
                                ? 'var(--accent-green)'
                                : 'var(--accent-purple)',
                              flexShrink: 0,
                            }} />
                            <span style={{
                              color: 'var(--text-primary)',
                              fontSize: '14px',
                              fontWeight: 600,
                            }}>
                              {snap.message}
                            </span>
                          </div>
                          <div style={{
                            display: 'flex',
                            gap: '12px',
                            marginLeft: '16px',
                          }}>
                            <span style={{
                              color: 'var(--text-secondary)',
                              fontSize: '12px',
                            }}>
                              👤 {snap.savedByName}
                            </span>
                            <span style={{
                              color: 'var(--text-secondary)',
                              fontSize: '12px',
                            }}>
                              🕐 {formatDate(snap.createdAt)}
                            </span>
                          </div>
                        </div>

                        {/* Language badge */}
                        <span style={{
                          background: 'var(--bg-elevated)',
                          color: 'var(--accent-gold)',
                          borderRadius: '6px',
                          padding: '2px 8px',
                          fontSize: '11px',
                          fontFamily: 'JetBrains Mono, monospace',
                        }}>
                          {snap.language}
                        </span>
                      </div>

                      {/* Expanded — code preview + restore button */}
                      <AnimatePresence>
                        {selected?.id === snap.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            style={{ overflow: 'hidden' }}
                          >
                            {/* Code preview */}
                            <pre style={{
                              background: '#0A0A0F',
                              border: '1px solid var(--bg-elevated)',
                              borderRadius: '8px',
                              padding: '12px',
                              marginTop: '12px',
                              fontSize: '12px',
                              fontFamily: 'JetBrains Mono, monospace',
                              color: 'var(--text-secondary)',
                              overflowX: 'auto',
                              maxHeight: '150px',
                              overflowY: 'auto',
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-all',
                            }}>
                              {snap.code || '(empty)'}
                            </pre>

                            {/* Restore button */}
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRestore(snap);
                              }}
                              disabled={restoring}
                              style={{
                                width: '100%',
                                marginTop: '10px',
                                background: restoring
                                  ? 'var(--bg-elevated)'
                                  : 'var(--accent-purple)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '10px',
                                cursor: restoring ? 'not-allowed' : 'pointer',
                                fontSize: '14px',
                                fontWeight: 600,
                              }}
                            >
                              {restoring ? 'Restoring...' : '🔄 Restore This Version'}
                            </motion.button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}