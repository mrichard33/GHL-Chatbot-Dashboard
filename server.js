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

// ============ HEADER WIDGET ============
app.get('/header', (req, res) => {
  const data = getData();
  if (!data) return res.send('<div>Waiting...</div>');

  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{height:100%;overflow:hidden;background:transparent}
.header{
  background:linear-gradient(135deg,#111827 0%,#1f2937 100%);
  border-radius:8px;
  padding:12px 20px;
  display:flex;
  justify-content:space-between;
  align-items:center;
  height:100%;
}
.header-left{display:flex;align-items:center;gap:12px}
.icon{
  width:40px;height:40px;
  background:rgba(239,68,68,0.15);
  border-radius:8px;
  display:flex;align-items:center;justify-content:center;
  font-size:20px;
}
.header-title{
  font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
  font-size:22px;
  font-weight:700;
  color:#fff;
}
.header-period{
  font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
  font-size:13px;
  color:#9ca3af;
  margin-top:2px;
}
.badge{
  background:#ef4444;
  color:#fff;
  padding:6px 14px;
  border-radius:16px;
  font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
  font-size:12px;
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

// ============ ABANDON RATE - GHL NATIVE STYLE ============
app.get('/abandon-rate', (req, res) => {
  const data = getData();
  if (!data) return res.send('<div>Waiting...</div>');

  const rate = parseFloat(data.abandonment_rate) || 0;
  const statusColor = rate <= 20 ? '#10b981' : rate >= 40 ? '#ef4444' : '#f59e0b';
  const statusText = rate <= 20 ? 'Good' : rate >= 40 ? 'Needs Attention' : 'Monitor';

  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{height:100%;overflow:hidden;background:transparent}
.card{
  background:#fff;
  border-radius:8px;
  height:100%;
  display:flex;
  flex-direction:column;
  border:1px solid #e5e7eb;
  border-top:3px solid #14b8a6;
  overflow:hidden;
}
.card-header{
  padding:12px 16px 0 16px;
  display:flex;
  justify-content:space-between;
  align-items:flex-start;
}
.card-title{
  font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
  font-size:14px;
  font-weight:500;
  color:#111827;
}
.status-badge{
  background:${statusColor}15;
  color:${statusColor};
  font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
  font-size:10px;
  font-weight:600;
  padding:3px 8px;
  border-radius:10px;
}
.card-body{
  flex:1;
  display:flex;
  justify-content:center;
  align-items:center;
}
.value{
  font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
  font-size:72px;
  font-weight:600;
  color:#1e3a5f;
  line-height:1;
}
.card-footer{
  padding:0 16px 12px 16px;
  display:flex;
  align-items:center;
  gap:4px;
}
.target{
  font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
  font-size:12px;
  color:${statusColor};
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
    <span class="target">Target: &lt;40%</span>
  </div>
</div>
</body></html>`;
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

// ============ FULL FUNNEL - GHL NATIVE STYLE ============
app.get('/full-funnel', (req, res) => {
  const data = getData();
  if (!data) return res.send('<div>Waiting...</div>');

  const rate = parseFloat(data.full_funnel_conversion) || 0;
  const statusColor = rate >= 15 ? '#10b981' : rate <= 5 ? '#ef4444' : '#f59e0b';
  const statusText = rate >= 15 ? 'On Track' : rate <= 5 ? 'Needs Attention' : 'Monitor';

  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{height:100%;overflow:hidden;background:transparent}
.card{
  background:#fff;
  border-radius:8px;
  height:100%;
  display:flex;
  flex-direction:column;
  border:1px solid #e5e7eb;
  border-top:3px solid #14b8a6;
  overflow:hidden;
}
.card-header{
  padding:12px 16px 0 16px;
  display:flex;
  justify-content:space-between;
  align-items:flex-start;
}
.card-title{
  font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
  font-size:14px;
  font-weight:500;
  color:#111827;
}
.status-badge{
  background:${statusColor}15;
  color:${statusColor};
  font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
  font-size:10px;
  font-weight:600;
  padding:3px 8px;
  border-radius:10px;
}
.card-body{
  flex:1;
  display:flex;
  justify-content:center;
  align-items:center;
}
.value{
  font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
  font-size:72px;
  font-weight:600;
  color:#1e3a5f;
  line-height:1;
}
.card-footer{
  padding:0 16px 12px 16px;
  display:flex;
  align-items:center;
  gap:4px;
}
.target{
  font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
  font-size:12px;
  color:${statusColor};
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
    <span class="target">Target: &gt;15%</span>
  </div>
</div>
</body></html>`;
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

// ============ INSIGHTS PANEL ============
app.get('/insights', (req, res) => {
  const data = getData();
  if (!data) return res.send('<div>Waiting...</div>');

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
      <span class="rec-icon">→</span>
      <span class="rec-text">${r}</span>
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
*{margin:0;padding:0;box-sizing:border-box}
html,body{
  font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
  height:100%;
  overflow:hidden;
  background:#f9fafb;
}
.container{
  height:100%;
  padding:8px;
  display:flex;
  flex-direction:column;
  gap:8px;
}
.panels{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:8px;
  flex:1;
  min-height:0;
}
.panel{
  background:#fff;
  border-radius:8px;
  border:1px solid #e5e7eb;
  border-top:3px solid #14b8a6;
  padding:12px 16px;
  display:flex;
  flex-direction:column;
  overflow:hidden;
}
.panel-title{
  font-size:14px;
  font-weight:500;
  color:#111827;
  margin-bottom:12px;
  display:flex;
  align-items:center;
  gap:8px;
}
.panel-content{
  flex:1;
  display:flex;
  flex-direction:column;
  justify-content:space-around;
}
.funnel-row{
  display:flex;
  align-items:center;
  padding:8px 0;
}
.funnel-label{
  width:130px;
  font-size:13px;
  color:#6b7280;
}
.funnel-bar-wrap{
  flex:1;
  height:8px;
  background:#f3f4f6;
  border-radius:4px;
  margin:0 12px;
  overflow:hidden;
}
.funnel-bar{
  height:100%;
  background:linear-gradient(90deg,#3b82f6,#60a5fa);
  border-radius:4px;
}
.funnel-rate{
  font-size:16px;
  font-weight:700;
  color:#111827;
  min-width:55px;
  text-align:right;
}
.obj-row{
  display:flex;
  align-items:center;
  padding:6px 0;
}
.obj-label{
  width:75px;
  font-size:13px;
  color:#6b7280;
}
.obj-bar-wrap{
  flex:1;
  height:8px;
  background:#f3f4f6;
  border-radius:4px;
  margin:0 10px;
  overflow:hidden;
}
.obj-bar{
  height:100%;
  background:#d1d5db;
  border-radius:4px;
}
.obj-count{
  font-size:14px;
  font-weight:600;
  color:#111827;
  min-width:24px;
  text-align:right;
}
.recs-panel{
  background:#fffbeb;
  border-radius:8px;
  padding:10px 14px;
  border-left:4px solid #f59e0b;
}
.recs-title{
  font-size:11px;
  font-weight:700;
  color:#92400e;
  text-transform:uppercase;
  margin-bottom:8px;
  display:flex;
  align-items:center;
  gap:6px;
}
.rec-item{
  display:flex;
  align-items:flex-start;
  gap:8px;
  padding:4px 0;
}
.rec-icon{
  color:#ef4444;
  font-weight:bold;
  font-size:13px;
}
.rec-text{
  font-size:13px;
  color:#78716c;
  line-height:1.4;
}
</style></head>
<body>
<div class="container">
  <div class="panels">
    <div class="panel">
      <div class="panel-title">📊 Funnel Breakdown</div>
      <div class="panel-content">
        ${funnelRowsHtml}
      </div>
    </div>
    <div class="panel">
      <div class="panel-title">🚧 Objections Breakdown</div>
      <div class="panel-content">
        ${objectionRowsHtml}
      </div>
    </div>
  </div>
  <div class="recs-panel">
    <div class="recs-title">⚡ Recommended Actions</div>
    ${recsHtml}
  </div>
</div>
</body></html>`;
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

app.get('/', (req, res) => {
  const data = getData();
  res.send(`<h1>Dashboard API</h1><p>Updated: ${data ? data.calculated_at : 'Never'}</p>
  <ul><li><a href="/header">/header</a></li><li><a href="/abandon-rate">/abandon-rate</a></li>
  <li><a href="/full-funnel">/full-funnel</a></li><li><a href="/insights">/insights</a></li></ul>`);
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`Running on ${PORT}`));
