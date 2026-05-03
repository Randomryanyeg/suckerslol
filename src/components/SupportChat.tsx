import React, { useState, useEffect, useRef } from 'react';
import { X, Send } from 'lucide-react';
import { useSocket } from '../shared/SocketContext';
import { useBank } from '../shared/BankContext';

export const SupportChat: React.FC<{ 
  isAdmin?: boolean; 
  targetSocketId?: string;
  targetUsername?: string;
  onClose?: () => void;
  isOpen?: boolean;
}> = ({ isAdmin, targetSocketId, targetUsername, onClose, isOpen }) => {
  const [messages, setMessages] = useState<{ sender: string; text: string; timestamp: number }[]>([]);
  const [input, setInput] = useState('');
  const { socket, sendCommand, activeUsers } = useSocket();
  const { user } = useBank();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const identifier = targetUsername || (targetSocketId ? activeUsers[targetSocketId]?.username : undefined);

  useEffect(() => {
    if (!socket) return;

    const handleChatHistory = (event: any) => {
      const history = event.detail;
      setMessages(history.map((m: any) => ({
        sender: m.from === 'admin' ? 'Support' : (m.from === user?.username ? 'You' : m.from),
        text: m.message,
        timestamp: m.timestamp
      })));
    };

    const handleAdminChatMessage = (msg: any) => {
      // Check if message is relevant to the current user we are chatting with
      const isRelevant = isAdmin && (
        msg.from === identifier || 
        msg.to === identifier || 
        msg.socketId === targetSocketId
      );

      if (isRelevant) {
        setMessages(prev => [...prev, {
          sender: msg.from === 'admin' ? 'You' : msg.from,
          text: msg.message,
          timestamp: Date.now()
        }]);
      }
    };

    const handleChatMessage = (data: { from: string; message: string; to?: string }) => {
      const isRelevant = isAdmin 
        ? (data.from === identifier || data.to === identifier)
        : (data.from === 'admin' || data.from === user?.username);

      if (isRelevant) {
        const newMsg = { 
          sender: data.from === 'admin' ? 'Support' : (data.from === user?.username ? 'You' : data.from), 
          text: data.message, 
          timestamp: Date.now() 
        };
        setMessages(prev => [...prev, newMsg]);
      }
    };

    const handleAdminChatHistory = (data: any) => {
      if (isAdmin && data.username === identifier) {
        setMessages(data.history.map((m: any) => ({
          sender: m.from === 'admin' ? 'You' : m.from,
          text: m.message,
          timestamp: m.timestamp
        })));
      }
    };

    socket.on('chat_message', handleChatMessage);
    socket.on('admin_chat_history', handleAdminChatHistory);
    socket.on('admin_message', handleAdminChatMessage);
    window.addEventListener('scotia_chat_history', handleChatHistory);
    
    if (isAdmin && identifier) {
      socket.emit('admin_request_history', { username: identifier });
    }
    
    return () => { 
      socket.off('chat_message', handleChatMessage);
      socket.off('admin_chat_history', handleAdminChatHistory);
      socket.off('admin_message', handleAdminChatMessage);
      window.removeEventListener('scotia_chat_history', handleChatHistory);
    };
  }, [socket, isOpen, isAdmin, targetSocketId, identifier, user?.username, activeUsers]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim() || !socket) return;
    
    if (isAdmin && identifier) {
      // Send to server to handle both online and offline delivery
      socket.emit('admin_command', { 
        targetSocketId, 
        targetUsername: identifier,
        command: 'chat_message', 
        payload: { message: input } 
      });
      // messages will be updated via 'admin_message' listener
    } else if (!isAdmin) {
      socket.emit('chat_message', { from: user?.username || 'Guest', message: input });
      setMessages(prev => [...prev, { sender: 'You', text: input, timestamp: Date.now() }]);
    }
    setInput('');
  };

  if (!isOpen && !isAdmin) return null;

  const title = isAdmin ? `Inbound Channel: ${identifier || 'N/A'}` : 'Global Support Relay';

  return (
    <div className={`fixed inset-0 bg-[#0A0A0A] z-[2000] flex flex-col ${isAdmin ? 'relative h-full inset-auto bg-transparent' : ''}`}>
      <div className={`p-4 flex items-center justify-between shrink-0 border-b border-white/5 ${isAdmin ? 'bg-[#1A1A1A]' : 'bg-[#ED0711] pt-12'}`}>
        {!isAdmin && (
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors mr-2">
            <X size={20} />
          </button>
        )}
        <div className="flex-1">
          <h3 className={`font-bold uppercase tracking-widest ${isAdmin ? 'text-[10px] text-zinc-400' : 'text-sm text-white'}`}>{title}</h3>
          <p className={`text-[9px] uppercase font-bold tracking-tighter ${isAdmin ? 'text-emerald-500' : 'text-white/60'}`}>
            {isAdmin ? 'SECURE_UPLINK_ESTABLISHED' : 'Encryption Active'}
          </p>
        </div>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#0A0A0A] scrollbar-hide">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full opacity-20 py-8">
            <MessageSquare size={48} className="text-zinc-500 mb-4" />
            <p className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">No message activity detected</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex flex-col ${msg.sender === 'You' ? 'items-end' : 'items-start'}`}>
            <div className={`flex items-center gap-2 mb-1 ${msg.sender === 'You' ? 'flex-row-reverse' : ''}`}>
              <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-tighter">{msg.sender}</span>
              <span className="text-[8px] text-zinc-800 font-mono">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
            <div className={`max-w-[85%] p-3 text-[13px] leading-relaxed shadow-sm ${
              msg.sender === 'You' 
                ? 'bg-red-600 text-white rounded-2xl rounded-tr-none' 
                : 'bg-zinc-900 text-zinc-300 rounded-2xl rounded-tl-none border border-white/5'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className={`p-4 bg-[#1A1A1A] border-t border-white/5 flex gap-2 items-center ${!isAdmin ? 'pb-8' : ''}`}>
        <input 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          className="flex-1 p-3 bg-[#0A0A0A] border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-red-500/50 transition-all placeholder-zinc-700"
          placeholder="Transmit message..."
        />
        <button 
          onClick={sendMessage} 
          disabled={!input.trim()}
          className="p-3 bg-red-600 text-white rounded-xl disabled:opacity-30 disabled:grayscale transition-all active:scale-95 shadow-lg shadow-red-600/20"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};
