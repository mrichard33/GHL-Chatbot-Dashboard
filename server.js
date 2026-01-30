const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.text({ type: 'text/html', limit: '5mb' }));

const DATA_FILE = path.join(__dirname, 'dashboard-data.json');
const UPDATE_SECRET = process.env.UPDATE_SECRET || 'reece-dash-2026';

app.post('/update', (req, res) => {
  const auth = req.headers['authorization'];
  if (auth !== `Bearer ${UPDATE_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    let data;
    if (typeof req.body === 'string') {
      data = JSON.parse(req.body);
    } else {
      data = req.body;
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    res.json({ success: true, timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const getData = () => {
  if (fs.existsSync(DATA_FILE)) {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  }
  return null;
};

const baseStyles = `
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{
    font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;
    background:transparent;
    height:100%;
    overflow:hidden;
  }
`;

// ============ HEADER WIDGET ============
app.get('/header', (req, res) => {
  const data = getData();
  if (!data) return res.send('<div style="padding:20px;color:#888;">Waiting for data...</div>');

  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
${baseStyles}
.header{
  background:linear-gradient(135deg,#111827 0%,#1f2937 100%);
  border-radius:max(8px,0.8vw);
  padding:max(8px,1vw) max(12px,1.5vw);
  display:flex;
  justify-content:space-between;
  align-items:center;
  height:100%;
  box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);
}
.header-left{display:flex;align-items:center;gap:max(8px,1vw)}
.icon{
  width:max(32px,3.5vw);
  height:max(32px,3.5vw);
  background:rgba(239,68,68,0.15);
  border-radius:max(6px,0.6vw);
  display:flex;align-items:center;justify-content:center;
  font-size:max(16px,2vw);
}
.header-title{
  font-size:max(16px,2.2vw);
  font-weight:700;
  color:#fff;
  letter-spacing:-0.5px;
}
.header-period{
  font-size:max(10px,1.1vw);
  color:#9ca3af;
  margin-top:max(2px,0.2vw);
  font-weight:500;
}
.badge{
  background:rgba(239,68,68,0.9);
  color:#fff;
  padding:max(4px,0.5vw) max(8px,1vw);
  border-radius:max(12px,1.2vw);
  font-size:max(9px,1vw);
  font-weight:600;
}
</style></head>
<body>
<div class="header">
  <div class="header-left">
    <div class="icon">🤖</div>
    <div>
      <div class="header-title">Chatbot Performance</div>
      <div class="header-period">${data.week_start_date} — ${data.week_end_date}</div>
    </div>
  </div>
  <div class="badge">Updated: ${data.calculated_at}</div>
</div>
</body></html>`;
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

// ============ ABANDON RATE WIDGET ============
app.get('/abandon-rate', (req, res) => {
  const data = getData();
  if (!data) return res.send('<div style="padding:20px;color:#888;">Waiting for data...</div>');

  const rate = parseFloat(data.abandonment_rate) || 0;
  const statusColor = rate <= 20 ? '#10b981' : rate >= 40 ? '#ef4444' : '#f59e0b';
  const statusBg = rate <= 20 ? 'rgba(16,185,129,0.1)' : rate >= 40 ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)';
  const statusText = rate <= 20 ? 'Good' : rate >= 40 ? 'Needs Attention' : 'Monitor';

  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
${baseStyles}
.card{
  background:#fff;
  border-radius:max(8px,0.8vw);
  padding:max(10px,1.2vw) max(12px,1.5vw);
  height:100%;
  display:flex;
  flex-direction:column;
  box-shadow:0 1px 3px rgba(0,0,0,0.05);
  border:1px solid #f3f4f6;
}
.card-header{
  display:flex;
  justify-content:space-between;
  align-items:center;
  flex-shrink:0;
}
.card-title{
  font-size:max(12px,1.4vw);
  font-weight:600;
  color:#6b7280;
}
.status-badge{
  background:${statusBg};
  color:${statusColor};
  font-size:max(9px,1vw);
  font-weight:600;
  padding:max(3px,0.4vw) max(8px,0.9vw);
  border-radius:max(8px,0.8vw);
}
.card-body{
  flex:1;
  display:flex;
  justify-content:center;
  align-items:center;
}
.value{
  font-size:max(48px,8vw);
  font-weight:700;
  color:#111827;
  line-height:1;
  letter-spacing:-2px;
}
.card-footer{
  display:flex;
  align-items:center;
  gap:max(4px,0.5vw);
  flex-shrink:0;
}
.target-label{
  font-size:max(10px,1.1vw);
  color:#9ca3af;
}
.target-value{
  font-size:max(10px,1.1vw);
  color:${statusColor};
  font-weight:600;
}
</style></head>
<body>
<div class="card">
  <div class="card-header">
    <div class="card-title">Live Chat Abandon Rate</div>
    <div class="status-badge">${statusText}</div>
  </div>
  <div class="card-body">
    <div class="value">${data.abandonment_rate}</div>
  </div>
  <div class="card-footer">
    <span class="target-label">Target:</span>
    <span class="target-value">&lt;40%</span>
  </div>
</div>
</body></html>`;
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

// ============ FULL FUNNEL WIDGET ============
app.get('/full-funnel', (req, res) => {
  const data = getData();
  if (!data) return res.send('<div style="padding:20px;color:#888;">Waiting for data...</div>');

  const rate = parseFloat(data.full_funnel_conversion) || 0;
  const statusColor = rate >= 15 ? '#10b981' : rate <= 5 ? '#ef4444' : '#f59e0b';
  const statusBg = rate >= 15 ? 'rgba(16,185,129,0.1)' : rate <= 5 ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)';
  const statusText = rate >= 15 ? 'On Track' : rate <= 5 ? 'Needs Attention' : 'Monitor';

  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
${baseStyles}
.card{
  background:#fff;
  border-radius:max(8px,0.8vw);
  padding:max(10px,1.2vw) max(12px,1.5vw);
  height:100%;
  display:flex;
  flex-direction:column;
  box-shadow:0 1px 3px rgba(0,0,0,0.05);
  border:1px solid #f3f4f6;
}
.card-header{
  display:flex;
  justify-content:space-between;
  align-items:center;
  flex-shrink:0;
}
.card-title{
  font-size:max(12px,1.4vw);
  font-weight:600;
  color:#6b7280;
}
.status-badge{
  background:${statusBg};
  color:${statusColor};
  font-size:max(9px,1vw);
  font-weight:600;
  padding:max(3px,0.4vw) max(8px,0.9vw);
  border-radius:max(8px,0.8vw);
}
.card-body{
  flex:1;
  display:flex;
  justify-content:center;
  align-items:center;
}
.value{
  font-size:max(48px,8vw);
  font-weight:700;
  color:#111827;
  line-height:1;
  letter-spacing:-2px;
}
.card-footer{
  display:flex;
  align-items:center;
  gap:max(4px,0.5vw);
  flex-shrink:0;
}
.target-label{
  font-size:max(10px,1.1vw);
  color:#9ca3af;
}
.target-value{
  font-size:max(10px,1.1vw);
  color:${statusColor};
  font-weight:600;
}
</style></head>
<body>
<div class="card">
  <div class="card-header">
    <div class="card-title">Full Funnel Conversion</div>
    <div class="status-badge">${statusText}</div>
  </div>
  <div class="card-body">
    <div class="value">${data.full_funnel_conversion}</div>
  </div>
  <div class="card-footer">
    <span class="target-label">Target:</span>
    <span class="target-value">&gt;15%</span>
  </div>
</div>
</body></html>`;
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

// ============ INSIGHTS PANEL ============
app.get('/insights', (req, res) => {
  const data = getData();
  if (!data) return res.send('<div style="padding:20px;color:#888;">Waiting for data...</div>');

  const objections = [
    { name: 'Timing', count: data.objection_timing || 0 },
    { name: 'Budget', count: data.objection_budget || 0 },
    { name: 'Price', count: data.objection_price || 0 },
    { name: 'Trust', count: data.objection_trust || 0 },
    { name: 'Competitor', count: data.objection_competitor || 0 },
    { name: 'Complexity', count: data.objection_complexity || 0 }
  ].sort((a, b) => b.count - a.count);

  const maxObjCount = Math.max(...objections.map(o => o.count), 1);

  const objectionRowsHtml = objections.map((obj, idx) => {
    const barWidth = (obj.count / maxObjCount) * 100;
    const isTop = idx === 0 && obj.count > 0;
    return `<div class="obj-row">
      <span class="obj-label" style="${isTop ? 'color:#ef4444;font-weight:600;' : ''}">${obj.name}</span>
      <div class="obj-bar-wrap">
        <div class="obj-bar" style="width:${barWidth}%;${isTop ? 'background:linear-gradient(90deg,#ef4444,#f87171);' : ''}"></div>
      </div>
      <span class="obj-count" style="${isTop ? 'color:#ef4444;' : ''}">${obj.count}</span>
    </div>`;
  }).join('');

  const recsHtml = data.recommendations.map(r => `
    <div class="rec-item">
      <div class="rec-icon">→</div>
      <div class="rec-text">${r}</div>
    </div>
  `).join('');

  const funnelData = [
    { label: 'Engaged → Triggered', rate: data.engagement_to_trigger_rate },
    { label: 'Triggered → Booked', rate: data.trigger_to_booked_rate },
    { label: 'Full Funnel', rate: data.full_funnel_conversion }
  ];

  const funnelRowsHtml = funnelData.map(f => `
    <div class="funnel-row">
      <span class="funnel-label">${f.label}</span>
      <div class="funnel-bar-wrap">
        <div class="funnel-bar" style="width:${parseFloat(f.rate) || 0}%"></div>
      </div>
      <span class="funnel-rate">${f.rate}</span>
    </div>
  `).join('');

  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
${baseStyles}
body{background:#f9fafb}
.container{
  height:100%;
  padding:max(6px,0.8vw);
  display:flex;
  flex-direction:column;
  gap:max(6px,0.8vw);
}
.panels{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:max(6px,0.8vw);
  flex:1;
  min-height:0;
}
.panel{
  background:#fff;
  border-radius:max(8px,0.8vw);
  padding:max(10px,1.2vw) max(12px,1.5vw);
  box-shadow:0 1px 3px rgba(0,0,0,0.05);
  border:1px solid #f3f4f6;
  display:flex;
  flex-direction:column;
}
.panel-header{
  display:flex;
  align-items:center;
  gap:max(6px,0.7vw);
  margin-bottom:max(8px,1vw);
  padding-bottom:max(6px,0.8vw);
  border-bottom:1px solid #f3f4f6;
  flex-shrink:0;
}
.panel-icon{
  width:max(24px,2.5vw);
  height:max(24px,2.5vw);
  border-radius:max(5px,0.5vw);
  display:flex;align-items:center;justify-content:center;
  font-size:max(12px,1.4vw);
}
.panel-icon.funnel{background:rgba(59,130,246,0.1)}
.panel-icon.obj{background:rgba(239,68,68,0.1)}
.panel-title{
  font-size:max(12px,1.4vw);
  font-weight:600;
  color:#111827;
}
.panel-content{
  flex:1;
  display:flex;
  flex-direction:column;
  justify-content:space-around;
  min-height:0;
}
.funnel-row{
  display:flex;
  align-items:center;
  padding:max(6px,0.8vw) 0;
}
.funnel-label{
  width:max(100px,12vw);
  font-size:max(11px,1.3vw);
  color:#6b7280;
  font-weight:500;
}
.funnel-bar-wrap{
  flex:1;
  height:max(6px,0.8vw);
  background:#f3f4f6;
  border-radius:max(3px,0.4vw);
  margin:0 max(8px,1vw);
  overflow:hidden;
}
.funnel-bar{
  height:100%;
  background:linear-gradient(90deg,#3b82f6,#60a5fa);
  border-radius:max(3px,0.4vw);
}
.funnel-rate{
  font-size:max(14px,1.8vw);
  font-weight:700;
  color:#111827;
  min-width:max(45px,5.5vw);
  text-align:right;
}
.obj-row{
  display:flex;
  align-items:center;
  padding:max(4px,0.6vw) 0;
}
.obj-label{
  width:max(60px,7vw);
  font-size:max(11px,1.3vw);
  color:#6b7280;
  font-weight:500;
}
.obj-bar-wrap{
  flex:1;
  height:max(6px,0.8vw);
  background:#f3f4f6;
  border-radius:max(3px,0.4vw);
  margin:0 max(6px,0.8vw);
  overflow:hidden;
}
.obj-bar{
  height:100%;
  background:#d1d5db;
  border-radius:max(3px,0.4vw);
}
.obj-count{
  font-size:max(12px,1.5vw);
  font-weight:600;
  color:#111827;
  min-width:max(20px,2.5vw);
  text-align:right;
}
.recs-panel{
  background:linear-gradient(135deg,#fffbeb 0%,#fef3c7 100%);
  border-radius:max(8px,0.8vw);
  padding:max(8px,1vw) max(12px,1.4vw);
  border-left:max(3px,0.4vw) solid #f59e0b;
  flex-shrink:0;
}
.recs-header{
  display:flex;
  align-items:center;
  gap:max(5px,0.6vw);
  margin-bottom:max(6px,0.8vw);
}
.recs-icon{font-size:max(11px,1.3vw)}
.recs-title{
  font-size:max(10px,1.2vw);
  font-weight:700;
  color:#92400e;
  text-transform:uppercase;
  letter-spacing:0.5px;
}
.rec-item{
  display:flex;
  align-items:flex-start;
  gap:max(6px,0.8vw);
  padding:max(3px,0.4vw) 0;
}
.rec-icon{
  color:#ef4444;
  font-weight:bold;
  font-size:max(11px,1.3vw);
}
.rec-text{
  font-size:max(11px,1.3vw);
  color:#78716c;
  line-height:1.4;
}
</style></head>
<body>
<div class="container">
  <div class="panels">
    <div class="panel">
      <div class="panel-header">
        <div class="panel-icon funnel">📊</div>
        <div class="panel-title">Funnel Breakdown</div>
      </div>
      <div class="panel-content">
        ${funnelRowsHtml}
      </div>
    </div>
    <div class="panel">
      <div class="panel-header">
        <div class="panel-icon obj">🚧</div>
        <div class="panel-title">Objections Breakdown</div>
      </div>
      <div class="panel-content">
        ${objectionRowsHtml}
      </div>
    </div>
  </div>
  <div class="recs-panel">
    <div class="recs-header">
      <span class="recs-icon">⚡</span>
      <span class="recs-title">Recommended Actions</span>
    </div>
    ${recsHtml}
  </div>
</div>
</body></html>`;
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

app.get('/', (req, res) => {
  const data = getData();
  res.send(`<!DOCTYPE html>
<html><head><title>Dashboard API</title></head>
<body style="font-family:sans-serif;padding:40px;background:#f9fafb;">
  <h1>✅ Chatbot Dashboard API</h1>
  <p>Last updated: ${data ? data.calculated_at : 'Never'}</p>
  <h3>Widgets:</h3>
  <ul>
    <li><a href="/header">/header</a></li>
    <li><a href="/abandon-rate">/abandon-rate</a></li>
    <li><a href="/full-funnel">/full-funnel</a></li>
    <li><a href="/insights">/insights</a></li>
  </ul>
</body></html>`);
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`Running on ${PORT}`));
