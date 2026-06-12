import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import { 
  ArrowLeft, Link as LinkIcon, History, Camera, 
  Play, Loader2, WifiOff, RefreshCw, TerminalSquare, Download, MessageSquare 
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axiosInstance';
import { startConnection, stopConnection } from '../api/signalrConnection';
import CodeEditor from '../components/CodeEditor';
import Terminal from '../components/Terminal';
import CollaboratorsList from '../components/CollaboratorsList';
import LanguageSelector from '../components/LanguageSelector';
import VersionHistory from '../components/VersionHistory';
import ChatSidebar from '../components/ChatSidebar';

// Map languages to their standard file extensions
const languageExtensions = {
  javascript: 'js',
  typescript: 'ts',
  python:     'py',
  java:       'java',
  csharp:     'cs',
  cpp:        'cpp',
  go:         'go',
  rust:       'rs',
};

// Extract line number from common error message formats
const extractErrorLine = (errorText, lang) => {
  if (!errorText) return null;
  const patterns = {
    python: /line (\d+)/i,
    javascript: /:(\d+):\d+/,
    typescript: /:(\d+):\d+/,
    java: /\.java:(\d+)/,
    csharp: /:line (\d+)/i,
    cpp: /:(\d+):\d+:/,
    go: /:(\d+):/,
    rust: /:(\d+):\d+/,
  };
  const pattern = patterns[lang] || /line (\d+)/i;
  const match = errorText.match(pattern);
  return match ? parseInt(match[1], 10) : null;
};

export default function Editor() {
  const { roomId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  // --- State & Features ---
  const [stdin, setStdin] = useState('');
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  
  // Chat State
  const [showChat, setShowChat] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const showChatRef = useRef(false);
  
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
  const monacoInstanceRef = useRef(null);
  const errorDecorationRef = useRef([]);

  // Sync chat ref for closure access
  useEffect(() => { 
    showChatRef.current = showChat; 
  }, [showChat]);

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

        // Track unread messages if chat is closed
        conn.on('ReceiveChatMessage', (userName) => {
          if (!showChatRef.current && userName !== user?.userName) {
            setUnreadCount(prev => prev + 1);
          }
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
  }, [roomId, navigate, user?.userName]);

  const handleRunCode = async () => {
    if (!editorRef.current) return;
    const code = editorRef.current.getValue();

    if (!code.trim()) {
      toast.error('Write some code first!');
      return;
    }

    setIsExecuting(true);
    setIsTerminalOpen(true);
    setOutput(null);

    // Clear previous error decorations
    if (editorRef.current && errorDecorationRef.current.length > 0) {
      errorDecorationRef.current = editorRef.current.deltaDecorations(
        errorDecorationRef.current, []
      );
    }

    try {
      const res = await axiosInstance.post('/execution/run', {
        code,
        language,
        input: stdin,
      });
      
      setOutput(res.data);

      // Highlight error line if present
      const errorText = res.data.error;
      if (errorText && errorText.trim().length > 0) {
        const lineNum = extractErrorLine(errorText, language);
        if (lineNum && editorRef.current && monacoInstanceRef.current) {
          const monaco = monacoInstanceRef.current;
          const editor = editorRef.current;
          
          errorDecorationRef.current = editor.deltaDecorations([], [
            {
              range: new monaco.Range(lineNum, 1, lineNum, 1),
              options: {
                isWholeLine: true,
                className: 'error-line-highlight',
                glyphMarginClassName: 'error-glyph',
                glyphMarginHoverMessage: { value: 'Error on this line' },
              }
            }
          ]);
          
          // Scroll to the error line
          editor.revealLineInCenter(lineNum);
        }
      }
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
    setIsRestoring(true);
    if (editorRef.current) {
      editorRef.current.setValue(code);
      
      if (connection && connection.state === 'Connected') {
        const op = {
          type: 'insert',
          position: 0,
          text: code,
          length: 0,
          version: 999999,
          userId: 'restore'
        };
        
        connection.invoke('SendOperation', roomId, {
          type: 'delete',
          position: 0,
          text: '',
          length: 999999, 
          version: 999998,
          userId: 'restore'
        }).then(() => {
          connection.invoke('SendOperation', roomId, op).catch(console.error);
        }).catch(console.error);
      }
    }
    
    setTimeout(() => setIsRestoring(false), 600);
  };

  const handleExportCode = () => {
    if (!editorRef.current) return;
    const code = editorRef.current.getValue();
    const extension = languageExtensions[language] || 'txt';
    
    const fileName = (room?.name || 'code')
      .replace(/[^a-z0-9]/gi, '_')
      .toLowerCase();
      
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success(`Downloaded ${fileName}.${extension}`);
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

          <div className="flex items-center gap-2">
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

            <button
              onClick={handleExportCode}
              className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 px-2.5 py-1.5 rounded bg-zinc-800/50 hover:bg-zinc-800 transition-colors border border-zinc-700/50"
            >
              <Download size={14} />
              Export
            </button>
          </div>
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

          <button
            onClick={() => {
              setShowChat(prev => !prev);
              setUnreadCount(0);
            }}
            className={`relative flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg transition-colors border ${
              showChat 
                ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' 
                : 'bg-transparent hover:bg-purple-500/10 text-purple-400 border-purple-500/50'
            }`}
          >
            <MessageSquare size={14} />
            Chat
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-[#181818] shadow-sm">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setIsTerminalOpen(prev => !prev)}
            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg transition-colors border ${
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
            className={`flex items-center gap-1.5 text-sm font-bold px-5 py-2 rounded-lg transition-all shadow-md ml-1 ${isExecuting
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

      {/* ── Main Layout Wrapper ──────────────────────── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        
        {/* Workspace Column (Editor + Terminal) */}
        <main className="flex flex-col flex-1 min-h-0 relative overflow-hidden">
          
          <div className="flex-1 min-h-0 relative">
            <CodeEditor
              roomId={roomId}
              language={language}
              connection={connection}
              onMount={(editor, monaco) => { 
                editorRef.current = editor; 
                monacoInstanceRef.current = monaco;
                
                // Clear error highlighting when code changes
                editor.onDidChangeModelContent(() => {
                  if (errorDecorationRef.current.length > 0) {
                    errorDecorationRef.current = editor.deltaDecorations(
                      errorDecorationRef.current, []
                    );
                  }
                });
              }}
            />

            <AnimatePresence>
              {isRestoring && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-[#0a0a0f]/60 backdrop-blur-sm flex items-center justify-center z-50"
                >
                  <motion.div
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    className="bg-[#12121A] border border-purple-500/50 rounded-xl px-6 py-4 flex items-center gap-3 shadow-2xl shadow-purple-500/20"
                  >
                    <RefreshCw size={24} className="text-purple-400 animate-spin" />
                    <span className="text-zinc-100 font-bold tracking-wide">
                      Restoring version...
                    </span>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

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

        {/* ── Chat Sidebar Pane ──────────────────────── */}
        <ChatSidebar
          connection={connection}
          isOpen={showChat}
          onClose={() => setShowChat(false)}
          currentUser={user?.userName}
          roomId={roomId}
        />
      </div>

      <VersionHistory
        roomId={roomId}
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        onRestore={handleRestore}
      />
    </div>
  );
}