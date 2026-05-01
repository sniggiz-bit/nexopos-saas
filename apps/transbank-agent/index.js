'use strict';

const express = require('express');
const cors    = require('cors');

const MOCK_MODE = process.env.MOCK_MODE === 'true' || process.env.MOCK_MODE === '1';
const PORT      = parseInt(process.env.PORT ?? '7777', 10);
const COM_PORT  = process.env.COM_PORT ?? 'COM3';
const BAUD_RATE = parseInt(process.env.BAUD_RATE ?? '115200', 10);

// Carga el adapter real o el mock según configuración
let adapter;
if (MOCK_MODE) {
  const { MockTransbank } = require('./mock-transbank');
  adapter = new MockTransbank();
} else {
  const { TransbankAdapter } = require('./transbank-adapter');
  adapter = new TransbankAdapter(COM_PORT, BAUD_RATE);
}

const app = express();
app.use(express.json());

// Solo acepta peticiones desde localhost (el browser del cajero)
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:4173', /^http:\/\/localhost/],
  methods: ['GET', 'POST'],
}));

// ──────────────────────────────────────────────
// GET /status — estado del terminal
// ──────────────────────────────────────────────
app.get('/status', async (_req, res) => {
  try {
    const status = await adapter.getStatus();
    res.json({ ok: true, ...status, mockMode: MOCK_MODE });
  } catch (err) {
    res.status(503).json({ ok: false, error: err.message });
  }
});

// ──────────────────────────────────────────────
// POST /sale — inicia venta en el terminal
// Body: { amount: number, ticket: string }
// ──────────────────────────────────────────────
app.post('/sale', async (req, res) => {
  const { amount, ticket } = req.body ?? {};

  if (!amount || typeof amount !== 'number' || amount < 1) {
    return res.status(400).json({ ok: false, error: 'amount debe ser un número entero > 0' });
  }
  if (!ticket || typeof ticket !== 'string') {
    return res.status(400).json({ ok: false, error: 'ticket es requerido (string)' });
  }

  console.log(`[Agent] POST /sale — amount=${amount} ticket=${ticket}`);

  try {
    const result = await adapter.sale(amount, ticket);
    console.log(`[Agent] Sale result: code=${result.responseCode} auth=${result.authorizationCode}`);
    res.json({ ok: true, ...result });
  } catch (err) {
    console.error(`[Agent] Sale error: ${err.message}`);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ──────────────────────────────────────────────
// Inicio
// ──────────────────────────────────────────────
async function start() {
  try {
    await adapter.connect();
  } catch (err) {
    console.warn(`[Agent] connect() falló: ${err.message}`);
    if (!MOCK_MODE) {
      console.error('[Agent] ERROR: No se pudo conectar al POS. Verifica COM_PORT y que el terminal esté encendido.');
      process.exit(1);
    }
  }

  app.listen(PORT, '127.0.0.1', () => {
    const mode = MOCK_MODE ? 'MOCK' : `POS real en ${COM_PORT}`;
    console.log(`\n╔══════════════════════════════════════════╗`);
    console.log(`║   NexoPOS Transbank Agent — puerto ${PORT}   ║`);
    console.log(`║   Modo: ${mode.padEnd(32)}║`);
    console.log(`╚══════════════════════════════════════════╝\n`);
  });

  process.on('SIGINT', async () => {
    console.log('\n[Agent] Cerrando conexión...');
    await adapter.disconnect();
    process.exit(0);
  });
}

start();
