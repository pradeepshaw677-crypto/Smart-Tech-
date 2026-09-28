import express from 'express';
import compression from 'compression';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// High-speed gzip / deflate compression
app.use(compression());

// Security & Performance Headers middleware
app.use((req, res, next) => {
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Cache headers for static assets
  if (req.url.match(/\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf)$/)) {
    res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=3600');
  } else if (req.url.endsWith('.html') || req.url === '/' || !req.url.includes('.')) {
    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
  }
  
  next();
});

// Serve static assets from root directory
app.use(express.static(__dirname, {
  etag: true,
  lastModified: true,
  maxAge: '1d'
}));

// Explicit root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Clean URLs fallback (e.g., /login -> /login.html)
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.includes('.')) {
    const cleanPath = req.path.replace(/^\//, '');
    const htmlFilePath = path.join(__dirname, `${cleanPath}.html`);
    res.sendFile(htmlFilePath, (err) => {
      if (err) {
        next();
      }
    });
  } else {
    next();
  }
});

// 404 fallback to index.html
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Smart Tech] Secure server running at http://0.0.0.0:${PORT}`);
});
