const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.text({ type: 'text/html', limit: '5mb' }));

const DASHBOARD_FILE = path.join(__dirname, 'dashboard.html');
const UPDATE_SECRET = process.env.UPDATE_SECRET || 'reece-dash-2026';

app.get('/', (req, res) => {
  if (fs.existsSync(DASHBOARD_FILE)) {
    res.setHeader('Content-Type', 'text/html');
    res.sendFile(DASHBOARD_FILE);
  } else {
    res.setHeader('Content-Type', 'text/html');
    res.send('<html><body><h1>Waiting for data...</h1></body></html>');
  }
});

app.post('/update', (req, res) => {
  const auth = req.headers['authorization'];
  if (auth !== `Bearer ${UPDATE_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    fs.writeFileSync(DASHBOARD_FILE, req.body);
    res.json({ success: true, timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
