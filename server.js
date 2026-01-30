const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.text({ type: 'text/html', limit: '5mb' }));
app.use(express.json());

const DATA_FILE = path.join(__dirname, 'dashboard-data.json');
const UPDATE_SECRET = process.env.UPDATE_SECRET || 'reece-dash-2026';

// Store JSON data instead of full HTML
app.post('/update', (req, res) => {
  const authHeader = req.headers['authorization'];
  if (authHeader !== `Bearer ${UPDATE_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const data = JSON.parse(req.body);
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    res.json({ success: true, timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Helper to load data
const getData = () => {
  if (fs.existsSync(DATA_FILE)) {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  }
  return null;
};

// Base styles matching GHL native widgets
const baseStyles = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { 
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: transparent;
    padding: 0;
  }
  .widget-row {
    display: flex;
    gap: 12px;
    width: 100%;
  }
  .widget-card {
    flex: 1;
    background: #FFFFFF;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    border: 1px solid #e5e7eb;
  }
  .widget-label {
    font-size: 13px;
    color: #6b7280;
    font-weight: 500;
    margin-bottom: 8px;
  }
  .widget-value {
    font-size: 42px;
    font-weight: 600;
    color: #111827;
    line-height: 1;
  }
  .widget-value.good { color: #10b981; }
  .widget-value.warn { color: #f59e0b; }
  .widget-value.bad { color: #ef4444; }
  .widget-subtitle {
    font-size: 11px;
    color: #9ca3af;
    margin-top: 8px;
  }
  .widget-tag {
    display: inline-block;
    background: #ef4444;
    color: white;
    font-size: 9px;
    padding: 2px 6px;
    border-radius: 4px;
    font-weight: 600;
    margin-bottom: 8px;
  }
`;

// ENGAGEMENT WIDGET
app.get('/engagement', (req, res) => {
  const data = getData();
  if (!data) return res.send('<p>Waiting for data...</p>');
  
  const abandonClass = parseFloat(data.abandonment_rate) > 40 ? 'bad' : 
                       parseFloat(data.abandonment_rate) > 20 ? 'warn' : 'good';

  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>${baseStyles}</style></head>
<body>
  <div class="widget-row">
    <div class="widget-card">
      <span class="widget-tag">INPUT</span>
      <div class="widget-label">Chatbot Engaged</div>
      <div class="widget-value">${data.chatbot_engaged_count}</div>
      <div class="widget-subtitle">${data.week_start_date} — ${data.week_end_date}</div>
    </div>
    <div class="widget-card">
      <div class="widget-label">Live Chat Total</div>
      <div class="widget-value">${data.livechat_total}</div>
    </div>
    <div class="widget-card">
      <div class="widget-label">Abandoned</div>
      <div class="widget-value">${data.livechat_abandoned}</div>
    </div>
    <div class="widget-card">
      <div class="widget-label">Abandon Rate</div>
      <div class="widget-value ${abandonClass}">${data.abandonment_rate}</div>
      <div class="widget-subtitle">Target: &lt;40%</div>
    </div>
  </div>
</body></html>`;
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

// CONVERSIONS WIDGET
app.get('/conversions', (req, res) => {
  const data = getData();
  if (!data) return res.send('<p>Waiting for data...</p>');
  
  const funnelClass = parseFloat(data.full_funnel_conversion) >= 15 ? 'good' : 
                      parseFloat(data.full_funnel_conversion) >= 5 ? 'warn' : 'bad';

  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>${baseStyles}</style></head>
<body>
  <div class="widget-row">
    <div class="widget-card">
      <div class="widget-label">Calls Triggered</div>
      <div class="widget-value">${data.hot_call_confirmed_count}</div>
    </div>
    <div class="widget-card">
      <div class="widget-label">Calls Booked</div>
      <div class="widget-value">${data.chatbot_booked_call_count}</div>
    </div>
    <div class="widget-card">
      <span class="widget-tag">GOAL</span>
      <div class="widget-label">Estimates Booked</div>
      <div class="widget-value">${data.chatbot_booked_estimate_count}</div>
    </div>
    <div class="widget-card">
      <div class="widget-label">Full Funnel</div>
      <div class="widget-value ${funnelClass}">${data.full_funnel_conversion}</div>
      <div class="widget-subtitle">Target: &gt;15%</div>
    </div>
  </div>
</body></html>`;
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

// FUNNEL WIDGET
app.get('/funnel', (req, res) => {
  const data = getData();
  if (!data) return res.send('<p>Waiting for data...</p>');

  const funnelStyles = `
    ${baseStyles}
    .funnel-card {
      background: #FFFFFF;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      border: 1px solid #e5e7eb;
    }
    .funnel-title {
      font-size: 14px;
      font-weight: 600;
      color: #111827;
      margin-bottom: 16px;
    }
    .funnel-row {
      display: flex;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid #f3f4f6;
    }
    .funnel-row:last-child { border-bottom: none; }
    .funnel-label {
      flex: 1;
      font-size: 13px;
      color: #6b7280;
    }
    .funnel-rate {
      font-size: 16px;
      font-weight: 600;
      color: #ef4444;
      min-width: 60px;
      text-align: right;
    }
    .funnel-bar {
      width: 120px;
      height: 8px;
      background: #f3f4f6;
      border-radius: 4px;
      margin-left: 12px;
      overflow: hidden;
    }
    .funnel-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #ef4444, #f87171);
      border-radius: 4px;
    }
  `;

  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>${funnelStyles}</style></head>
<body>
  <div class="funnel-card">
    <div class="funnel-title">📊 Funnel Breakdown</div>
    <div class="funnel-row">
      <span class="funnel-label">Engaged → Call Triggered</span>
      <span class="funnel-rate">${data.engagement_to_trigger_rate}</span>
      <div class="funnel-bar"><div class="funnel-bar-fill" style="width:${parseFloat(data.engagement_to_trigger_rate) || 0}%"></div></div>
    </div>
    <div class="funnel-row">
      <span class="funnel-label">Triggered → Booked</span>
      <span class="funnel-rate">${data.trigger_to_booked_rate}</span>
      <div class="funnel-bar"><div class="funnel-bar-fill" style="width:${parseFloat(data.trigger_to_booked_rate) || 0}%"></div></div>
    </div>
    <div class="funnel-row">
      <span class="funnel-label">Full Funnel</span>
      <span class="funnel-rate">${data.full_funnel_conversion}</span>
      <div class="funnel-bar"><div class="funnel-bar-fill" style="width:${parseFloat(data.full_funnel_conversion) || 0}%"></div></div>
    </div>
  </div>
</body></html>`;
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

// OBJECTIONS WIDGET
app.get('/objections', (req, res) => {
  const data = getData();
  if (!data) return res.send('<p>Waiting for data...</p>');

  const objections = [
    { name: 'Timing', count: data.objection_timing || 0 },
    { name: 'Budget', count: data.objection_budget || 0 },
    { name: 'Price', count: data.objection_price || 0 },
    { name: 'Trust', count: data.objection_trust || 0 },
    { name: 'Competitor', count: data.objection_competitor || 0 },
    { name: 'Complexity', count: data.objection_complexity || 0 }
  ].sort((a, b) => b.count - a.count);

  const maxCount = Math.max(...objections.map(o => o.count), 1);

  const objStyles = `
    ${baseStyles}
    .obj-card {
      background: #FFFFFF;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      border: 1px solid #e5e7eb;
    }
    .obj-title {
      font-size: 14px;
      font-weight: 600;
      color: #111827;
      margin-bottom: 16px;
    }
    .obj-row {
      display: flex;
      align-items: center;
      padding: 8px 0;
    }
    .obj-label {
      width: 80px;
      font-size: 13px;
      color: #6b7280;
    }
    .obj-bar-wrap {
      flex: 1;
      height: 12px;
      background: #f3f4f6;
      border-radius: 4px;
      margin: 0 12px;
      overflow: hidden;
    }
    .obj-bar {
      height: 100%;
      background: #d1d5db;
      border-radius: 4px;
    }
    .obj-row.top .obj-bar { background: #ef4444; }
    .obj-row.top .obj-label { color: #ef4444; font-weight: 600; }
    .obj-count {
      width: 30px;
      font-size: 14px;
      font-weight: 600;
      color: #111827;
      text-align: right;
    }
  `;

  const objRows = objections.map((obj, idx) => {
    const barWidth = (obj.count / maxCount) * 100;
    const topClass = idx === 0 && obj.count > 0 ? ' top' : '';
    return `<div class="obj-row${topClass}">
      <span class="obj-label">${obj.name}</span>
      <div class="obj-bar-wrap"><div class="obj-bar" style="width:${barWidth}%"></div></div>
      <span class="obj-count">${obj.count}</span>
    </div>`;
  }).join('');

  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>${objStyles}</style></head>
<body>
  <div class="obj-card">
    <div class="obj-title">🚧 Objections Breakdown</div>
    ${objRows}
  </div>
</body></html>`;
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

// RECOMMENDATIONS WIDGET
app.get('/recommendations', (req, res) => {
  const data = getData();
  if (!data) return res.send('<p>Waiting for data...</p>');

  const recStyles = `
    ${baseStyles}
    .rec-card {
      background: linear-gradient(135deg, #fefce8, #fef3c7);
      border-radius: 8px;
      padding: 16px 20px;
      border-left: 4px solid #f59e0b;
    }
    .rec-title {
      font-size: 13px;
      font-weight: 600;
      color: #111827;
      margin-bottom: 12px;
    }
    .rec-list { list-style: none; }
    .rec-list li {
      font-size: 13px;
      color: #4b5563;
      padding: 4px 0 4px 18px;
      position: relative;
    }
    .rec-list li:before {
      content: "→";
      position: absolute;
      left: 0;
      color: #ef4444;
      font-weight: bold;
    }
  `;

  const recItems = data.recommendations.map(r => `<li>${r}</li>`).join('');

  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>${recStyles}</style></head>
<body>
  <div class="rec-card">
    <div class="rec-title">⚡ Recommended Actions</div>
    <ul class="rec-list">${recItems}</ul>
  </div>
</body></html>`;
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

// HEADER WIDGET (date range + last updated)
app.get('/header', (req, res) => {
  const data = getData();
  if (!data) return res.send('<p>Waiting for data...</p>');

  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
  ${baseStyles}
  .header-card {
    background: linear-gradient(135deg, #122739, #0C2340);
    border-radius: 8px;
    padding: 16px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .header-title {
    font-size: 18px;
    font-weight: 700;
    color: #FFFFFF;
  }
  .header-period {
    font-size: 12px;
    color: #94a3b8;
    margin-top: 4px;
  }
  .header-badge {
    background: #ef4444;
    color: white;
    padding: 6px 12px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 600;
  }
</style></head>
<body>
  <div class="header-card">
    <div>
      <div class="header-title">🤖 Chatbot Performance</div>
      <div class="header-period">${data.week_start_date} — ${data.week_end_date}</div>
    </div>
    <div class="header-badge">Updated: ${data.calculated_at}</div>
  </div>
</body></html>`;
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

// FULL DASHBOARD (all in one - original)
app.get('/', (req, res) => {
  const data = getData();
  if (!data) {
    return res.send('<html><body><h1>Dashboard Ready</h1><p>Waiting for first data update...</p></body></html>');
  }
  // Redirect to engagement as default, or show simple status
  res.send(`<html><body style="font-family:sans-serif;padding:20px;">
    <h2>✅ Dashboard Active</h2>
    <p>Last updated: ${data.calculated_at}</p>
    <p>Available endpoints:</p>
    <ul>
      <li><a href="/header">/header</a></li>
      <li><a href="/engagement">/engagement</a></li>
      <li><a href="/conversions">/conversions</a></li>
      <li><a href="/funnel">/funnel</a></li>
      <li><a href="/objections">/objections</a></li>
      <li><a href="/recommendations">/recommendations</a></li>
    </ul>
  </body></html>`);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
