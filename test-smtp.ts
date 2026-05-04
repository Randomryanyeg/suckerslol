import nodemailer from 'nodemailer';
const t = nodemailer.createTransport({host: 'smtp.office365.com', port: 587, tls: { rejectUnauthorized: false }});
console.log('Sending...');
t.verify().then(() => console.log('OK')).catch(console.error);
