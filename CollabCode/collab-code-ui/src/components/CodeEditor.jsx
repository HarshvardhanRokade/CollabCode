import { useRef, useEffect } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { diffToOps } from '../utils/otUtils';

// Premium color palette for collaborator cursors
const USER_COLORS = [
  '#A855F7', '#00D68F', '#F5A623', 
  '#FF4757', '#00BCD4', '#FF6B35', 
  '#EC4899', '#3B82F6'
];

export default function CodeEditor({
  roomId,
  language,
  connection,
  onMount,
}) {
  const prevContentRef = useRef('');
  const versionRef = useRef(0);
  const isApplyingRef = useRef(false);
  
  // Elements and instance references
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const cursorThrottleRef = useRef(null);

  // Room-isolated tracking caches to prevent memory leaks across sessions
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

  const handleMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    
    // FIX: Pass the monaco instance up to Editor.jsx
    if (onMount) onMount(editor, monaco);

    // ── 1. Listen for Content Changes (OT Engine) ──
    editor.onDidChangeModelContent(() => {
      if (isApplyingRef.current) return;

      const current = editor.getValue();
      const prev = prevContentRef.current;
      if (current === prev) return;

      const ops = diffToOps(prev, current, versionRef.current++, 'local');
      prevContentRef.current = current;

      if (connection && connection.state === 'Connected') {
        ops.forEach(op => {
          connection.invoke('SendOperation', roomId, op)
            .catch(err => console.error('SendOperation error:', err));
        });
      }
    });

    // ── 2. Listen for Local Cursor Movements (Throttled to 100ms) ──
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

    const handleReceiveOperation = (op) => {
      if (!editorRef.current) return;

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

    connection.on('ReceiveOperation', handleReceiveOperation);
    return () => connection.off('ReceiveOperation', handleReceiveOperation);
  }, [connection]);

  // ── 4. Effect: Receive Initial Document Hydration ──
  useEffect(() => {
    if (!connection) return;

    const handleInitialCode = (code) => {
      if (editorRef.current) {
        isApplyingRef.current = true;
        editorRef.current.setValue(code || '');
        prevContentRef.current = code || '';
        isApplyingRef.current = false;
      }
    };

    connection.on('InitialCode', handleInitialCode);
    return () => connection.off('InitialCode', handleInitialCode);
  }, [connection]);

  // ── 5. Effect: Draw Other Users' Remote Cursors ──
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
          /* The thin sleek vertical caret */
          .cursor-${safeUserId} {
            border-left: 2px solid ${color} !important;
          }
          
          /* The anchor label element layout */
          .cursor-label-${safeUserId} {
            position: absolute;
            z-index: 100;
          }
          
          /* Floating name badge anchored completely above the text row */
          .cursor-label-${safeUserId}::after {
            content: "${userName}";
            position: absolute;
            bottom: 100%;
            left: 0;
            background: ${color};
            color: #0A0A0F;
            font-size: 10px;
            font-family: system-ui, -apple-system, sans-serif;
            font-weight: 700;
            padding: 1px 5px;
            border-radius: 4px 4px 4px 0px;
            white-space: nowrap;
            line-height: normal;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
            transform: translateY(-2px);
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

  const monacoLanguage = {
    javascript: 'javascript',
    typescript: 'typescript',
    python:     'python',
    java:       'java',
    csharp:     'csharp',
    cpp:        'cpp',
    go:         'go',
    rust:       'rust',
  }[language] || 'javascript';

  return (
    <div className="w-full h-full bg-[#1e1e1e]">
      <MonacoEditor
        height="100%"
        width="100%"
        language={monacoLanguage}
        theme="vs-dark"
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
          glyphMargin: true, // NEEDED FOR ERROR HIGHLIGHT ICONS
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