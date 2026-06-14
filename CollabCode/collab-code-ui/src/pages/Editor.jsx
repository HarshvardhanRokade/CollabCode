import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import { 
  ArrowLeft, Link as LinkIcon, History, Camera, 
  Play, Loader2, WifiOff, RefreshCw, TerminalSquare, Download, MessageSquare, Sparkles, Sun, Moon 
} from 'lucide-react';

// Prettier Imports
import * as prettier from 'prettier/standalone';
import parserBabel from 'prettier/plugins/babel';
import parserEstree from 'prettier/plugins/estree';
import parserTypescript from 'prettier/plugins/typescript';

import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import axiosInstance from '../api/axiosInstance';
import { startConnection, stopConnection } from '../api/signalrConnection';
import CodeEditor from '../components/CodeEditor';
import Terminal from '../components/Terminal';
import CollaboratorsList from '../components/CollaboratorsList';
import LanguageSelector from '../components/LanguageSelector';
import VersionHistory from '../components/VersionHistory';
import ChatSidebar from '../components/ChatSidebar';
import FileTabs from '../components/FileTabs';

const languageExtensions = {
  javascript: 'js', typescript: 'ts', python: 'py', java: 'java',
  csharp: 'cs', cpp: 'cpp', go: 'go', rust: 'rs',
};

const prettierParsers = {
  javascript: { parser: 'babel', plugins: [parserBabel, parserEstree] },
  typescript: { parser: 'typescript', plugins: [parserTypescript, parserEstree] },
};

const extractErrorLine = (errorText, lang) => {
  if (!errorText) return null;
  const patterns = {
    python: /line (\d+)/i, javascript: /:(\d+):\d+/, typescript: /:(\d+):\d+/,
    java: /\.java:(\d+)/, csharp: /:line (\d+)/i, cpp: /:(\d+):\d+:/,
    go: /:(\d+):/, rust: /:(\d+):\d+/,
  };
  const pattern = patterns[lang] || /line (\d+)/i;
  const match = errorText.match(pattern);
  return match ? parseInt(match[1], 10) : null;
};

