import { useRef, useEffect } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { useTheme } from '../context/ThemeContext';
import { diffToOps } from '../utils/otUtils';

// Premium color palette for collaborator cursors
const USER_COLORS = [
  '#A855F7', '#00D68F', '#F5A623', 
  '#FF4757', '#00BCD4', '#FF6B35', 
  '#EC4899', '#3B82F6'
];

export default function CodeEditor({
  roomId,
  activeFile,
  connection,
  onMount,
  onFileContentUpdate,
  onError,   // Handle operation errors
  onWarning  // Handle paste warnings
}) {
  const { theme } = useTheme();
  
  const prevContentRef = useRef('');
  const versionRef = useRef(0);
  const isApplyingRef = useRef(false);
  
  // Elements and instance references
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const cursorThrottleRef = useRef(null);
  const activeFileIdRef = useRef(activeFile?.id);

  // Room-isolated tracking caches
  const userDecorationsRef = useRef({});
  const userColorMapRef = useRef({});
  const colorIndexRef = useRef(0);

  const getUserColor = (userId) => {
    if (!userColorMapRef.current[userId]) {
      userColorMapRef.current[userId] = USER_COLORS[colorIndexRef.current % USER_COLORS.length];
      colorIndexRef.current++;
    }
    return userColorMapRef.current[userId];
  };

  // ── Update editor content when switching file tabs ──
  useEffect(() => {
    activeFileIdRef.current = activeFile?.id;
    if (editorRef.current && activeFile) {
      isApplyingRef.current = true;
      editorRef.current.setValue(activeFile.content || '');
      prevContentRef.current = activeFile.content || '';
      isApplyingRef.current = false;
    }
  }, [activeFile?.id]);

  const handleMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    
    if (onMount) onMount(editor, monaco);

    // Set initial content if available on mount
    if (activeFile) {
      editor.setValue(activeFile.content || '');
      prevContentRef.current = activeFile.content || '';
    }

    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyF,
      () => {
        editor.getAction('editor.action.formatDocument')?.run();
      }
    );

    // ── 1. Listen for Content Changes (OT Engine & Size Limits) ──
    editor.onDidChangeModelContent(() => {
      if (isApplyingRef.current) return;

      const current = editor.getValue();
      
      // FIX: Block oversized content immediately to protect the SignalR connection
      if (current.length > 500_000) {
        isApplyingRef.current = true;
        editor.trigger('keyboard', 'undo', null);
        prevContentRef.current = editor.getValue();
        isApplyingRef.current = false;
        
        if (onError) onError('File size limit (500KB) reached — paste blocked!');
        return; // Don't send operation
      }

      // Warn at 400KB
      if (current.length > 400_000) {
        const sizeKB = Math.round(current.length / 1024);
        if (onWarning) onWarning(`File is ${sizeKB}KB — approaching 500KB limit`);
      }

      const prev = prevContentRef.current;
      if (current === prev) return;

      const ops = diffToOps(prev, current, versionRef.current++, 'local');
      prevContentRef.current = current;

      if (connection && connection.state === 'Connected' && activeFileIdRef.current) {
        ops.forEach(op => {
          connection.invoke('SendOperation', roomId, activeFileIdRef.current, op)
            .catch(err => console.error('SendOperation error:', err));
        });
      }
    });

    // ── 2. Listen for Local Cursor Movements ──
    editor.onDidChangeCursorPosition((e) => {
      if (isApplyingRef.current) return;
      if (!connection || connection.state !== 'Connected') return;

      if (cursorThrottleRef.current) {
        clearTimeout(cursorThrottleRef.current);
      }

      cursorThrottleRef.current = setTimeout(() => {
        const position = {
          lineNumber: e.position.lineNumber,
          column: e.position.column,
        };
        connection.invoke('SendCursorPosition', roomId, position)
          .catch((err) => console.error('SendCursorPosition error:', err));
      }, 100);
    });
  };

  // ── 3. Effect: Handle Real-Time Collaborative Operations ──
  useEffect(() => {
    if (!connection) return;

    const handleReceiveOperation = (fileId, op) => {
      if (!editorRef.current) return;
      
      // If the operation is for a background tab, update parent state!
      if (fileId !== activeFileIdRef.current) {
        if (onFileContentUpdate) onFileContentUpdate(fileId, op);
        return; 
      }

      isApplyingRef.current = true;
      const editor = editorRef.current;
      const current = editor.getValue();

      let newContent = current;
      if (op.type === 'insert') {
        const pos = Math.min(op.position, current.length);
        newContent = current.slice(0, pos) + op.text + current.slice(pos);
      } else if (op.type === 'delete') {
        const pos = Math.min(op.position, current.length);
        const len = Math.min(op.length, current.length - pos);
        newContent = current.slice(0, pos) + current.slice(pos + len);
      }

      const position = editor.getPosition();
      editor.setValue(newContent);
      prevContentRef.current = newContent;
      if (position) editor.setPosition(position);

      isApplyingRef.current = false;
    };

    const handleOperationError = (message) => {
      if (onError) onError(message);
    };

    connection.on('ReceiveOperation', handleReceiveOperation);
    connection.on('OperationError', handleOperationError); // Catch file limit errors from server

    return () => {
      connection.off('ReceiveOperation', handleReceiveOperation);
      connection.off('OperationError', handleOperationError);
    };
  }, [connection, onFileContentUpdate, onError]);

  // ── 4. Effect: Draw Other Users' Remote Cursors ──
  useEffect(() => {
    if (!connection) return;

    const handleReceiveCursorPosition = (position, userId, userName) => {
      if (!editorRef.current || !monacoRef.current) return;

      const editor = editorRef.current;
      const monaco = monacoRef.current;
      const color = getUserColor(userId);
      const safeUserId = userId.replace(/-/g, '');

      const styleId = `cursor-style-${safeUserId}`;
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.innerHTML = `
          .cursor-${safeUserId} { border-left: 2px solid ${color} !important; }
          .cursor-label-${safeUserId} { position: absolute; z-index: 100; }
          .cursor-label-${safeUserId}::after {
            content: "${userName}";
            position: absolute; bottom: 100%; left: 0;
            background: ${color}; color: #FFFFFF; font-size: 10px;
            font-family: system-ui, -apple-system, sans-serif; font-weight: 700;
            padding: 1px 5px; border-radius: 4px 4px 4px 0px; white-space: nowrap;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4); transform: translateY(-2px);
            pointer-events: none;
          }
        `;
        document.head.appendChild(style);
      }

      if (userDecorationsRef.current[userId]) {
        editor.deltaDecorations(userDecorationsRef.current[userId], []);
      }

      userDecorationsRef.current[userId] = editor.deltaDecorations([], [
        {
          range: new monaco.Range(
            position.lineNumber,
            position.column,
            position.lineNumber,
            position.column
          ),
          options: {
            className: `cursor-${safeUserId}`,
            beforeContentClassName: `cursor-label-${safeUserId}`,
          }
        }
      ]);
    };

    connection.on('ReceiveCursorPosition', handleReceiveCursorPosition);
    
    return () => {
      connection.off('ReceiveCursorPosition', handleReceiveCursorPosition);
      Object.keys(userDecorationsRef.current).forEach((id) => {
        const el = document.getElementById(`cursor-style-${id.replace(/-/g, '')}`);
        if (el) el.remove();
      });
    };
  }, [connection]);

  // ── 5. Effect: Handle Cursor Cleanup on Disconnect ──
  useEffect(() => {
    if (!connection) return;

    const handleUserLeft = (userName, userId) => {
      if (!editorRef.current) return;
      
      if (userDecorationsRef.current[userId]) {
        editorRef.current.deltaDecorations(userDecorationsRef.current[userId], []);
        delete userDecorationsRef.current[userId];
      }
      
      const safeUserId = userId.replace(/-/g, '');
      const styleId = `cursor-style-${safeUserId}`;
      const styleEl = document.getElementById(styleId);
      if (styleEl) styleEl.remove();
    };

    connection.on('UserLeft', handleUserLeft);
    
    return () => {
      connection.off('UserLeft', handleUserLeft);
    };
  }, [connection]);

  const monacoLanguage = {
    javascript: 'javascript',
    typescript: 'typescript',
    python:     'python',
    java:       'java',
    csharp:     'csharp',
    cpp:        'cpp',
    go:         'go',
    rust:       'rust',
  }[activeFile?.language] || 'javascript';

  return (
    <div className="w-full h-full bg-theme-base transition-colors duration-300">
      <MonacoEditor
        height="100%"
        width="100%"
        language={monacoLanguage}
        theme={theme === 'dark' ? 'vs-dark' : 'light'}
        options={{
          fontSize: 14,
          fontFamily: "'JetBrains Mono', monospace",
          fontLigatures: true,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: 'on',
          lineNumbers: 'on',
          renderLineHighlight: 'all',
          cursorBlinking: 'smooth',
          smoothScrolling: true,
          padding: { top: 24, bottom: 24 },
          overviewRulerBorder: false,
          hideCursorInOverviewRuler: true,
          glyphMargin: true,
          formatOnPaste: true, 
          scrollbar: {
            verticalScrollbarSize: 8,
            horizontalScrollbarSize: 8,
            useShadows: false,
          }
        }}
        onMount={handleMount}
      />
    </div>
  );
}