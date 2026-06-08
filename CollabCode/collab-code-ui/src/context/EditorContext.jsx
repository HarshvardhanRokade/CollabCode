import { createContext, useContext, useState, useRef } from 'react';

const EditorContext = createContext();

export function EditorProvider({ children }) {
  const [language, setLanguage] = useState('javascript');
  const [activeUsers, setActiveUsers] = useState([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [output, setOutput] = useState(null);
  const editorRef = useRef(null);
  const connectionRef = useRef(null);

  return (
    <EditorContext.Provider value={{
      language, setLanguage,
      activeUsers, setActiveUsers,
      isExecuting, setIsExecuting,
      output, setOutput,
      editorRef,
      connectionRef,
    }}>
      {children}
    </EditorContext.Provider>
  );
}

export const useEditor = () => useContext(EditorContext);