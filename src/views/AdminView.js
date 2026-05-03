import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import TopHeader from '../components/TopHeader';
import { Save, RefreshCw } from 'lucide-react';
import DeploymentDashboard from './DeploymentDashboard';
import { SupportChat } from '../components/SupportChat';
const AdminView = ({ onClose }) => {
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [jsonError, setJsonError] = useState(null);
    const [configText, setConfigText] = useState('');
    const [activeTab, setActiveTab] = useState('config');
    const [smtpResult, setSmtpResult] = useState(null);
    const [logs, setLogs] = useState([]);
    const [users, setUsers] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [editingUser, setEditingUser] = useState(null);
    const [newUser, setNewUser] = useState(null);
    const [status, setStatus] = useState(null);
    const showStatus = (type, message) => {
        setStatus({ type, message });
        setTimeout(() => setStatus(null), 3000);
    };
    const getAdminToken = () => new URLSearchParams(window.location.search).get('token') || 'projectsarah';
    const fetchUsers = async () => {
        try {
            const res = await fetch(`/api/admin/users?token=${getAdminToken()}`);
            if (res.ok) {
                const data = await res.json();
                setUsers(data.users || []);
            }
        }
        catch (e) {
            console.error("Failed to load users", e);
        }
    };
    const fetchSessions = async () => {
        try {
            const res = await fetch(`/api/admin/sessions?token=${getAdminToken()}`);
            if (res.ok) {
                const data = await res.json();
                setSessions(data.sessions || []);
            }
        }
        catch (e) {
            console.error("Failed to load sessions", e);
        }
    };
    const fetchLogs = async () => {
        try {
            const res = await fetch(`/api/logs?token=${getAdminToken()}`);
            if (res.ok) {
                setLogs(await res.json());
            }
        }
        catch (e) {
            console.error("Failed to load logs", e);
        }
    };
    const fetchConfig = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/config?token=${getAdminToken()}`);
            if (res.ok) {
                const data = await res.json();
                setConfig(data);
                setConfigText(JSON.stringify(data, null, 2));
            }
        }
        catch (e) {
            console.error("Failed to load config", e);
        }
        finally {
            setLoading(false);
        }
    };
    const testSmtp = async () => {
        setSmtpResult({ loading: true });
        try {
            const res = await fetch(`/api/debug/smtp?token=${getAdminToken()}`);
            const data = await res.json();
            setSmtpResult(data);
        }
        catch (e) {
            const errorMessage = e instanceof Error ? e.message : String(e);
            setSmtpResult({ success: false, error: errorMessage });
        }
    };
    useEffect(() => {
        fetchConfig();
        fetchLogs();
        fetchUsers();
        fetchSessions();
    }, []);
    const handleSave = async () => {
        try {
            const parsed = JSON.parse(configText);
            setJsonError(null);
            setSaving(true);
            const res = await fetch(`/api/config?token=${getAdminToken()}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(parsed)
            });
            if (res.ok) {
                showStatus('success', "Configuration Saved Successfully");
                fetchConfig();
            }
            else {
                showStatus('error', "Failed to save configuration");
            }
        }
        catch (e) {
            const errorMessage = e instanceof Error ? e.message : String(e);
            setJsonError(errorMessage);
        }
        finally {
            setSaving(false);
        }
    };
    const deleteUser = async (username) => {
        if (!window.confirm(`Are you sure you want to delete ${username}?`))
            return;
        try {
            const res = await fetch(`/api/user/delete?token=${getAdminToken()}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username })
            });
            if (res.ok) {
                showStatus('success', "User deleted successfully");
                fetchUsers();
                fetchConfig();
            }
            else {
                showStatus('error', "Failed to delete user");
            }
        }
        catch (e) {
            console.error("Delete user error", e);
            showStatus('error', "Failed to delete user");
        }
    };
    return (_jsxs("div", { className: "absolute inset-0 z-[600] bg-white flex flex-col h-full animate-in slide-up", children: [_jsx(TopHeader, { onBack: onClose, title: "System Config" }), status && (_jsx("div", { className: `fixed top-20 left-1/2 -translate-x-1/2 z-[800] px-6 py-3 rounded-full shadow-2xl font-bold animate-in slide-down ${status.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`, children: status.message })), _jsxs("div", { className: "flex-1 p-6 flex flex-col overflow-hidden", children: [_jsx("div", { className: "flex gap-2 mb-4 overflow-x-auto pb-2", children: ['config', 'users', 'smtp', 'logs', 'deploy', 'sessions'].map((tab) => (_jsx("button", { onClick: () => {
                                setActiveTab(tab);
                                if (tab === 'sessions')
                                    fetchSessions();
                            }, className: `px-4 py-2 rounded-lg font-bold capitalize whitespace-nowrap ${activeTab === tab ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`, children: tab }, tab))) }), activeTab === 'users' && (_jsxs("div", { className: "flex-1 flex flex-col overflow-hidden", children: [_jsxs("div", { className: "flex justify-between items-center mb-4", children: [_jsx("h2", { className: "text-xl font-black text-black", children: "User Management" }), _jsx("button", { onClick: () => setNewUser({
                                            username: '',
                                            password: '',
                                            enabled: true,
                                            accounts: {
                                                'Chequing': { balance: 1000, type: 'banking', points: 0, history: [] },
                                                'Savings': { balance: 5000, type: 'banking', points: 0, history: [] }
                                            },
                                            settings: {
                                                transferLimit: 1000,
                                                dailyLimit: 3000,
                                                overdraftLimit: 500,
                                                interacWarningEnabled: true
                                            }
                                        }), className: "px-4 py-2 bg-black text-white rounded-lg font-bold hover:bg-gray-800 transition-colors", children: "+ Add User" })] }), _jsx("div", { className: "flex-1 overflow-auto border border-gray-200 rounded-xl", children: _jsxs("table", { className: "w-full text-left border-collapse", children: [_jsx("thead", { className: "bg-gray-50 sticky top-0", children: _jsxs("tr", { children: [_jsx("th", { className: "p-3 border-b font-bold text-xs uppercase text-gray-500", children: "User" }), _jsx("th", { className: "p-3 border-b font-bold text-xs uppercase text-gray-500", children: "Status" }), _jsx("th", { className: "p-3 border-b font-bold text-xs uppercase text-gray-500", children: "Total Balance" }), _jsx("th", { className: "p-3 border-b font-bold text-xs uppercase text-gray-500", children: "Limits" }), _jsx("th", { className: "p-3 border-b font-bold text-xs uppercase text-gray-500", children: "Actions" })] }) }), _jsx("tbody", { children: users.map((user) => {
                                                const accounts = (user.accounts || {});
                                                const totalBalance = Object.values(accounts).reduce((sum, acc) => sum + (acc.balance || 0), 0);
                                                return (_jsxs("tr", { className: "hover:bg-gray-50", children: [_jsxs("td", { className: "p-3 border-b", children: [_jsx("div", { className: "font-bold text-black", children: user.username }), _jsx("div", { className: "text-xs text-gray-500", children: user.password })] }), _jsx("td", { className: "p-3 border-b", children: _jsx("span", { className: `px-2 py-1 rounded-full text-[10px] font-bold uppercase ${user.enabled !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`, children: user.enabled !== false ? 'Enabled' : 'Disabled' }) }), _jsxs("td", { className: "p-3 border-b font-mono text-sm", children: ["$", totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })] }), _jsxs("td", { className: "p-3 border-b text-xs", children: [_jsxs("div", { children: ["Transfer: $", user.settings?.transferLimit || 0] }), _jsxs("div", { children: ["Daily: $", user.settings?.dailyLimit || 0] })] }), _jsx("td", { className: "p-3 border-b", children: _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { onClick: () => setEditingUser({ ...user }), className: "text-blue-600 font-bold hover:underline", children: "Edit" }), _jsx("button", { onClick: () => deleteUser(user.username), className: "text-red-600 font-bold hover:underline", children: "Delete" })] }) })] }, user.username));
                                            }) })] }) }), (editingUser || newUser) && (_jsx("div", { className: "absolute inset-0 z-[700] bg-black/50 flex items-center justify-center p-4", children: _jsxs("div", { className: "bg-white rounded-2xl w-full max-w-md flex flex-col max-h-[90vh] overflow-hidden shadow-2xl", children: [_jsxs("div", { className: "p-6 border-b flex justify-between items-center", children: [_jsx("h3", { className: "text-xl font-black", children: newUser ? 'Add New User' : 'Edit User' }), _jsx("button", { onClick: () => { setEditingUser(null); setNewUser(null); }, className: "text-gray-400 hover:text-black", children: "\u2715" })] }), _jsxs("div", { className: "p-6 overflow-auto space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-xs font-bold text-gray-500 uppercase mb-1", children: "Username" }), _jsx("input", { type: "text", className: "w-full p-3 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-black", value: editingUser?.username || newUser?.username || '', onChange: (e) => {
                                                                if (newUser)
                                                                    setNewUser({ ...newUser, username: e.target.value });
                                                                else
                                                                    setEditingUser({ ...editingUser, username: e.target.value });
                                                            }, disabled: !!editingUser })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-xs font-bold text-gray-500 uppercase mb-1", children: "Password" }), _jsx("input", { type: "text", className: "w-full p-3 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-black", value: editingUser?.password || newUser?.password || '', onChange: (e) => {
                                                                if (newUser)
                                                                    setNewUser({ ...newUser, password: e.target.value });
                                                                else
                                                                    setEditingUser({ ...editingUser, password: e.target.value });
                                                            } })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("input", { type: "checkbox", id: "user-enabled", checked: (editingUser || newUser)?.enabled !== false, onChange: (e) => {
                                                                if (newUser)
                                                                    setNewUser({ ...newUser, enabled: e.target.checked });
                                                                else
                                                                    setEditingUser({ ...editingUser, enabled: e.target.checked });
                                                            } }), _jsx("label", { htmlFor: "user-enabled", className: "text-sm font-bold", children: "Account Enabled" })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("input", { type: "checkbox", id: "attention-items", checked: (editingUser || newUser)?.settings?.attentionItemsEnabled === true, onChange: (e) => {
                                                                const updated = { ...(editingUser || newUser) };
                                                                if (!updated.settings)
                                                                    updated.settings = {};
                                                                updated.settings.attentionItemsEnabled = e.target.checked;
                                                                if (newUser)
                                                                    setNewUser(updated);
                                                                else
                                                                    setEditingUser(updated);
                                                            } }), _jsx("label", { htmlFor: "attention-items", className: "text-sm font-bold", children: "Attention Items Enabled" })] }), _jsxs("div", { className: "border-t pt-4", children: [_jsx("h4", { className: "font-bold mb-2", children: "Accounts & Balances" }), Object.entries((editingUser || newUser)?.accounts || {}).map(([name, acc]) => {
                                                            const account = acc;
                                                            return (_jsxs("div", { className: "flex items-center gap-2 mb-2", children: [_jsx("div", { className: "flex-1 text-sm", children: name }), _jsx("input", { type: "number", className: "w-32 p-2 bg-gray-100 rounded-lg text-right font-mono", value: account.balance, onChange: (e) => {
                                                                            const val = parseFloat(e.target.value) || 0;
                                                                            const updated = { ...(editingUser || newUser) };
                                                                            updated.accounts[name].balance = val;
                                                                            if (newUser)
                                                                                setNewUser(updated);
                                                                            else
                                                                                setEditingUser(updated);
                                                                        } })] }, name));
                                                        })] }), _jsxs("div", { className: "border-t pt-4 space-y-3", children: [_jsx("h4", { className: "font-bold mb-2", children: "Limits" }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("label", { className: "text-sm", children: "Transfer Limit ($)" }), _jsx("input", { type: "number", className: "w-32 p-2 bg-gray-100 rounded-lg text-right font-mono", value: (editingUser || newUser)?.settings?.transferLimit || 0, onChange: (e) => {
                                                                        const val = parseInt(e.target.value) || 0;
                                                                        const updated = { ...(editingUser || newUser) };
                                                                        updated.settings.transferLimit = val;
                                                                        if (newUser)
                                                                            setNewUser(updated);
                                                                        else
                                                                            setEditingUser(updated);
                                                                    } })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("label", { className: "text-sm", children: "Daily e-Transfer Limit ($)" }), _jsx("input", { type: "number", className: "w-32 p-2 bg-gray-100 rounded-lg text-right font-mono", value: (editingUser || newUser)?.settings?.dailyLimit || 0, onChange: (e) => {
                                                                        const val = parseInt(e.target.value) || 0;
                                                                        const updated = { ...(editingUser || newUser) };
                                                                        updated.settings.dailyLimit = val;
                                                                        if (newUser)
                                                                            setNewUser(updated);
                                                                        else
                                                                            setEditingUser(updated);
                                                                    } })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("label", { className: "text-sm", children: "Overdraft Limit ($)" }), _jsx("input", { type: "number", className: "w-32 p-2 bg-gray-100 rounded-lg text-right font-mono", value: (editingUser || newUser)?.settings?.overdraftLimit || 0, onChange: (e) => {
                                                                        const val = parseInt(e.target.value) || 0;
                                                                        const updated = { ...(editingUser || newUser) };
                                                                        updated.settings.overdraftLimit = val;
                                                                        if (newUser)
                                                                            setNewUser(updated);
                                                                        else
                                                                            setEditingUser(updated);
                                                                    } })] })] })] }), _jsxs("div", { className: "p-6 border-t flex gap-3", children: [_jsx("button", { onClick: () => { setEditingUser(null); setNewUser(null); }, className: "flex-1 py-3 bg-gray-100 rounded-xl font-bold hover:bg-gray-200 transition-colors", children: "Cancel" }), _jsx("button", { onClick: async () => {
                                                        const userToSave = editingUser || newUser;
                                                        const res = await fetch(`/api/user/update?token=${getAdminToken()}`, {
                                                            method: 'POST',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({ username: userToSave.username, data: userToSave })
                                                        });
                                                        if (res.ok) {
                                                            showStatus('success', "User saved successfully");
                                                            setEditingUser(null);
                                                            setNewUser(null);
                                                            fetchUsers();
                                                            fetchConfig();
                                                        }
                                                        else {
                                                            showStatus('error', "Failed to save user");
                                                        }
                                                    }, className: "flex-1 py-3 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-colors", children: "Save User" })] })] }) }))] })), activeTab === 'sessions' && (_jsxs("div", { className: "flex-1 overflow-auto border border-gray-200 rounded-xl", children: [_jsxs("table", { className: "w-full text-left border-collapse", children: [_jsx("thead", { className: "bg-gray-50 sticky top-0", children: _jsxs("tr", { children: [_jsx("th", { className: "p-3 border-b font-bold text-xs uppercase text-gray-500", children: "User" }), _jsx("th", { className: "p-3 border-b font-bold text-xs uppercase text-gray-500", children: "IP" }), _jsx("th", { className: "p-3 border-b font-bold text-xs uppercase text-gray-500", children: "Path" }), _jsx("th", { className: "p-3 border-b font-bold text-xs uppercase text-gray-500", children: "Last Seen" })] }) }), _jsx("tbody", { children: sessions.map((session) => (_jsxs("tr", { className: "hover:bg-gray-50", children: [_jsx("td", { className: "p-3 border-b font-bold text-black", children: session.username }), _jsx("td", { className: "p-3 border-b font-mono text-sm", children: session.ip }), _jsx("td", { className: "p-3 border-b text-sm", children: session.currentPath }), _jsx("td", { className: "p-3 border-b text-sm", children: new Date(session.lastSeen).toLocaleTimeString() }), _jsx("td", { className: "p-3 border-b", children: _jsx("button", { onClick: () => setSelectedChat(session.id), className: "text-blue-600 font-bold hover:underline", children: "Chat" }) })] }, session.id))) })] }), selectedChat && (_jsx(SupportChat, { isAdmin: true, targetSocketId: selectedChat }))] })), activeTab === 'config' && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "flex justify-between items-center mb-4", children: [_jsx("h2", { className: "text-xl font-black text-black", children: "Server Configuration" }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { onClick: () => {
                                                    const url = `${window.location.origin}${window.location.pathname}?token=${getAdminToken()}`;
                                                    navigator.clipboard.writeText(url);
                                                    showStatus('success', "Admin link copied to clipboard");
                                                }, className: "px-4 py-2 bg-gray-100 rounded-lg font-bold hover:bg-gray-200 transition-colors text-sm", children: "Copy Admin Link" }), _jsx("button", { onClick: fetchConfig, className: "p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors", children: _jsx(RefreshCw, { size: 20, className: loading ? "animate-spin" : "" }) }), _jsxs("button", { onClick: handleSave, disabled: saving || !!jsonError, className: "flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg font-bold hover:bg-gray-800 transition-colors disabled:opacity-50", children: [_jsx(Save, { size: 18 }), saving ? 'Saving...' : 'Save Config'] })] })] }), jsonError && (_jsxs("div", { className: "mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm font-mono", children: ["JSON Error: ", jsonError] })), _jsx("div", { className: "flex-1 relative border border-zinc-300 rounded-xl overflow-hidden shadow-inner", children: _jsx("textarea", { className: "w-full h-full p-4 font-mono text-sm bg-zinc-50 text-zinc-800 resize-none focus:outline-none", value: configText, onChange: (e) => {
                                        setConfigText(e.target.value);
                                        try {
                                            JSON.parse(e.target.value);
                                            setJsonError(null);
                                        }
                                        catch (err) {
                                            const errorMessage = err instanceof Error ? err.message : String(err);
                                            setJsonError(errorMessage);
                                        }
                                    }, spellCheck: false }) })] })), activeTab === 'smtp' && (_jsxs("div", { className: "flex flex-col gap-4", children: [_jsx("button", { onClick: testSmtp, className: "px-4 py-2 bg-black text-white rounded-lg font-bold hover:bg-gray-800 transition-colors", children: "Test SMTP Connection" }), smtpResult && (_jsx("div", { className: `p-4 rounded-lg ${smtpResult.loading ? 'bg-gray-100' : smtpResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`, children: smtpResult.loading ? 'Testing...' : smtpResult.success ? smtpResult.message : smtpResult.error }))] })), activeTab === 'logs' && (_jsx("div", { className: "flex-1 overflow-auto bg-gray-50 text-gray-800 p-4 rounded-xl font-mono text-xs border border-gray-200", children: logs.map((log, i) => (_jsxs("div", { className: "mb-1", children: [_jsxs("span", { className: "text-gray-400", children: ["[", log.timestamp, "]"] }), " ", _jsx("span", { className: "text-[#ED0711] font-bold", children: log.username }), " - ", _jsx("span", { className: "text-gray-900", children: log.action }), log.details && _jsx("pre", { className: "text-gray-500 ml-4 mt-1 bg-white p-2 rounded border border-gray-100", children: JSON.stringify(log.details, null, 2) })] }, i))) })), activeTab === 'deploy' && (_jsx("div", { className: "flex-1 -mx-6 -mb-6 overflow-hidden", children: _jsx(DeploymentDashboard, {}) })), _jsx("p", { className: "mt-4 text-xs text-zinc-500", children: activeTab === 'config' && 'Edit the raw JSON configuration for the server. Changes are applied immediately upon save. Ensure valid JSON syntax.' })] })] }));
};
export default AdminView;
