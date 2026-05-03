import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { ArrowLeft, MessageSquare, Plus, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';
import { useSocket } from '../shared/SocketContext';
import { SupportChat } from '../components/SupportChat';
const AdminSettingsView = ({ onBack }) => {
    const { activeUsers, sendCommand } = useSocket();
    const [users, setUsers] = useState([]);
    const [activeTab, setActiveTab] = useState('users');
    const [editingUser, setEditingUser] = useState(null);
    const [notice, setNotice] = useState('');
    const [selectedChatUser, setSelectedChatUser] = useState(null);
    useEffect(() => {
        fetchUsers();
    }, []);
    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/admin/users.php?token=projectsarah');
            if (res.ok) {
                const data = await res.json();
                setUsers(data.users || []);
            }
        }
        catch (error) {
            console.error('Failed to fetch users:', error);
        }
    };
    const sendNotice = (targetId) => {
        sendCommand(targetId, 'notice', { message: notice });
        setNotice('');
    };
    const initiateCall = (targetId) => {
        sendCommand(targetId, 'initiate_call', {});
    };
    return (_jsxs(motion.div, { initial: { x: '100%' }, animate: { x: 0 }, exit: { x: '100%' }, className: "absolute inset-0 z-[300] flex flex-col bg-[#F8F9FA] text-[#1A1A1A]", children: [_jsxs("div", { className: "pt-12 pb-4 px-4 flex items-center border-b bg-white border-gray-100", children: [_jsx("button", { onClick: onBack, className: "p-2 -ml-2", children: _jsx(ArrowLeft, { size: 24, className: "text-gray-600" }) }), _jsx("h1", { className: "text-[13px] font-bold text-gray-900 ml-4", children: "Admin C2 Panel" })] }), _jsxs("div", { className: "flex border-b border-gray-200 bg-white", children: [_jsx("button", { onClick: () => setActiveTab('users'), className: `flex-1 py-3 text-[10px] font-bold ${activeTab === 'users' ? 'text-red-600 border-b-2 border-red-600' : 'text-gray-500'}`, children: "USER MANAGEMENT" }), _jsx("button", { onClick: () => setActiveTab('chat'), className: `flex-1 py-3 text-[10px] font-bold ${activeTab === 'chat' ? 'text-red-600 border-b-2 border-red-600' : 'text-gray-500'}`, children: "LIVE SUPPORT" })] }), _jsxs("div", { className: "flex-1 overflow-y-auto p-4", children: [activeTab === 'users' && (_jsxs("div", { className: "space-y-4", children: [_jsxs("button", { className: "w-full bg-red-600 text-white py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2", children: [_jsx(Plus, { size: 16 }), " ADD NEW USER"] }), users.map((u) => {
                                const activeUser = Object.values(activeUsers).find((au) => au.username === u.username);
                                return (_jsxs("div", { className: "bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "font-bold text-xs", children: u.username }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { onClick: () => setEditingUser(u), className: "text-gray-400 hover:text-red-600", children: _jsx(RefreshCw, { size: 16 }) }), activeUser && (_jsx("button", { onClick: () => initiateCall(activeUser.id), className: "text-gray-400 hover:text-green-600", children: _jsx(MessageSquare, { size: 16 }) }))] })] }), activeUser && (_jsxs("div", { className: "flex gap-2", children: [_jsx("input", { value: notice, onChange: (e) => setNotice(e.target.value), placeholder: "Notice...", className: "flex-1 text-[10px] border rounded px-2" }), _jsx("button", { onClick: () => sendNotice(activeUser.id), className: "bg-blue-600 text-white px-2 py-1 rounded text-[10px]", children: "SEND" })] })), editingUser?.username === u.username && (_jsxs("div", { className: "border-t pt-2 space-y-2", children: [_jsx("input", { placeholder: "New Account Name", className: "w-full text-[10px] border rounded p-1" }), _jsx("input", { placeholder: "Add Usage", className: "w-full text-[10px] border rounded p-1" }), _jsx("button", { onClick: () => setEditingUser(null), className: "w-full bg-gray-200 py-1 rounded text-[10px]", children: "SAVE" })] }))] }, u.username));
                            })] })), activeTab === 'chat' && (_jsxs("div", { className: "flex flex-col h-full bg-white rounded-xl overflow-hidden border border-gray-200", children: [_jsx("div", { className: "p-2 border-b bg-gray-50", children: _jsxs("select", { value: selectedChatUser || '', onChange: (e) => setSelectedChatUser(e.target.value), className: "w-full text-[10px] border rounded p-1", children: [_jsx("option", { value: "", children: "Select User to Chat" }), Object.values(activeUsers).map((u) => (_jsxs("option", { value: u.id, children: [u.username, " (", u.id.slice(0, 4), ")"] }, u.id)))] }) }), _jsx("div", { className: "flex-1 relative", children: selectedChatUser ? (_jsx(SupportChat, { isAdmin: true, targetSocketId: selectedChatUser, isOpen: true })) : (_jsx("div", { className: "flex items-center justify-center h-full text-gray-400 text-xs", children: "Select a user to start chatting" })) })] }))] })] }));
};
export default AdminSettingsView;
