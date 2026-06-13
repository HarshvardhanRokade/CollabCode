import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileCode2, X, Plus } from 'lucide-react';

export default function FileTabs({
  files, 
  activeFileId, 
  onSwitchFile, 
  onCreateFile, 
  onDeleteFile, 
  onRenameFile
}) {
  const [showNewFileInput, setShowNewFileInput] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');

  const detectLanguage = (filename) => {
    const ext = filename.split('.').pop();
    const map = { 
      js: 'javascript', ts: 'typescript', py: 'python', 
      java: 'java', cs: 'csharp', cpp: 'cpp', go: 'go', rs: 'rust' 
    };
    return map[ext] || 'javascript';
  };

  const handleCreate = () => {
    if (!newFileName.trim()) {
      setShowNewFileInput(false);
      return;
    }
    onCreateFile(newFileName.trim(), detectLanguage(newFileName.trim()));
    setNewFileName('');
    setShowNewFileInput(false);
  };

  const handleRenameSubmit = (fileId) => {
    if (renameValue.trim()) onRenameFile(fileId, renameValue.trim());
    setRenamingId(null);
  };

  return (
    <div className="flex items-center bg-theme-surface border-b border-theme-border overflow-x-auto shrink-0 h-10 transition-colors duration-300 custom-scrollbar">
      <AnimatePresence>
        {files.map(file => (
          <motion.div
            key={file.id}
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            onClick={() => onSwitchFile(file.id)}
            onDoubleClick={() => { setRenamingId(file.id); setRenameValue(file.name); }}
            className={`flex items-center gap-2 px-3 h-full cursor-pointer border-r border-theme-border shrink-0 transition-colors ${
              file.id === activeFileId 
                ? 'bg-theme-base border-t-2 border-t-purple-500' 
                : 'bg-transparent border-t-2 border-t-transparent hover:bg-theme-elevated'
            }`}
          >
            <FileCode2 size={14} className={file.isEntryPoint ? 'text-purple-500' : 'text-theme-muted'} />
            
            {renamingId === file.id ? (
              <input
                autoFocus
                value={renameValue}
                onChange={e => setRenameValue(e.target.value)}
                onBlur={() => handleRenameSubmit(file.id)}
                onKeyDown={e => e.key === 'Enter' && handleRenameSubmit(file.id)}
                onClick={e => e.stopPropagation()}
                className="bg-theme-elevated border border-purple-500 text-theme-text rounded px-1.5 py-0.5 text-xs font-mono outline-none w-24"
              />
            ) : (
              <span className={`text-xs font-mono select-none ${file.id === activeFileId ? 'text-theme-text' : 'text-theme-muted'}`}>
                {file.name}
              </span>
            )}
            
            {files.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); onDeleteFile(file.id); }}
                className="text-theme-muted hover:text-red-500 p-0.5 rounded transition-colors ml-1"
                title="Delete File"
              >
                <X size={12} />
              </button>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
      
      {/* New file button/input */}
      {showNewFileInput ? (
        <div className="flex items-center px-2 gap-1.5 shrink-0">
          <input
            autoFocus
            value={newFileName}
            onChange={e => setNewFileName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            onBlur={() => { if (!newFileName.trim()) setShowNewFileInput(false); }}
            placeholder="filename.ext"
            className="bg-theme-elevated border border-purple-500 text-theme-text rounded px-2 py-1 text-xs font-mono outline-none w-28 placeholder:text-theme-muted"
          />
          <button
            onClick={handleCreate}
            className="bg-purple-600 text-white rounded p-1 hover:bg-purple-500 transition-colors"
          >
            <Plus size={14} />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowNewFileInput(true)}
          className="text-theme-muted hover:text-theme-text hover:bg-theme-elevated h-full px-3 transition-colors flex items-center shrink-0"
          title="Create New File"
        >
          <Plus size={16} />
        </button>
      )}
    </div>
  );
}