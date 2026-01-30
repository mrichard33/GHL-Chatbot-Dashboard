const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();

// Parse text/html body
app.use(express.text({ type: 'text/html', limit: '5mb' }));

const DASHBOARD_FILE = path.join(__dirname, 'dashboard.html');
const UPDATE_SECRET = process.env.UPDATE_SECRET || 'reece-dash-2026';

// Health check - Railway hits this
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', time: new Date().toISOString() });
});

// Root - serve dashboard
app.get('/', (req, res) => {
  try {
    if (fs.existsSync(DASHBOARD_FILE)) {
      res.setHeader('Content-Type', 'text/html');
      res.sendFile(DASHBOARD_FILE);
    } else {
      res.setHeader('Content-Type', 'text/html');
      res.send('<html><body style="font-family:sans-serif;padding:40px;"><h1>Dashboard Ready</h1><p>Waiting for first data update from n8n...</p></body></html>');
    }
  } catch (err) {
    res.status(500).send('Error: ' + err.message);
  }
});

// Update endpoint for n8n
app.post('/update', (req, res) => {
  const authHeader = req.headers['authorization'];
  
  if (authHeader !== `Bearer ${UPDATE_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    fs.writeFileSync(DASHBOARD_FILE, req.body);
    res.json({ success: true, timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Keep process alive
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});

// Keep alive ping
setInterval(() => {
  console.log('Keep alive ping:', new Date().toISOString());
}, 60000);
