# Remote PHP Server for E-Transfer Mailer

This folder contains the PHP files needed to host the remote email dispatcher and landing page on your own domain (e.g. TryCloudflare, Render PHP app, or any cPanel hosting).

## Folder Structure

```
remote_server/
├── api/
│   └── mailer.php        # Receives POST requests from your Node.js backend and sends PHP mails.
├── templates/
│   └── Transfer.html     # The HTML email template.
└── deposit.php           # The landing action URL where users land after clicking the link in the email.
```

## How to use:

1. Upload all the contents of the `remote_server` folder to your public webroot via FTP/cPanel or deploy via Render/Cloudflare.
2. Ensure your domain points to the root of these files (so `deposit.php` is accessible at `https://your-domain.com/deposit.php`).
3. In the Admin Panel, navigate to **Settings -> Core**.
4. Update **Base Action URL** to your domain (e.g., `https://your-domain.com`).
5. Save settings!

When the Node.js application attempts to dispatch an email via the **Manual Dispatch** "Email Dispatcher" tool, it will send a POST request with the payment details directly to `https://your-domain.com/api/mailer.php`, which will handle sending the email from your hosting's real IP address and generate an encrypted action URL to the `deposit.php` page.
