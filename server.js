import express from 'express';
import compression from 'compression';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// High-speed gzip / deflate compression
app.use(compression());

// Parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Security & Performance Headers middleware
app.use((req, res, next) => {
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Cache headers for static assets: allow fast live updates (no long 1-year freeze)
  if (req.url.match(/\.(css|js|woff|woff2|ttf)$/)) {
    res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
  } else if (req.url.match(/\.(png|jpg|jpeg|gif|ico|svg|webp)$/)) {
    // Media and logos: fresh revalidation so updates reflect immediately
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=60, stale-while-revalidate=120');
  } else if (req.url.endsWith('.html') || req.url === '/' || !req.url.includes('.')) {
    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
  }
  
  next();
});

// API Routes
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    app: 'Smart Tech Computer Education',
    platform: process.env.VERCEL ? 'Vercel Serverless' : 'Node.js Express',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ ok: true, timestamp: Date.now() });
});

// Clean URLs handler: /login -> /login.html, /demo -> /demo.html
app.get('/:page', (req, res, next) => {
  if (req.params.page && !req.params.page.includes('.')) {
    const candidateFile = path.join(__dirname, `${req.params.page}.html`);
    if (fs.existsSync(candidateFile)) {
      return res.sendFile(candidateFile);
    }
  }
  next();
});

// Serve static assets from root directory
app.use(express.static(__dirname, {
  extensions: ['html', 'htm'],
  etag: true,
  lastModified: true,
  maxAge: '1m'
}));

// Explicit root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 404 fallback to index.html
app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Endpoint not found' });
  }
  res.status(404).sendFile(path.join(__dirname, 'index.html'));
});

// Only bind port when not imported as a serverless module (e.g., on Vercel)
if (!process.env.VERCEL) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Smart Tech] Secure server running at http://0.0.0.0:${PORT}`);
  });
}

export default app;
