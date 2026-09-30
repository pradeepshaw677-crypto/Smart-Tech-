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

// Ensure entrypoint files exist in public/ and src/ for Vercel deployment detection
const entrypointContent = "import app from '../server.js';\nexport default app;\n";
const entryFiles = ['index.js', 'app.js', 'server.js'];

const publicSrcDir = path.join(publicDir, 'src');
if (!fs.existsSync(publicSrcDir)) {
  fs.mkdirSync(publicSrcDir, { recursive: true });
}
for (const ef of entryFiles) {
  fs.writeFileSync(path.join(publicDir, ef), entrypointContent, 'utf8');
  fs.writeFileSync(path.join(publicSrcDir, ef), entrypointContent, 'utf8');
}

const srcDir = path.join(__dirname, 'src');
if (!fs.existsSync(srcDir)) {
  fs.mkdirSync(srcDir, { recursive: true });
}
for (const ef of entryFiles) {
  fs.writeFileSync(path.join(srcDir, ef), entrypointContent, 'utf8');
}

console.log(`[Smart Tech Build] Success! Prepared ${copied} static assets and server entrypoints in public/ and src/.`);
