import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import { 
  ArrowLeft, Link as LinkIcon, History, Camera, 
  Play, Loader2, WifiOff, RefreshCw, TerminalSquare 
} from 'lucide-react';

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

  // --- State & Features ---
  const [stdin, setStdin] = useState('');
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
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

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        const res = await axiosInstance.get(`/rooms/${roomId}`);
        if (cancelled) return;

        setRoom(res.data);
        setLanguage(res.data.language);

        const conn = await startConnection();
        if (cancelled) {
          await stopConnection();
          return;
        }

        setConnection(conn);

        conn.onreconnecting(() => {
          setConnectionStatus('reconnecting');
          toast('Reconnecting...', { icon: <RefreshCw className="w-4 h-4 text-amber-500 animate-spin" /> });
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
          toast(`${userName} left`);
        });

        conn.on('RoomUsersUpdated', (users) => {
          setActiveUsers(users);
        });

        conn.on('ReceiveLanguageChange', (lang) => {
          setLanguage(lang);
          toast(`Language changed to ${lang}`, { icon: '🔤' });
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
    setIsTerminalOpen(true); // Open immediately
    setOutput(null);

    try {
      const res = await axiosInstance.post('/execution/run', {
        code,
        language,
        input: stdin,
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
      if (connection && connection.state === 'Connected') {
        await connection.invoke('SendLanguageChange', roomId, newLang);
      }
    } catch {
      toast.error('Failed to sync language change');
    }
  };

  const handleSaveSnapshot = async () => {
    const message = prompt('Snapshot message (like a git commit):');
    if (message === null) return;
    try {
      await axiosInstance.post(`/rooms/${roomId}/snapshots`, {
        message: message || `Snapshot at ${new Date().toLocaleTimeString()}`
      });
      toast.success('Snapshot saved!');
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
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#1e1e1e] text-zinc-400 gap-4 font-sans">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        <p className="text-sm tracking-wide">Connecting to workspace...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-full bg-[#1e1e1e] text-zinc-300 overflow-hidden font-sans">
      <Toaster
        toastOptions={{
          style: { background: '#27272a', color: '#e4e4e7', border: '1px solid #3f3f46' }
        }}
      />

      {/* ── Top Bar ─────────────────────────────── */}
      <header className="flex items-center justify-between h-[60px] px-4 bg-[#181818] border-b border-zinc-800 shrink-0">

        {/* Left: Navigation & Info */}
        <div className="flex items-center gap-4 min-w-0">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-zinc-400 hover:text-zinc-100 transition-colors text-sm font-medium flex items-center gap-1.5"
          >
            <ArrowLeft size={16} />
            Back
          </button>

          <div className="h-5 w-[1px] bg-zinc-700"></div>

          <span className="text-zinc-100 text-[15px] font-semibold truncate tracking-wide">
            {room?.name}
          </span>

          {connectionStatus !== 'connected' && (
            <motion.span
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${connectionStatus === 'reconnecting'
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                : 'bg-red-500/10 text-red-400 border-red-500/20'
                }`}
            >
              {connectionStatus === 'reconnecting' ? (
                <><RefreshCw size={12} className="animate-spin" /> Reconnecting...</>
              ) : (
                <><WifiOff size={12} /> Disconnected</>
              )}
            </motion.span>
          )}

          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              toast.success('Room URL copied!');
            }}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 px-2.5 py-1.5 rounded bg-zinc-800/50 hover:bg-zinc-800 transition-colors border border-zinc-700/50"
          >
            <LinkIcon size={14} />
            Share
          </button>
        </div>

        {/* Center: Collaborators */}
        <div className="hidden md:flex flex-1 justify-center">
          <CollaboratorsList users={activeUsers} />
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3 shrink-0">
          <LanguageSelector value={language} onChange={handleLanguageChange} />

          <div className="h-5 w-[1px] bg-zinc-700 mx-1"></div>

          <button
            onClick={() => setShowHistory(true)}
            className="flex items-center gap-1.5 text-xs font-medium text-zinc-300 hover:text-white px-3 py-2 rounded-lg bg-zinc-800/50 hover:bg-zinc-700 border border-zinc-700 transition-colors"
          >
            <History size={14} />
            History
          </button>

          <button
            onClick={handleSaveSnapshot}
            className="flex items-center gap-1.5 text-xs font-medium text-blue-400 hover:text-blue-300 px-3 py-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 transition-colors"
          >
            <Camera size={14} />
            Snapshot
          </button>

          {/* NEW: I/O Terminal Toggle Button */}
          <button
            onClick={() => setIsTerminalOpen(prev => !prev)}
            className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-lg transition-colors border ${
              isTerminalOpen 
                ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' 
                : 'bg-transparent hover:bg-purple-500/10 text-purple-400 border-purple-500/50'
            }`}
          >
            <TerminalSquare size={14} />
            I/O
          </button>

          <button
            onClick={handleRunCode}
            disabled={isExecuting}
            className={`flex items-center gap-1.5 text-sm font-bold px-5 py-2 rounded-lg transition-all shadow-md ${isExecuting
              ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed shadow-none'
              : 'bg-emerald-500 hover:bg-emerald-400 text-emerald-950 shadow-emerald-500/20'
              }`}
          >
            {isExecuting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play size={16} fill="currentColor" />
                Run
              </>
            )}
          </button>
        </div>
      </header>

      {/* ── Main Workspace ──────────────────────── */}
      <main className="flex flex-col flex-1 min-h-0 relative overflow-hidden">

        {/* Editor Pane */}
        <div className="flex-1 min-h-0 relative">
          <CodeEditor
            roomId={roomId}
            language={language}
            connection={connection}
            onMount={(editor) => { editorRef.current = editor; }}
          />
        </div>

        {/* Terminal Pane (Bottom Docked) */}
        <AnimatePresence>
          {isTerminalOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: '35vh', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              className="shrink-0 w-full border-t border-zinc-800 bg-[#0A0A0F] z-10 shadow-[0_-10px_40px_rgba(0,0,0,0.3)]"
            >
              <Terminal
                output={output}
                onClose={() => setIsTerminalOpen(false)}
                stdin={stdin}
                onStdinChange={setStdin}
                isExecuting={isExecuting}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <VersionHistory
        roomId={roomId}
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        onRestore={handleRestore}
      />
    </div>
  );
}