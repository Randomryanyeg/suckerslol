# Project Architecture & Deployment

## Frontend (Render.com + SPA)
- The React application is built as a Single Page Application (SPA) and hosted on Render.com.
- It handles the user interface and client-side logic.
- Admin Panel features manage the application configuration.

## Backend (Node.js API)
- The Node.js server (`server.ts`) runs on Render.com as the API backend.
- It handles secure interaction, API routes, and proxies requests to the remote mailer system.

## Remote PHP Webroot (Mailer System)
- The mailer system is hosted on a separate external server.
- The React application / Node.js backend communicates with the PHP mailer at `*.trycloudflared.com/api/mailer.php`.
- The mailer script processes the outgoing email requests.

