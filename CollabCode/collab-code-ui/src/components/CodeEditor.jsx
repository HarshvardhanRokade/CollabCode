import { useRef, useEffect } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { diffToOps } from '../utils/otUtils';

export default function CodeEditor({
  roomId,
  language,
  connection,
  onMount,
}) {
  const prevContentRef = useRef('');
  const versionRef = useRef(0);
  const isApplyingRef = useRef(false);
  const editorRef = useRef(null);

  const handleMount = (editor, monaco) => {
    editorRef.current = editor;
    if (onMount) onMount(editor);

    // Listen for content changes
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
  };

  // Listen for incoming operations from other users
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

      // Save cursor position
      const position = editor.getPosition();

      editor.setValue(newContent);
      prevContentRef.current = newContent;

      // Restore cursor
      if (position) editor.setPosition(position);

      isApplyingRef.current = false;
    };

    connection.on('ReceiveOperation', handleReceiveOperation);
    return () => connection.off('ReceiveOperation', handleReceiveOperation);
  }, [connection]);

  // Listen for initial code when joining room
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

  // Map our language names to Monaco language IDs
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