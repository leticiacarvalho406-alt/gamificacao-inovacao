const express = require('express');
const path    = require('path');
const https   = require('https');

const app  = express();
const PORT = process.env.PORT || 3000;

const MONDAY_KEY = process.env.MONDAY_KEY ||
  'eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjYzMTkxMzAzOSwiYWFpIjoxMSwidWlkIjo2MDYyMjc5OCwiaWFkIjoiMjAyNi0wMy0xMVQxNzo0MToxMS4wMDBaIiwicGVyIjoibWU6d3JpdGUiLCJhY3RpZCI6MTY0ODM4OTEsInJnbiI6InVzZTEifQ.g3HAx1OKRnapboEbgGOD3VKR4ABPKoZung9IyjLzC2Q';

const BOARD_ID = process.env.BOARD_ID || '4879086777';

app.use(express.json({ limit: '10mb' }));
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});
app.use(express.static(__dirname));

// ── MONDAY PROXY ──────────────────────────────────
app.post('/api/monday', (req, res) => {
  const { query } = req.body || {};
  if (!query) return res.status(400).json({ error: 'Query obrigatoria' });

  console.log('[Monday] Recebida query, chamando API...');

  const bodyStr = JSON.stringify({ query });
  let responded = false; // guard against double-response

  const options = {
    hostname: 'api.monday.com',
    path: '/v2',
    method: 'POST',
    headers: {
      'Content-Type':   'application/json',
      'Authorization':  MONDAY_KEY,
      'API-Version':    '2024-01',
      'Content-Length': Buffer.byteLength(bodyStr),
      'User-Agent':     'gamificacao/2.0',
    },
  };

  const mondayReq = https.request(options, (mondayRes) => {
    let data = '';
    mondayRes.on('data', chunk => { data += chunk; });
    mondayRes.on('end', () => {
      if (responded) return;
      responded = true;
      console.log('[Monday] Status:', mondayRes.statusCode, '| Bytes:', data.length);
      try {
        const parsed = JSON.parse(data);
        if (parsed.errors) {
          console.error('[Monday] API errors:', JSON.stringify(parsed.errors));
        } else {
          const count = parsed?.data?.boards?.[0]?.items_page?.items?.length;
          console.log('[Monday] OK! Items:', count);
        }
        res.json(parsed);
      } catch (e) {
        console.error('[Monday] Parse error:', e.message, '| Raw:', data.substring(0, 200));
        res.status(500).json({ error: 'Parse error', raw: data.substring(0, 100) });
      }
    });
  });

  mondayReq.on('error', (e) => {
    if (responded) return;
    responded = true;
    console.error('[Monday] Request error:', e.message);
    res.status(500).json({ error: e.message });
  });

  mondayReq.setTimeout(20000, () => {
    if (responded) return;
    responded = true;
    console.error('[Monday] Timeout!');
    mondayReq.destroy();
    res.status(504).json({ error: 'Timeout' });
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

// ── SPA FALLBACK ──────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║  🚀 GAMIFICAÇÃO INOVAÇÃO — Online!       ║');
  console.log(`║  ✅ Porta: ${PORT}                          ║`);
  console.log('╚══════════════════════════════════════════╝\n');
});
