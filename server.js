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
html,body{
  width:100%;
  height:100%;
  overflow:hidden;
  background:transparent;
  font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
}
.header{
  background:linear-gradient(135deg,#111827 0%,#1f2937 100%);
  display:flex;
  justify-content:space-between;
  align-items:center;
  width:100%;
  height:100%;
  padding:0 2vw;
}
.header-left{display:flex;align-items:center;gap:1.5vw}
.icon{
  width:5vh;
  height:5vh;
  background:rgba(239,68,68,0.15);
  border-radius:1vh;
  display:flex;align-items:center;justify-content:center;
  font-size:3vh;
}
.header-title{
  font-size:4vh;
  font-weight:700;
  color:#fff;
}
.header-period{
  font-size:2.5vh;
  color:#9ca3af;
}
.badge{
  background:#ef4444;
  color:#fff;
  padding:1vh 2vw;
  border-radius:2vh;
  font-size:2vh;
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
  if (!data) return res.send('<div>Waiting...</div>');

  const rate = parseFloat(data.abandonment_rate) || 0;
  const statusColor = rate <= 20 ? '#10b981' : rate >= 40 ? '#ef4444' : '#f59e0b';
  const statusText = rate <= 20 ? 'Good' : rate >= 40 ? 'Needs Attention' : 'Monitor';

  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{
  width:100%;
  height:100%;
  overflow:hidden;
  background:transparent;
  font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
}
.card{
  background:#fff;
  width:100%;
  height:100%;
  display:flex;
  flex-direction:column;
  border:1px solid #e5e7eb;
  border-top:3px solid #14b8a6;
  border-radius:8px;
}
.card-header{
  padding:2vh 3vw 0 3vw;
  display:flex;
  justify-content:space-between;
  align-items:center;
}
.card-title{
  font-size:3.5vh;
  font-weight:500;
  color:#111827;
}
.status-badge{
  background:${statusColor}20;
  color:${statusColor};
  font-size:2.5vh;
  font-weight:600;
  padding:0.8vh 2vw;
  border-radius:2vh;
}
.card-body{
  flex:1;
  display:flex;
  justify-content:center;
  align-items:center;
}
.value{
  font-size:20vh;
  font-weight:600;
  color:#1e3a5f;
  line-height:1;
}
.card-footer{
  padding:0 3vw 2vh 3vw;
}
.target{
  font-size:2.5vh;
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

// ============ FULL FUNNEL WIDGET ============
app.get('/full-funnel', (req, res) => {
  const data = getData();
  if (!data) return res.send('<div>Waiting...</div>');

  const rate = parseFloat(data.full_funnel_conversion) || 0;
  const statusColor = rate >= 15 ? '#10b981' : rate <= 5 ? '#ef4444' : '#f59e0b';
  const statusText = rate >= 15 ? 'On Track' : rate <= 5 ? 'Needs Attention' : 'Monitor';

  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{
  width:100%;
  height:100%;
  overflow:hidden;
  background:transparent;
  font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
}
.card{
  background:#fff;
  width:100%;
  height:100%;
  display:flex;
  flex-direction:column;
  border:1px solid #e5e7eb;
  border-top:3px solid #14b8a6;
  border-radius:8px;
}
.card-header{
  padding:2vh 3vw 0 3vw;
  display:flex;
  justify-content:space-between;
  align-items:center;
}
.card-title{
  font-size:3.5vh;
  font-weight:500;
  color:#111827;
}
.status-badge{
  background:${statusColor}20;
  color:${statusColor};
  font-size:2.5vh;
  font-weight:600;
  padding:0.8vh 2vw;
  border-radius:2vh;
}
.card-body{
  flex:1;
  display:flex;
  justify-content:center;
  align-items:center;
}
.value{
  font-size:20vh;
  font-weight:600;
  color:#1e3a5f;
  line-height:1;
}
.card-footer{
  padding:0 3vw 2vh 3vw;
}
.target{
  font-size:2.5vh;
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
    return `<div class="row">
      <span class="label" style="${isTop ? 'color:#ef4444;font-weight:600;' : ''}">${obj.name}</span>
      <div class="bar-wrap">
        <div class="bar" style="width:${barWidth}%;${isTop ? 'background:linear-gradient(90deg,#ef4444,#f87171);' : ''}"></div>
      </div>
      <span class="count" style="${isTop ? 'color:#ef4444;' : ''}">${obj.count}</span>
    </div>`;
  }).join('');

  const recsHtml = data.recommendations.map(r => `
    <div class="rec-item">
      <span class="rec-arrow">→</span>
      <span class="rec-text">${r}</span>
    </div>
  `).join('');

  const funnelData = [
    { label: 'Engaged → Triggered', rate: data.engagement_to_trigger_rate },
    { label: 'Triggered → Booked', rate: data.trigger_to_booked_rate },
    { label: 'Full Funnel', rate: data.full_funnel_conversion }
  ];

  const funnelRowsHtml = funnelData.map(f => `
    <div class="row">
      <span class="label">${f.label}</span>
      <div class="bar-wrap">
        <div class="bar blue" style="width:${parseFloat(f.rate) || 0}%"></div>
      </div>
      <span class="rate">${f.rate}</span>
    </div>
  `).join('');

  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{
  width:100%;
  height:100%;
  overflow:hidden;
  background:#f3f4f6;
  font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
}
.container{
  width:100%;
  height:100%;
  padding:1.5vh 1vw;
  display:flex;
  flex-direction:column;
  gap:1.5vh;
}
.panels{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:1vw;
  flex:1;
  min-height:0;
}
.panel{
  background:#fff;
  border-radius:8px;
  border:1px solid #e5e7eb;
  border-top:3px solid #14b8a6;
  padding:2vh 2vw;
  display:flex;
  flex-direction:column;
}
.panel-title{
  font-size:3vh;
  font-weight:500;
  color:#111827;
  margin-bottom:2vh;
  display:flex;
  align-items:center;
  gap:1vw;
}
.panel-content{
  flex:1;
  display:flex;
  flex-direction:column;
  justify-content:space-around;
}
.row{
  display:flex;
  align-items:center;
  padding:1.5vh 0;
}
.label{
  width:14vw;
  font-size:2.5vh;
  color:#6b7280;
}
.bar-wrap{
  flex:1;
  height:1.8vh;
  background:#f3f4f6;
  border-radius:1vh;
  margin:0 1.5vw;
  overflow:hidden;
}
.bar{
  height:100%;
  background:#d1d5db;
  border-radius:1vh;
}
.bar.blue{
  background:linear-gradient(90deg,#3b82f6,#60a5fa);
}
.rate{
  font-size:3.5vh;
  font-weight:700;
  color:#111827;
  min-width:7vw;
  text-align:right;
}
.count{
  font-size:3vh;
  font-weight:600;
  color:#111827;
  min-width:4vw;
  text-align:right;
}
.recs{
  background:#fffbeb;
  border-radius:8px;
  padding:2vh 2vw;
  border-left:4px solid #f59e0b;
}
.recs-title{
  font-size:2.5vh;
  font-weight:700;
  color:#92400e;
  text-transform:uppercase;
  margin-bottom:1.5vh;
}
.rec-item{
  display:flex;
  gap:1vw;
  padding:1vh 0;
}
.rec-arrow{
  color:#ef4444;
  font-weight:bold;
  font-size:2.5vh;
}
.rec-text{
  font-size:2.5vh;
  color:#78716c;
  line-height:1.4;
}
</style></head>
<body>
<div class="container">
  <div class="panels">
    <div class="panel">
      <div class="panel-title">📊 Funnel Breakdown</div>
      <div class="panel-content">${funnelRowsHtml}</div>
    </div>
    <div class="panel">
      <div class="panel-title">🚧 Objections Breakdown</div>
      <div class="panel-content">${objectionRowsHtml}</div>
    </div>
  </div>
  <div class="recs">
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
