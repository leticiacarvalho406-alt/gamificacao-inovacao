const express = require('express');
const path    = require('path');
const cors    = require('cors');
const https   = require('https');

const app  = express();
const PORT = process.env.PORT || 3000;

const MONDAY_KEY = process.env.MONDAY_KEY ||
  'eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjYzMTkxMzAzOSwiYWFpIjoxMSwidWlkIjo2MDYyMjc5OCwiaWFkIjoiMjAyNi0wMy0xMVQxNzo0MToxMS4wMDBaIiwicGVyIjoibWU6d3JpdGUiLCJhY3RpZCI6MTY0ODM4OTEsInJnbiI6InVzZTEifQ.g3HAx1OKRnapboEbgGOD3VKR4ABPKoZung9IyjLzC2Q';

const BOARD_ID = process.env.BOARD_ID || '4879086777';

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve index.html from root folder
app.use(express.static(__dirname));

// ── MONDAY PROXY ──────────────────────────────────
app.post('/api/monday', (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: 'Query obrigatória' });

  const body = JSON.stringify({ query });
  const options = {
    hostname: 'api.monday.com',
    path: '/v2',
    method: 'POST',
    headers: {
      'Content-Type':   'application/json',
      'Authorization':  MONDAY_KEY,
      'API-Version':    '2024-01',
      'Content-Length': Buffer.byteLength(body),
    },
  };

  const mondayReq = https.request(options, (mondayRes) => {
    let data = '';
    mondayRes.on('data', chunk => data += chunk);
    mondayRes.on('end', () => {
      try {
        const parsed = JSON.parse(data);
        res.json(parsed);
      } catch (e) {
        console.error('Monday parse error:', data.substring(0, 200));
        res.status(500).json({ error: 'Resposta inválida do Monday', raw: data.substring(0, 100) });
      }
    });
  });

  mondayReq.on('error', (e) => {
    console.error('Erro Monday:', e.message);
    res.status(500).json({ error: e.message });
  });

  mondayReq.write(body);
  mondayReq.end();
});

// ── CONFIG ────────────────────────────────────────
app.get('/api/config', (req, res) => {
  res.json({ boardId: BOARD_ID });
});

// ── HEALTH ────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

// ── FALLBACK ──────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║  🚀 GAMIFICAÇÃO INOVAÇÃO — Online!       ║');
  console.log(`║  ✅ Porta: ${PORT}                          ║`);
  console.log('╚══════════════════════════════════════════╝\n');
});
