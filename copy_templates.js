import fs from 'fs';
import path from 'path';

const srcDir = path.join(process.cwd(), 'remote_server', 'templates');
const destDir = path.join(process.cwd(), 'server', 'templates');

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

fs.readdirSync(srcDir).forEach(file => {
  if (file.endsWith('.html')) {
    fs.copyFileSync(path.join(srcDir, file), path.join(destDir, file));
  }
});
