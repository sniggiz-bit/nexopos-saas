'use strict';

/**
 * Adapter real para Transbank POS Integrado (SDK oficial).
 * Solo se usa cuando MOCK_MODE=false.
 *
 * Dependencia: transbank-sdk npm package
 * SDK docs: https://www.transbankdevelopers.cl/documentacion/posintegrado
 */

let PosIntegrado;
try {
  ({ PosIntegrado } = require('transbank-sdk'));
} catch {
  // SDK no instalado — solo ocurre en entornos sin hardware real
  PosIntegrado = null;
}

class TransbankAdapter {
  constructor(port, baudRate = 115200) {
    if (!PosIntegrado) {
      throw new Error('transbank-sdk no está instalado. Ejecuta: npm install transbank-sdk');
    }
    this.port = port;
    this.baudRate = baudRate;
    this.pos = new PosIntegrado();
    this.connected = false;
  }

  async connect() {
    await this.pos.connect(this.port, this.baudRate);
    await this.pos.loadKeys();
    this.connected = true;
    console.log(`[Transbank] Conectado en ${this.port} @ ${this.baudRate}`);
  }

  async disconnect() {
    if (this.connected) {
      await this.pos.disconnect();
      this.connected = false;
    }
  }

  /**
   * Ejecuta una venta en el terminal físico.
   * @param {number} amount — monto en pesos (entero, sin decimales)
   * @param {string} ticket — número de ticket/orden único
   * @returns {Promise<NormalizedResponse>}
   */
  async sale(amount, ticket) {
    if (!this.connected) {
      throw new Error('POS no conectado. Llama connect() primero.');
    }

    const raw = await this.pos.sale(amount, ticket);
    return this._normalize(raw);
  }

  async getStatus() {
    if (!this.connected) return { connected: false };
    try {
      const info = await this.pos.getLastSale();
      return {
        connected: true,
        port: this.port,
        terminalId: info?.terminalId ?? null,
      };
    } catch {
      return { connected: true, port: this.port };
    }
  }

  _normalize(raw) {
    const responseCode = raw.responseCode ?? raw.ResponseCode ?? -1;
    return {
      success:           responseCode === 0,
      responseCode,
      responseMessage:   raw.responseMessage ?? raw.ResponseMessage ?? '',
      authorizationCode: raw.authorizationCode ?? raw.AuthorizationCode ?? '',
      amount:            raw.amount ?? raw.Amount ?? 0,
      cardType:          raw.cardType ?? raw.CardType ?? '',
      lastFourDigits:    raw.lastFourDigits ?? raw.CardNumber?.slice(-4) ?? '',
      ticket:            raw.ticket ?? raw.Ticket ?? '',
      realDate:          raw.realDate ?? raw.TransactionDate ?? '',
      realTime:          raw.realTime ?? raw.TransactionTime ?? '',
      installments:      raw.sharesNumber ?? raw.installments ?? 0,
      terminalId:        raw.terminalId ?? raw.TerminalId ?? null,
    };
  }
}

module.exports = { TransbankAdapter };
