import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import Navbar from '../components/Navbar';
import axiosInstance from '../api/axiosInstance';

export default function Dashboard() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newRoom, setNewRoom] = useState({
    name: '',
    language: 'javascript',
    isPublic: true,
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const res = await axiosInstance.get('/rooms');
      setRooms(res.data);
    } catch {
      toast.error('Failed to load rooms');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!newRoom.name.trim()) {
      toast.error('Room name is required');
      return;
    }
    setCreating(true);
    try {
      const res = await axiosInstance.post('/rooms', newRoom);
      setRooms(prev => [res.data, ...prev]);
      setShowCreateModal(false);
      setNewRoom({ name: '', language: 'javascript', isPublic: true });
      toast.success('Room created!');
      navigate(`/editor/${res.data.id}`);
    } catch {
      toast.error('Failed to create room');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteRoom = async (roomId, e) => {
    e.stopPropagation();
    if (!confirm('Delete this room?')) return;
    try {
      await axiosInstance.delete(`/rooms/${roomId}`);
      setRooms(prev => prev.filter(r => r.id !== roomId));
      toast.success('Room deleted');
    } catch {
      toast.error('Failed to delete room');
    }
  };

  const languages = [
    'javascript', 'typescript', 'python',
    'java', 'csharp', 'cpp', 'go', 'rust'
  ];

  const languageColors = {
    javascript: '#F5A623',
    typescript: '#6C63FF',
    python:     '#00D68F',
    java:       '#FF4757',
    csharp:     '#6C63FF',
    cpp:        '#00D68F',
    go:         '#00BCD4',
    rust:       '#FF6B35',
  };

  const inputStyle = {
    background: 'var(--bg-primary)',
    border: '1px solid #2a2a3a',
    color: 'var(--text-primary)',
    borderRadius: '8px',
    padding: '10px 12px',
    width: '100%',
    marginTop: '6px',
    outline: 'none',
    fontSize: '14px',
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Toaster />
      <Navbar />

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px' }}>

        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px'
        }}>
          <div>
            <h2 style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: '2rem',
              color: 'var(--text-primary)',
              fontWeight: 700,
            }}>
              My Rooms
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
              {rooms.length} room{rooms.length !== 1 ? 's' : ''}
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCreateModal(true)}
            style={{
              background: 'var(--accent-purple)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              padding: '12px 24px',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            + New Room
          </motion.button>
        </div>

        {/* Rooms Grid */}
        {loading ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '20px',
          }}>
            {[1,2,3].map(i => (
              <motion.div
                key={i}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--bg-elevated)',
                  borderRadius: '12px',
                  padding: '20px',
                  height: '140px',
                }}
              >
                <div style={{
                  width: '60px', height: '20px',
                  background: 'var(--bg-elevated)',
                  borderRadius: '6px', marginBottom: '12px'
                }} />
                <div style={{
                  width: '140px', height: '24px',
                  background: 'var(--bg-elevated)',
                  borderRadius: '6px', marginBottom: '8px'
                }} />
                <div style={{
                  width: '100px', height: '16px',
                  background: 'var(--bg-elevated)',
                  borderRadius: '6px'
                }} />
              </motion.div>
            ))}
          </div>
        ) : rooms.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              textAlign: 'center',
              marginTop: '80px',
              color: 'var(--text-secondary)'
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚀</div>
            <p style={{ fontSize: '18px' }}>No rooms yet</p>
            <p style={{ fontSize: '14px', marginTop: '8px' }}>
              Create your first room to start collaborating
            </p>
          </motion.div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '20px',
          }}>
            {rooms.map((room, i) => (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -4, scale: 1.01 }}
                onClick={() => navigate(`/editor/${room.id}`)}
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--bg-elevated)',
                  borderRadius: '12px',
                  padding: '20px',
                  cursor: 'pointer',
                  position: 'relative',
                }}
              >
                {/* Language badge */}
                <span style={{
                  background: languageColors[room.language] + '22',
                  color: languageColors[room.language] || 'var(--accent-gold)',
                  border: `1px solid ${languageColors[room.language] || 'var(--accent-gold)'}44`,
                  borderRadius: '6px',
                  padding: '3px 10px',
                  fontSize: '12px',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontWeight: 500,
                }}>
                  {room.language}
                </span>

                {/* Room name */}
                <h3 style={{
                  color: 'var(--text-primary)',
                  fontSize: '18px',
                  fontWeight: 600,
                  marginTop: '12px',
                  marginBottom: '8px',
                }}>
                  {room.name}
                </h3>

                {/* Meta */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '12px',
                }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                    👥 {room.participantCount} participant{room.participantCount !== 1 ? 's' : ''}
                  </span>
                  <span style={{
                    color: room.isPublic ? 'var(--accent-green)' : 'var(--text-secondary)',
                    fontSize: '12px',
                  }}>
                    {room.isPublic ? '🌐 Public' : '🔒 Private'}
                  </span>
                </div>

                {/* Delete button */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => handleDeleteRoom(room.id, e)}
                  style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: '16px',
                    padding: '4px',
                  }}
                >
                  🗑️
                </motion.button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Create Room Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCreateModal(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 200,
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--bg-elevated)',
                borderRadius: '16px',
                padding: '32px',
                width: '100%',
                maxWidth: '440px',
              }}
            >
              <h3 style={{
                fontFamily: 'Playfair Display, serif',
                color: 'var(--text-primary)',
                fontSize: '1.5rem',
                marginBottom: '24px',
              }}>
                Create New Room
              </h3>

              <form onSubmit={handleCreateRoom} className="space-y-4">
                <div>
                  <label style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                    Room Name
                  </label>
                  <input
                    type="text"
                    value={newRoom.name}
                    onChange={e => setNewRoom(p => ({ ...p, name: e.target.value }))}
                    placeholder="My Awesome Project"
                    required
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = 'var(--accent-purple)'}
                    onBlur={e => e.target.style.borderColor = '#2a2a3a'}
                    autoFocus
                  />
                </div>

                <div>
                  <label style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                    Language
                  </label>
                  <select
                    value={newRoom.language}
                    onChange={e => setNewRoom(p => ({ ...p, language: e.target.value }))}
                    style={{ ...inputStyle, cursor: 'pointer' }}
                  >
                    {languages.map(lang => (
                      <option key={lang} value={lang}>{lang}</option>
                    ))}
                  </select>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginTop: '8px'
                }}>
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={newRoom.isPublic}
                    onChange={e => setNewRoom(p => ({ ...p, isPublic: e.target.checked }))}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <label htmlFor="isPublic"
                    style={{ color: 'var(--text-secondary)', fontSize: '14px', cursor: 'pointer' }}>
                    Make room public
                  </label>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    style={{
                      flex: 1,
                      background: 'transparent',
                      border: '1px solid var(--bg-elevated)',
                      color: 'var(--text-secondary)',
                      borderRadius: '8px',
                      padding: '12px',
                      cursor: 'pointer',
                      fontSize: '15px',
                    }}
                  >
                    Cancel
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={creating}
                    style={{
                      flex: 1,
                      background: creating ? 'var(--bg-elevated)' : 'var(--accent-purple)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '12px',
                      cursor: creating ? 'not-allowed' : 'pointer',
                      fontSize: '15px',
                      fontWeight: 600,
                    }}
                  >
                    {creating ? 'Creating...' : 'Create Room'}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}