import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, 'public');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Copy static assets to public/ directory
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

// Universal entrypoint code that works whether executed from root, public/, or isolated Vercel container
const standaloneEntryContent = `import express from 'express';
import compression from 'compression';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let app;

try {
  // If parent server.js is available
  const candidateParent = path.resolve(__dirname, '..', 'server.js');
  const candidateParent2 = path.resolve(__dirname, '..', '..', 'server.js');
  if (fs.existsSync(candidateParent)) {
    const mod = await import('file://' + candidateParent);
    app = mod.default || mod;
  } else if (fs.existsSync(candidateParent2)) {
    const mod = await import('file://' + candidateParent2);
    app = mod.default || mod;
  }
} catch (e) {
  // Fallback to local express server
}

if (!app) {
  app = express();
  app.use(compression());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Static files
  app.use(express.static(__dirname, { extensions: ['html', 'htm'] }));
  const parentDir = path.resolve(__dirname, '..');
  if (fs.existsSync(parentDir)) {
    app.use(express.static(parentDir, { extensions: ['html', 'htm'] }));
  }

  // Clean URLs
  app.get('/:page', (req, res, next) => {
    if (req.params.page && !req.params.page.includes('.')) {
      const pageHtml = \`\${req.params.page}.html\`;
      const f1 = path.join(__dirname, pageHtml);
      if (fs.existsSync(f1)) return res.sendFile(f1);
      const f2 = path.join(parentDir, pageHtml);
      if (fs.existsSync(f2)) return res.sendFile(f2);
    }
    next();
  });

  app.get('/', (req, res) => {
    const f1 = path.join(__dirname, 'index.html');
    if (fs.existsSync(f1)) return res.sendFile(f1);
    const f2 = path.join(parentDir, 'index.html');
    if (fs.existsSync(f2)) return res.sendFile(f2);
    res.send('Smart Tech Computer Education');
  });
}

export default app;
`;

const entryFiles = ['index.js', 'app.js', 'server.js'];

// Ensure public/ has entrypoint files
for (const ef of entryFiles) {
  fs.writeFileSync(path.join(publicDir, ef), standaloneEntryContent, 'utf8');
}

// Ensure public/src/ has entrypoint files
const publicSrcDir = path.join(publicDir, 'src');
if (!fs.existsSync(publicSrcDir)) {
  fs.mkdirSync(publicSrcDir, { recursive: true });
}
for (const ef of entryFiles) {
  fs.writeFileSync(path.join(publicSrcDir, ef), standaloneEntryContent, 'utf8');
}

// Ensure root src/ has entrypoint files
const srcDir = path.join(__dirname, 'src');
if (!fs.existsSync(srcDir)) {
  fs.mkdirSync(srcDir, { recursive: true });
}
for (const ef of entryFiles) {
  fs.writeFileSync(path.join(srcDir, ef), standaloneEntryContent, 'utf8');
}

// Ensure root index.js and app.js point directly to server.js
const rootEntryContent = `import app from './server.js';\nexport default app;\n`;
fs.writeFileSync(path.join(__dirname, 'index.js'), rootEntryContent, 'utf8');
fs.writeFileSync(path.join(__dirname, 'app.js'), rootEntryContent, 'utf8');

console.log(`[Smart Tech Build] Success! Prepared ${copied} static assets and all server entrypoints in root, public/, and src/.`);
