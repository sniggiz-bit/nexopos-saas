'use strict';

/**
 * Simulador de terminal Transbank POS Integrado.
 * Reproduce el comportamiento real: demora ~3s, devuelve respuesta aprobada/rechazada.
 * Se activa con MOCK_MODE=true (o cuando no hay hardware conectado).
 */

const SCENARIOS = {
  approved: {
    success:           true,
    responseCode:      0,
    responseMessage:   'APROBADO',
    authorizationCode: '123456',
    cardType:          'DB',
    lastFourDigits:    '4242',
    installments:      0,
    terminalId:        'MOCK-TERM-01',
  },
  rejected: {
    success:           false,
    responseCode:      9,
    responseMessage:   'RECHAZADO',
    authorizationCode: '',
    cardType:          'CR',
    lastFourDigits:    '1111',
    installments:      0,
    terminalId:        'MOCK-TERM-01',
  },
  timeout: null, // simula timeout de terminal
};

class MockTransbank {
  constructor() {
    this.connected = true;
    this.scenario = process.env.MOCK_SCENARIO ?? 'approved';
    this.delayMs  = parseInt(process.env.MOCK_DELAY_MS ?? '3000', 10);
    console.log(`[MockTransbank] Iniciado — escenario: ${this.scenario}, delay: ${this.delayMs}ms`);
  }

  async connect() {
    console.log('[MockTransbank] connect() — simulado');
  }

  async disconnect() {
    console.log('[MockTransbank] disconnect() — simulado');
  }

  async sale(amount, ticket) {
    console.log(`[MockTransbank] sale(${amount}, ${ticket}) — esperando ${this.delayMs}ms...`);

    await new Promise((resolve) => setTimeout(resolve, this.delayMs));

    if (this.scenario === 'timeout') {
      throw new Error('TIMEOUT: terminal no respondió');
    }

    const base = SCENARIOS[this.scenario] ?? SCENARIOS.approved;
    const now  = new Date();

    return {
      ...base,
      amount,
      ticket,
      realDate: now.toLocaleDateString('es-CL').replace(/\//g, ''),
      realTime: now.toTimeString().slice(0, 8).replace(/:/g, ''),
    };
  }

  async getStatus() {
    return {
      connected:  true,
      port:       'MOCK',
      terminalId: 'MOCK-TERM-01',
      mockMode:   true,
    };
  }
}

module.exports = { MockTransbank };
