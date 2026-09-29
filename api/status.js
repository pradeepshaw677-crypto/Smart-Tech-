export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({
    status: 'online',
    app: 'Smart Tech Computer Education',
    platform: 'Vercel Serverless',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
}
