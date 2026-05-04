import crypto from 'crypto';
const pass = "ENC:00000000000000000000000000000000:b23a659b0dab58376385fcd34840185a";
const parts = pass.substring(4).split(':');
const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from("ShadowCoreEncryptionKey123456789"), Buffer.from(parts[0], 'hex'));
let decrypted = decipher.update(Buffer.from(parts[1], 'hex'));
decrypted = Buffer.concat([decrypted, decipher.final()]);
console.log("PASS:", decrypted.toString());
