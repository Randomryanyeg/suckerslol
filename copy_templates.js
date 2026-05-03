import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.join(__dirname, 'public', 'templates');
const destDir = path.join(__dirname, 'remote_server', 'templates');

if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
}

if (fs.existsSync(srcDir)) {
    const files = fs.readdirSync(srcDir);
    files.forEach(file => {
        fs.copyFileSync(path.join(srcDir, file), path.join(destDir, file));
    });
    console.log('Templates copied successfully.');
} else {
    // If there is no templates folder, see if email_template.html exists
    const fallbackTemplate = path.join(__dirname, 'public', 'email_template.html');
    if (fs.existsSync(fallbackTemplate)) {
        fs.copyFileSync(fallbackTemplate, path.join(destDir, 'Transfer.html'));
        console.log('Fallback template copied successfully as Transfer.html.');
    } else {
        console.log('No templates found to copy.');
    }
}
