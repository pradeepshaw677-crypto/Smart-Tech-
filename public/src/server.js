import express from 'express';
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
      const pageHtml = `${req.params.page}.html`;
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
