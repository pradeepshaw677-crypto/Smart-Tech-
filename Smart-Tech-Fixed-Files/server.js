import express from 'express';
import compression from 'compression';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Disable X-Powered-By header to prevent information disclosure
app.disable('x-powered-by');

// High-speed gzip / deflate compression
app.use(compression());

// Parse JSON bodies with safe payload limits
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Security & High-Performance Headers middleware (tuned for 60 requests/sec concurrency)
const requestCounts = new Map();
const RATE_LIMIT_WINDOW_MS = 1000; // 1 second sliding window
const MAX_REQUESTS_PER_SECOND = 60; // 60 requests per second limit

// Cleanup stale rate limit records every 10 seconds
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of requestCounts.entries()) {
    if (now - data.timestamp > 5000) {
      requestCounts.delete(ip);
    }
  }
}, 10000);

app.use((req, res, next) => {
  // High-concurrency Keep-Alive headers
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Keep-Alive', 'timeout=65, max=1000');
  
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Content-Security-Policy', "default-src 'self' https: data: blob: 'unsafe-inline' 'unsafe-eval'; frame-src 'self' https://pradeep-ai-png.github.io https://www.ncaskill.com https://www.youtube.com https://www.youtube-nocookie.com; connect-src 'self' https: data: blob:; img-src 'self' https: data: blob:; font-src 'self' https: data:;");

  // Rate Limiter: Up to 60 requests per second per IP
  const clientIp = req.headers['x-forwarded-for']?.toString().split(',')[0].trim() || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  
  let clientData = requestCounts.get(clientIp);
  if (!clientData || now - clientData.timestamp >= RATE_LIMIT_WINDOW_MS) {
    clientData = { timestamp: now, count: 1 };
    requestCounts.set(clientIp, clientData);
  } else {
    clientData.count++;
  }

  // Set rate-limit info headers
  res.setHeader('X-RateLimit-Limit', MAX_REQUESTS_PER_SECOND);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, MAX_REQUESTS_PER_SECOND - clientData.count));

  if (clientData.count > MAX_REQUESTS_PER_SECOND) {
    return res.status(429).json({
      error: 'Too Many Requests',
      message: 'Rate limit of 60 requests/second exceeded. Please wait a second and retry.'
    });
  }
  
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

const publicDir = path.join(__dirname, 'public');

// Explicit favicon and logo routes
app.get('/favicon.ico', (req, res) => {
  const f1 = path.join(__dirname, 'favicon.ico');
  if (fs.existsSync(f1)) return res.sendFile(f1);
  const f2 = path.join(publicDir, 'favicon.ico');
  if (fs.existsSync(f2)) return res.sendFile(f2);
  const f3 = path.join(__dirname, 'logo.png');
  if (fs.existsSync(f3)) return res.sendFile(f3);
  res.status(204).end();
});

app.get('/logo.png', (req, res) => {
  const f1 = path.join(__dirname, 'logo.png');
  if (fs.existsSync(f1)) return res.sendFile(f1);
  const f2 = path.join(publicDir, 'logo.png');
  if (fs.existsSync(f2)) return res.sendFile(f2);
  res.status(404).end();
});

// Explicit robots.txt and sitemap.xml routes
app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  const f1 = path.join(publicDir, 'robots.txt');
  if (fs.existsSync(f1)) return res.sendFile(f1);
  const f2 = path.join(__dirname, 'robots.txt');
  if (fs.existsSync(f2)) return res.sendFile(f2);
  res.send("User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: https://thesmarttech.vercel.app/sitemap.xml\n");
});

app.get('/sitemap.xml', (req, res) => {
  res.type('application/xml');
  const f1 = path.join(publicDir, 'sitemap.xml');
  if (fs.existsSync(f1)) return res.sendFile(f1);
  const f2 = path.join(__dirname, 'sitemap.xml');
  if (fs.existsSync(f2)) return res.sendFile(f2);
  res.status(404).end();
});

// Clean URLs handler: /login -> /login.html, /demo -> /demo.html (with path traversal protection)
app.get('/:page', (req, res, next) => {
  if (req.params.page && !req.params.page.includes('.')) {
    const cleanPage = path.basename(req.params.page).replace(/[^a-zA-Z0-9_-]/g, '');
    if (cleanPage) {
      const pageHtml = `${cleanPage}.html`;
      const candidatePublic = path.join(publicDir, pageHtml);
      if (fs.existsSync(candidatePublic)) {
        return res.sendFile(candidatePublic);
      }
      const candidateRoot = path.join(__dirname, pageHtml);
      if (fs.existsSync(candidateRoot)) {
        return res.sendFile(candidateRoot);
      }
    }
  }
  next();
});

// Serve static assets from public/ if exists, and fallback to root
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir, {
    extensions: ['html', 'htm'],
    etag: true,
    lastModified: true,
    maxAge: '1m'
  }));
}
app.use(express.static(__dirname, {
  extensions: ['html', 'htm'],
  etag: true,
  lastModified: true,
  maxAge: '1m'
}));

// Explicit root route
app.get('/', (req, res) => {
  const publicIndex = path.join(publicDir, 'index.html');
  if (fs.existsSync(publicIndex)) {
    return res.sendFile(publicIndex);
  }
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 404 fallback to index.html
app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Endpoint not found' });
  }
  const publicIndex = path.join(publicDir, 'index.html');
  if (fs.existsSync(publicIndex)) {
    return res.status(404).sendFile(publicIndex);
  }
  res.status(404).sendFile(path.join(__dirname, 'index.html'));
});

// Only bind port when not imported as a serverless module (e.g., on Vercel)
if (!process.env.VERCEL) {
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Smart Tech] High-performance server (60 req/s tuned) running at http://0.0.0.0:${PORT}`);
  });
  server.keepAliveTimeout = 65000;
  server.headersTimeout = 66000;
  server.maxRequestsPerSocket = 0; // Unlimited requests per socket
}

export default app;
