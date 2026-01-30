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
    res.send('<h1>Waiting for data...</h1>');
  }
});

app.post('/update', (req, res) => {
  const auth = req.headers['authorization'];
  if (auth !== `Bearer ${UPDATE_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  fs.writeFileSync(DASHBOARD_FILE, req.body);
  res.json({ success: true });
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`Running on ${PORT}`));
```

---

## UPLOAD NODE (same as before)
```
Method: POST
URL: https://ghl-chatbot-dashboard-production.up.railway.app/update

Headers:
  Content-Type: text/html
  Authorization: Bearer reece-dash-2026

Body Type: Raw
Body: {{ $json.html_content }}
