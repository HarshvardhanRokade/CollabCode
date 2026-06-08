import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axiosInstance';
import { startConnection, stopConnection } from '../api/signalrConnection';
import CodeEditor from '../components/CodeEditor';
import Terminal from '../components/Terminal';
import CollaboratorsList from '../components/CollaboratorsList';
import LanguageSelector from '../components/LanguageSelector';
import VersionHistory from '../components/VersionHistory';

export default function Editor() {
  const { roomId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [room, setRoom] = useState(null);
  const [connection, setConnection] = useState(null);
  const [activeUsers, setActiveUsers] = useState([]);
  const [language, setLanguage] = useState('javascript');
  const [output, setOutput] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connected');
  const editorRef = useRef(null);

  // Load room and connect SignalR
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        const res = await axiosInstance.get(`/rooms/${roomId}`);
        if (cancelled) return;

        setRoom(res.data);
        setLanguage(res.data.language);

        const token = localStorage.getItem('token');
        const conn = await startConnection(token);
        if (cancelled) {
          await stopConnection();
          return;
        }

        setConnection(conn);

        conn.onreconnecting(() => {
          setConnectionStatus('reconnecting');
          toast('Reconnecting...', { icon: '🔄' });
        });
        
        conn.onreconnected(() => {
          setConnectionStatus('connected');
          toast.success('Reconnected!');
        });
        
        conn.onclose(() => {
          setConnectionStatus('disconnected');
        });

        conn.on('UserJoined', (userName) => {
          toast.success(`${userName} joined`);
        });

        conn.on('UserLeft', (userName) => {
          toast(`${userName} left`, { icon: '👋' });
        });

        conn.on('RoomUsersUpdated', (users) => {
          setActiveUsers(users);
        });

        await conn.invoke('JoinRoom', roomId);
        if (cancelled) return;

        setIsConnecting(false);

      } catch (err) {
        if (cancelled) return;
        console.error('Editor init error:', err);
        toast.error('Failed to connect to room');
        navigate('/dashboard');
      }
    };

    init();

    return () => {
      cancelled = true;
      stopConnection();
    };
  }, [roomId, navigate]);

  const handleRunCode = async () => {
    if (!editorRef.current) return;
    const code = editorRef.current.getValue();

    if (!code.trim()) {
      toast.error('Write some code first!');
      return;
    }

    setIsExecuting(true);
    setOutput(null);

    try {
      const res = await axiosInstance.post('/execution/run', {
        code,
        language,
        input: '',
      });
      setOutput(res.data);
    } catch {
      toast.error('Execution failed');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleLanguageChange = async (newLang) => {
    setLanguage(newLang);
    try {
      await axiosInstance.put(`/rooms/${roomId}`, {
        name: room.name,
        language: newLang,
        isPublic: room.isPublic,
      });
    } catch {}
  };

  const handleSaveSnapshot = async () => {
    const message = prompt('Snapshot message (like a git commit):');
    if (message === null) return;
    try {
      await axiosInstance.post(`/rooms/${roomId}/snapshots`, {
        message: message || `Snapshot at ${new Date().toLocaleTimeString()}`
      });
      toast.success('Snapshot saved! 📸');
    } catch {
      toast.error('Failed to save snapshot');
    }
  };

  const handleRestore = (code) => {
    if (editorRef.current) {
      editorRef.current.setValue(code);
    }
  };

  if (isConnecting) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '16px',
      }}>
        <div style={{ color: 'var(--accent-purple)', fontSize: '24px' }}>⚡</div>
        <p style={{ color: 'var(--text-secondary)' }}>Connecting to room...</p>
      </div>
    );
  }

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg-primary)',
      overflow: 'hidden',
    }}>
      <Toaster />

      {/* ── Top Bar ─────────────────────────────── */}
      <div style={{
        height: '56px',
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--bg-elevated)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        flexShrink: 0,
        gap: '12px',
      }}>
        {/* Left */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/dashboard')}
            style={{
              background: 'transparent',
              border: '1px solid var(--bg-elevated)',
              color: 'var(--text-secondary)',
              borderRadius: '8px',
              padding: '6px 12px',
              cursor: 'pointer',
              fontSize: '13px',
              flexShrink: 0,
            }}
          >
            ← Back
          </motion.button>
          <span style={{
            fontFamily: 'Playfair Display, serif',
            color: 'var(--text-primary)',
            fontSize: '16px',
            fontWeight: 600,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {room?.name}
          </span>
          {connectionStatus !== 'connected' && (
            <motion.span
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              style={{
                fontSize: '12px',
                color: connectionStatus === 'reconnecting'
                  ? 'var(--accent-gold)'
                  : 'var(--accent-red)',
                background: connectionStatus === 'reconnecting'
                  ? '#F5A62322' : '#FF475722',
                padding: '3px 10px',
                borderRadius: '20px',
                border: `1px solid ${connectionStatus === 'reconnecting'
                  ? 'var(--accent-gold)' : 'var(--accent-red)'}`,
                flexShrink: 0,
              }}
            >
              {connectionStatus === 'reconnecting'
                ? '🔄 Reconnecting...' : '❌ Disconnected'}
            </motion.span>
          )}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              toast.success('Room URL copied! 🔗');
            }}
            style={{
              background: 'transparent',
              border: '1px solid var(--bg-elevated)',
              color: 'var(--text-secondary)',
              borderRadius: '8px',
              padding: '5px 12px',
              cursor: 'pointer',
              fontSize: '12px',
              flexShrink: 0,
            }}
          >
            🔗 Share
          </motion.button>
        </div>
        {/* Center */}
        <CollaboratorsList users={activeUsers} />
        {/* Right */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          flexShrink: 0,
        }}>
          <LanguageSelector value={language} onChange={handleLanguageChange} />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowHistory(true)}
            style={{
              background: 'transparent',
              border: '1px solid var(--accent-purple)',
              color: 'var(--accent-purple)',
              borderRadius: '8px',
              padding: '6px 14px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            📋 History
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSaveSnapshot}
            style={{
              background: 'transparent',
              border: '1px solid var(--accent-gold)',
              color: 'var(--accent-gold)',
              borderRadius: '8px',
              padding: '6px 14px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            📸 Snapshot
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRunCode}
            disabled={isExecuting}
            style={{
              background: isExecuting
                ? 'var(--bg-elevated)'
                : 'var(--accent-green)',
              color: isExecuting ? 'var(--text-secondary)' : '#000',
              border: 'none',
              borderRadius: '8px',
              padding: '6px 20px',
              cursor: isExecuting ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 700,
            }}
          >
            {isExecuting ? '⏳ Running...' : '▶ Run'}
          </motion.button>
        </div>
      </div>

      {/* ── Editor ──────────────────────────────── */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <CodeEditor
          roomId={roomId}
          language={language}
          connection={connection}
          onMount={(editor) => { editorRef.current = editor; }}
        />
      </div>

      {/* ── Terminal ────────────────────────────── */}
      <AnimatePresence>
        {output && (
          <Terminal
            output={output}
            onClose={() => setOutput(null)}
          />
        )}
      </AnimatePresence>

      <VersionHistory
        roomId={roomId}
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        onRestore={handleRestore}
      />
    </div>
  );
}