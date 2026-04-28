const express = require('express');
const path    = require('path');
const https   = require('https');

const app  = express();
const PORT = process.env.PORT || 3000;

const MONDAY_KEY = process.env.MONDAY_KEY ||
  'eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjYzMTkxMzAzOSwiYWFpIjoxMSwidWlkIjo2MDYyMjc5OCwiaWFkIjoiMjAyNi0wMy0xMVQxNzo0MToxMS4wMDBaIiwicGVyIjoibWU6d3JpdGUiLCJhY3RpZCI6MTY0ODM4OTEsInJnbiI6InVzZTEifQ.g3HAx1OKRnapboEbgGOD3VKR4ABPKoZung9IyjLzC2Q';

const BOARD_ID = process.env.BOARD_ID || '4879086777';

app.use(express.json({ limit: '10mb' }));

// Allow all CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Serve static files from same directory
app.use(express.static(__dirname));

// ── MONDAY PROXY ──────────────────────────────────
app.post('/api/monday', (req, res) => {
  const { query } = req.body || {};
  if (!query) return res.status(400).json({ error: 'Query obrigatória' });

  console.log('[Monday] Query recebida, chamando API...');

  const bodyStr = JSON.stringify({ query });

  const options = {
    hostname: 'api.monday.com',
    path: '/v2',
    method: 'POST',
    headers: {
      'Content-Type':   'application/json',
      'Authorization':  MONDAY_KEY,
      'API-Version':    '2024-01',
      'Content-Length': Buffer.byteLength(bodyStr),
      'User-Agent':     'gamificacao-inovacao/2.0',
    },
  };

  const mondayReq = https.request(options, (mondayRes) => {
    console.log('[Monday] Status:', mondayRes.statusCode);
    let data = '';
    mondayRes.on('data', chunk => { data += chunk; });
    mondayRes.on('end', () => {
      console.log('[Monday] Resposta recebida, tamanho:', data.length);
      try {
        const parsed = JSON.parse(data);
        if (parsed.errors) {
          console.error('[Monday] Erros da API:', JSON.stringify(parsed.errors));
        } else {
          console.log('[Monday] ✅ Sucesso!');
        }
        res.json(parsed);
      } catch (e) {
        console.error('[Monday] Parse error:', e.message, '| Raw:', data.substring(0, 200));
        res.status(500).json({ error: 'Parse error', raw: data.substring(0, 200) });
      }
    });
  });

  mondayReq.on('error', (e) => {
    console.error('[Monday] Request error:', e.message);
    res.status(500).json({ error: e.message });
  });

  mondayReq.setTimeout(15000, () => {
    console.error('[Monday] Timeout!');
    mondayReq.destroy();
    res.status(504).json({ error: 'Timeout ao conectar com Monday.com' });
  });

  mondayReq.write(bodyStr);
  mondayReq.end();
});

// ── CONFIG ────────────────────────────────────────
app.get('/api/config', (req, res) => {
  res.json({ boardId: BOARD_ID, ok: true });
});

// ── HEALTH ────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

// ── FALLBACK SPA ──────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║  🚀 GAMIFICAÇÃO INOVAÇÃO — Online!       ║');
  console.log(`║  ✅ Porta: ${PORT}                          ║`);
  console.log(`║  🔗 Board: ${BOARD_ID}              ║`);
  console.log('╚══════════════════════════════════════════╝\n');
});
