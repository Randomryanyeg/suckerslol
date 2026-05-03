import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from 'fs';
import http from 'http';
import nodemailer from 'nodemailer';
import { GlobalSettings } from './src/types/settings';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const settingsPath = path.join(process.cwd(), 'server', 'data', 'global_settings.json');

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
        adminPin: "1234"
    },
    smtp: { host: "", port: 587, secure: false, user: "", pass: "", senderName: "Shadow Mailer" },
    telegram: { token: "", chat_id: "", enabled: false }
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

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  
  app.use(express.json());

  // AUTH API
  app.post("/api/auth/login", (req, res) => {
      console.log("Login attempt (raw body):", JSON.stringify(req.body));
      const { username, password } = req.body;
      const settings = getSettings();
      console.log(`Parsed creds: user=${username}, pass=${password}`);
      console.log("Expected creds:", settings.general.admin_username, settings.general.admin_password);
      
      if (username === settings.general.admin_username && password === settings.general.admin_password) {
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
          res.json({ success: false, message: 'Invalid credentials' });
      }
  });

  // ADMIN API
  app.get("/api/admin/global-settings", (req, res) => {
    res.json(getSettings());
  });

  app.post("/api/admin/global-settings", (req, res) => {
    try {
      const updated = { ...getSettings(), ...req.body };
      if (!fs.existsSync(path.dirname(settingsPath))) {
          fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
      }
      fs.writeFileSync(settingsPath, JSON.stringify(updated, null, 2));
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.post("/api/user/update", (req, res) => {
    // In a real app we'd save to DB. For simulation, we'll just return success.
    console.log("User update received:", JSON.stringify(req.body).substring(0, 500));
    res.json({ success: true });
  });

  app.post("/api/mailer", async (req, res) => {
    try {
        const { recipient_email, recipient_name, amount, purpose, template, sender_name, reference_number, date } = req.body;
        console.log(`Sending email to ${recipient_email} (${recipient_name}) for $${amount}`);
        // For simulation, we log success. If SMTP is configured, we could try sending.
        // await sendEmail(recipient_email, purpose || "Interac e-Transfer", `Hi ${recipient_name}, you received $${amount}`, `<h1>Hi ${recipient_name}</h1><p>You received $${amount}</p>`);
        res.json({ success: true });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
  });

  const sendEmail = async (to: string, subject: string, text: string, html: string) => {
      const settings = getSettings();
      const transporter = nodemailer.createTransport({
          host: settings.smtp.host,
          port: settings.smtp.port,
          secure: settings.smtp.secure,
          auth: {
              user: settings.smtp.user,
              pass: settings.smtp.pass
          }
      });
  
      await transporter.sendMail({
          from: `"${settings.smtp.senderName}" <${settings.smtp.user}>`,
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
