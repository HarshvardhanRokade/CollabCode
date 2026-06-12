import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, MessageSquare } from 'lucide-react';

export default function ChatSidebar({ connection, isOpen, onClose, currentUser, roomId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!connection) return;
    
    const handleMessage = (userName, message, time) => {
      setMessages(prev => [...prev, { userName, message, time }]);
    };
    
    connection.on('ReceiveChatMessage', handleMessage);
    return () => connection.off('ReceiveChatMessage', handleMessage);
  }, [connection]);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim() || !connection || connection.state !== 'Connected') return;
    
    // Broadcast message to this specific room
    connection.invoke('SendChatMessage', roomId, input.trim());
    setInput('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 320, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="bg-[#0A0A0F] border-l border-zinc-800 flex flex-col h-full shrink-0 overflow-hidden z-20 shadow-2xl"
        >
          {/* ── Header ── */}
          <div className="flex items-center justify-between px-5 py-4 bg-[#12121A] border-b border-zinc-800/80 shrink-0">
            <div className="flex items-center gap-2 text-zinc-100 font-bold text-sm">
              <MessageSquare size={16} className="text-purple-400" />
              Room Chat
            </div>
            <button
              onClick={onClose}
              className="text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 p-1 rounded transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* ── Messages Area ── */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar bg-[#0A0A0F]">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-zinc-500 gap-2">
                <MessageSquare size={32} className="opacity-20" />
                <p className="text-xs font-medium">No messages yet. Say hello! 👋</p>
              </div>
            ) : (
              messages.map((msg, i) => {
                // Determine if message is from the current local user
                const isMe = msg.userName === currentUser;
                
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex flex-col max-w-[85%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}
                  >
                    {!isMe && (
                      <span className="text-[10px] font-bold text-purple-400 mb-1 ml-1 tracking-wide uppercase">
                        {msg.userName}
                      </span>
                    )}
                    
                    <div 
                      className={`px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed break-words shadow-sm ${
                        isMe 
                          ? 'bg-purple-600 text-white rounded-br-sm' 
                          : 'bg-[#18181b] border border-zinc-800 text-zinc-200 rounded-bl-sm'
                      }`}
                    >
                      {msg.message}
                    </div>
                    
                    {msg.time && (
                      <span className="text-[9px] text-zinc-600 mt-1 mx-1 font-medium">
                        {msg.time}
                      </span>
                    )}
                  </motion.div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* ── Input Area ── */}
          <div className="p-4 bg-[#12121A] border-t border-zinc-800/80 shrink-0">
            <form onSubmit={handleSend} className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-[#0A0A0F] border border-zinc-800 text-zinc-200 text-[13px] rounded-xl px-4 py-2.5 outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all placeholder:text-zinc-600"
              />
              <button
                type="submit"
                disabled={!input.trim()}
                className="bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white p-2.5 rounded-xl transition-colors flex items-center justify-center shrink-0 shadow-lg shadow-purple-500/20 disabled:shadow-none"
              >
                <Send size={16} className={input.trim() ? "translate-x-0.5 -translate-y-0.5" : ""} />
              </button>
            </form>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}