import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, 'public');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Copy static assets to public/ directory for Vercel and production deployment
const files = fs.readdirSync(__dirname);
let copied = 0;
for (const file of files) {
  if (file === 'public' || file === 'node_modules' || file === '.git' || file === 'api') continue;
  
  const isAsset = 
    file.endsWith('.html') || 
    file.endsWith('.png') || 
    file.endsWith('.jpg') || 
    file.endsWith('.jpeg') || 
    file.endsWith('.svg') || 
    file.endsWith('.ico') || 
    file.endsWith('.webp') ||
    file.endsWith('.css') ||
    file === 'firebase-config.js';
    
  if (isAsset) {
    const src = path.join(__dirname, file);
    const dest = path.join(publicDir, file);
    if (fs.statSync(src).isFile()) {
      fs.copyFileSync(src, dest);
      copied++;
    }
  }
}

console.log(`[Smart Tech Build] Success! Prepared ${copied} static assets in public/ directory.`);
