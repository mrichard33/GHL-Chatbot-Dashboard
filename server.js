const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.text({ type: 'text/html', limit: '5mb' }));
app.use(express.json());

const DASHBOARD_FILE = path.join(__dirname, 'dashboard.html');
const UPDATE_SECRET = process.env.UPDATE_SECRET || 'your-secret-key-here';

// Serve the dashboard
app.get('/', (req, res) => {
  if (fs.existsSync(DASHBOARD_FILE)) {
    res.setHeader('Content-Type', 'text/html');
    res.sendFile(DASHBOARD_FILE);
  } else {
    res.send('<h1>Dashboard not yet generated</h1><p>Waiting for first data update...</p>');
  }
});

// Update endpoint for n8n
app.post('/update', (req, res) => {
  const authHeader = req.headers['authorization'];
  
  if (authHeader !== `Bearer ${UPDATE_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const htmlContent = req.body;
    fs.writeFileSync(DASHBOARD_FILE, htmlContent);
    res.json({ success: true, message: 'Dashboard updated', timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Dashboard server running on port ${PORT}`);
});