export default function Editor() {
  const { roomId } = useParams();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // --- Core State ---
  const [room, setRoom] = useState(null);
  const [connection, setConnection] = useState(null);
  const [activeUsers, setActiveUsers] = useState([]);
  const [isConnecting, setIsConnecting] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('connected');
  
  // --- File System State ---
  const [files, setFiles] = useState([]);
  const [activeFileId, setActiveFileId] = useState(null);
  const activeFile = files.find(f => f.id === activeFileId) || null;

  // --- Tools State ---
  const [stdin, setStdin] = useState('');
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [output, setOutput] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  
  const showChatRef = useRef(false);
  const editorRef = useRef(null);
  const monacoInstanceRef = useRef(null);
  const errorDecorationRef = useRef([]);

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

        const filesRes = await axiosInstance.get(`/rooms/${roomId}/files`);
        if (cancelled) return;
        setFiles(filesRes.data);
        const entry = filesRes.data.find(f => f.isEntryPoint) || filesRes.data[0];
        if (entry) setActiveFileId(entry.id);

        const token = localStorage.getItem('token');
        const conn = await startConnection(token);
        
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

        conn.onclose(() => setConnectionStatus('disconnected'));
        conn.on('UserJoined', (userName) => toast.success(`${userName} joined`));
        conn.on('UserLeft', (userName) => toast(`${userName} left`));
        conn.on('RoomUsersUpdated', (users) => setActiveUsers(users));
        
        conn.on('ReceiveChatMessage', (userName) => {
          if (!showChatRef.current && userName !== user?.userName) {
            setUnreadCount(prev => prev + 1);
          }
        });

        // --- Multi-File SignalR Handlers ---
        conn.on('InitialFiles', (filesData) => {
          setFiles(filesData);
          const e = filesData.find(f => f.isEntryPoint) || filesData[0];
          if (e && !activeFileId) setActiveFileId(e.id);
        });

        conn.on('FileCreated', (file) => {
          setFiles(prev => [...prev, file]);
        });

        conn.on('FileDeleted', (fileId) => {
          setFiles(prev => prev.filter(f => f.id !== fileId));
          if (activeFileId === fileId) {
            setFiles(prev => {
              if (prev.length > 0) setActiveFileId(prev[0].id);
              return prev;
            });
          }
        });

        conn.on('FileRenamed', (fileId, newName) => {
          setFiles(prev => prev.map(f => f.id === fileId ? { ...f, name: newName } : f));
        });

        await conn.invoke('JoinRoom', roomId);
        if (cancelled) return;

        setIsConnecting(false);

      } catch (err) {
        if (cancelled) return;
        console.error('Editor init error:', err);
        toast.error('Failed to connect to workspace');
        navigate('/dashboard');
      }
    };

    init();

    return () => {
      cancelled = true;
      stopConnection();
    };
  }, [roomId, navigate, user?.userName]);

  // ── File Management Actions ──

  const handleSwitchFile = (newFileId) => {
    if (editorRef.current && activeFileId) {
      const currentContent = editorRef.current.getValue();
      setFiles(prev => prev.map(f =>
        f.id === activeFileId ? { ...f, content: currentContent } : f
      ));
    }
    setActiveFileId(newFileId);
  };

  const handleFileContentUpdate = (fileId, op) => {
    setFiles(prev => prev.map(f => {
      if (f.id !== fileId) return f;
      
      let newContent = f.content || '';
      if (op.type === 'insert') {
        const pos = Math.min(op.position, newContent.length);
        newContent = newContent.slice(0, pos) + op.text + newContent.slice(pos);
      } else if (op.type === 'delete') {
        const pos = Math.min(op.position, newContent.length);
        const len = Math.min(op.length, newContent.length - pos);
        newContent = newContent.slice(0, pos) + newContent.slice(pos + len);
      }
      return { ...f, content: newContent };
    }));
  };

  const handleCreateFile = async (name, lang) => {
    try {
      const res = await axiosInstance.post(`/rooms/${roomId}/files`, { name, language: lang });
      setFiles(prev => [...prev, res.data]);
      handleSwitchFile(res.data.id); 
      connection?.invoke('SendFileCreated', roomId, res.data);
      toast.success(`Created ${name}`);
    } catch {
      toast.error('Failed to create file');
    }
  };

  const handleDeleteFile = async (fileId) => {
    if (files.length <= 1) {
      toast.error("Can't delete the only file in the workspace");
      return;
    }
    if (!window.confirm('Delete this file permanently?')) return;
    try {
      await axiosInstance.delete(`/rooms/${roomId}/files/${fileId}`);
      setFiles(prev => {
        const updated = prev.filter(f => f.id !== fileId);
        if (activeFileId === fileId && updated.length > 0) setActiveFileId(updated[0].id);
        return updated;
      });
      connection?.invoke('SendFileDeleted', roomId, fileId);
      toast.success('File deleted');
    } catch {
      toast.error('Failed to delete file');
    }
  };

  const handleRenameFile = async (fileId, newName) => {
    try {
      await axiosInstance.put(`/rooms/${roomId}/files/${fileId}/rename`, { name: newName });
      setFiles(prev => prev.map(f => f.id === fileId ? { ...f, name: newName } : f));
      connection?.invoke('SendFileRenamed', roomId, fileId, newName);
    } catch {
      toast.error('Failed to rename file');
    }
  };

  // ── Execution & Editor Actions ──
  const handleRunCode = async () => {
    const entryFile = files.find(f => f.isEntryPoint) || activeFile;
    if (!entryFile) return;

    const code = entryFile.id === activeFileId
      ? editorRef.current?.getValue() || entryFile.content
      : entryFile.content;

    if (!code.trim()) {
      toast.error('Write some code first!');
      return;
    }

    setIsExecuting(true);
    setIsTerminalOpen(true);
    setOutput(null);

    if (editorRef.current && errorDecorationRef.current.length > 0) {
      errorDecorationRef.current = editorRef.current.deltaDecorations(
        errorDecorationRef.current, []
      );
    }

    try {
      const res = await axiosInstance.post('/execution/run', {
        code,
        language: entryFile.language,
        input: stdin,
      });
      
      setOutput(res.data);

      const errorText = res.data.error;
      if (errorText && errorText.trim().length > 0) {
        const lineNum = extractErrorLine(errorText, entryFile.language);
        if (lineNum && editorRef.current && monacoInstanceRef.current && entryFile.id === activeFileId) {
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
    if (!activeFile) return;
    setFiles(prev => prev.map(f => f.id === activeFileId ? { ...f, language: newLang } : f));
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
    if (editorRef.current && activeFileId) {
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
        
        connection.invoke('SendOperation', roomId, activeFileId, {
          type: 'delete',
          position: 0,
          text: '',
          length: 999999, 
          version: 999998,
          userId: 'restore'
        }).then(() => {
          connection.invoke('SendOperation', roomId, activeFileId, op).catch(console.error);
        }).catch(console.error);
      }
    }
    
    setTimeout(() => setIsRestoring(false), 600);
  };

  const handleExportCode = () => {
    if (!editorRef.current || !activeFile) return;
    const code = editorRef.current.getValue();
    const extension = languageExtensions[activeFile.language] || 'txt';
    
    const fileName = (activeFile.name || 'code')
      .replace(/[^a-z0-9.]/gi, '_')
      .toLowerCase();
      
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName.includes('.') ? fileName : `${fileName}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success(`Downloaded ${fileName}`);
  };

  const handleFormatCode = async () => {
    if (!editorRef.current || !activeFile) return;
    
    const config = prettierParsers[activeFile.language];
    
    if (!config) {
      const action = editorRef.current.getAction('editor.action.formatDocument');
      if (action) {
        await action.run();
        toast.success('Code formatted! ✨');
      } else {
        toast.error('Formatting not available for this language');
      }
      return;
    }
    
    try {
      const code = editorRef.current.getValue();
      const formatted = await prettier.format(code, {
        parser: config.parser,
        plugins: config.plugins,
        semi: true,
        singleQuote: false,
        tabWidth: 2,
      });
      
      const position = editorRef.current.getPosition();
      editorRef.current.setValue(formatted);
      if (position) editorRef.current.setPosition(position);
      
      toast.success('Code formatted! ✨');
    } catch (err) {
      toast.error('Format failed — check for syntax errors');
      console.error('Prettier formatting error:', err);
    }
  };

  if (isConnecting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-theme-base text-theme-muted gap-4 font-sans transition-colors duration-300">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        <p className="text-sm tracking-wide">Connecting to workspace...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-full bg-theme-base text-theme-text overflow-hidden font-sans transition-colors duration-300">
      <Toaster
        toastOptions={{
          style: { background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }
        }}
      />

      {/* ── Top Bar ─────────────────────────────── */}
      <header className="flex items-center justify-between h-[60px] px-4 bg-theme-surface border-b border-theme-border shrink-0 transition-colors duration-300">

        <div className="flex items-center gap-4 min-w-0">
          <button onClick={() => navigate('/dashboard')} className="text-theme-muted hover:text-theme-text transition-colors text-sm font-medium flex items-center gap-1.5">
            <ArrowLeft size={16} /> Back
          </button>
          <div className="h-5 w-[1px] bg-theme-border"></div>
          <span className="text-theme-text text-[15px] font-semibold truncate tracking-wide">
            {room?.name}
          </span>
          {connectionStatus !== 'connected' && (
            <motion.span animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 1, repeat: Infinity }} className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${connectionStatus === 'reconnecting' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
              {connectionStatus === 'reconnecting' ? <><RefreshCw size={12} className="animate-spin" /> Reconnecting...</> : <><WifiOff size={12} /> Disconnected</>}
            </motion.span>
          )}

          <div className="flex items-center gap-2">
            <button onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success('Room URL copied!'); }} className="flex items-center gap-1.5 text-xs text-theme-muted hover:text-theme-text px-2.5 py-1.5 rounded bg-theme-elevated border border-theme-border transition-colors">
              <LinkIcon size={14} /> Share
            </button>
            <button onClick={handleExportCode} className="flex items-center gap-1.5 text-xs text-theme-muted hover:text-theme-text px-2.5 py-1.5 rounded bg-theme-elevated border border-theme-border transition-colors">
              <Download size={14} /> Export
            </button>
            <button onClick={handleFormatCode} className="flex items-center gap-1.5 text-xs text-theme-muted hover:text-theme-text px-2.5 py-1.5 rounded bg-theme-elevated border border-theme-border transition-colors">
              <Sparkles size={14} /> Format
            </button>
          </div>
        </div>

        <div className="hidden md:flex flex-1 justify-center">
          <CollaboratorsList users={activeUsers} />
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button onClick={toggleTheme} className="flex items-center justify-center w-8 h-8 rounded-lg bg-theme-elevated border border-theme-border text-theme-muted hover:text-theme-text transition-colors" title="Toggle Theme">
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          </button>
          
          <LanguageSelector value={activeFile?.language || 'javascript'} onChange={handleLanguageChange} />

          <div className="h-5 w-[1px] bg-theme-border mx-1"></div>
          <button onClick={() => setShowHistory(true)} className="flex items-center gap-1.5 text-xs font-medium text-theme-text hover:opacity-80 px-3 py-2 rounded-lg bg-theme-elevated border border-theme-border transition-colors">
            <History size={14} /> History
          </button>
          <button onClick={handleSaveSnapshot} className="flex items-center gap-1.5 text-xs font-medium text-blue-500 hover:opacity-80 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20 transition-colors">
            <Camera size={14} /> Snapshot
          </button>
          <button onClick={() => { setShowChat(prev => !prev); setUnreadCount(0); }} className={`relative flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg transition-colors border ${showChat ? 'bg-purple-500/10 text-purple-500 border-purple-500/30' : 'bg-transparent text-purple-500 border-purple-500/50'}`}>
            <MessageSquare size={14} /> Chat
            {unreadCount > 0 && <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-theme-border shadow-sm">{unreadCount > 99 ? '99+' : unreadCount}</span>}
          </button>
          <button onClick={() => setIsTerminalOpen(prev => !prev)} className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg transition-colors border ${isTerminalOpen ? 'bg-purple-500/10 text-purple-500 border-purple-500/30' : 'bg-transparent text-purple-500 border-purple-500/50'}`}>
            <TerminalSquare size={14} /> I/O
          </button>
          <button onClick={handleRunCode} disabled={isExecuting} className={`flex items-center gap-1.5 text-sm font-bold px-5 py-2 rounded-lg transition-all shadow-md ml-1 ${isExecuting ? 'bg-theme-elevated text-theme-muted cursor-not-allowed shadow-none' : 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-emerald-500/20'}`}>
            {isExecuting ? <><Loader2 size={16} className="animate-spin" /> Running...</> : <><Play size={16} fill="currentColor" /> Run</>}
          </button>
        </div>
      </header>

      {/* ── Main Layout Wrapper ──────────────────────── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        
        {/* Workspace Column */}
        <main className="flex flex-col flex-1 min-h-0 relative overflow-hidden">
          
          <FileTabs
            files={files}
            activeFileId={activeFileId}
            onSwitchFile={handleSwitchFile}
            onCreateFile={handleCreateFile}
            onDeleteFile={handleDeleteFile}
            onRenameFile={handleRenameFile}
          />

          <div className="flex-1 min-h-0 relative">
            {activeFile ? (
              <CodeEditor
                roomId={roomId}
                activeFile={activeFile}
                connection={connection}
                onFileContentUpdate={handleFileContentUpdate}
                onError={(msg) => toast.error(msg)}           // NEW: Wire up error toasts
                onWarning={(msg) => toast(msg, { icon: '⚠️' })} // NEW: Wire up warning toasts
                onMount={(editor, monaco) => { 
                  editorRef.current = editor; 
                  monacoInstanceRef.current = monaco;
                  editor.onDidChangeModelContent(() => {
                    if (errorDecorationRef.current.length > 0) {
                      errorDecorationRef.current = editor.deltaDecorations(errorDecorationRef.current, []);
                    }
                  });
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-theme-muted text-sm bg-theme-base transition-colors duration-300">
                Create or open a file to start coding.
              </div>
            )}

            <AnimatePresence>
              {isRestoring && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
                >
                  <motion.div
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    className="bg-theme-surface border border-purple-500/50 rounded-xl px-6 py-4 flex items-center gap-3 shadow-2xl shadow-purple-500/20"
                  >
                    <RefreshCw size={24} className="text-purple-500 animate-spin" />
                    <span className="text-theme-text font-bold tracking-wide">Restoring version...</span>
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
                className="shrink-0 w-full border-t border-theme-border bg-theme-base z-10 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] transition-colors duration-300"
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