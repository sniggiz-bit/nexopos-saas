'use strict';
const { spawn } = require('node:child_process');
const path = require('node:path');
/** One warm Windows process. A failed/uncertain request is never replayed. */
class WindowsWorker {
  constructor({ launch = () => spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', path.join(__dirname, 'windows.ps1'), '-Action', 'serve'], { windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] }), startupMs = 15000, requestMs = 30000 } = {}) {
    this.launch = launch; this.startupMs = startupMs; this.requestMs = requestMs; this.current = null; this.queue = Promise.resolve(); this.sequence = 0; this.closed = false;
  }
  ready() {
    if (this.closed) return Promise.reject(new Error('El conector de impresión está cerrado.'));
    if (this.current) return this.current.ready;
    const state = { child: null, text: '', pending: null, timer: null, resolveReady: null, rejectReady: null, ready: null };
    state.ready = new Promise((resolve, reject) => { state.resolveReady = resolve; state.rejectReady = reject; });
    this.current = state;
    const fail = () => this.fail(state);
    try {
      state.child = this.launch();
      state.timer = setTimeout(fail, this.startupMs);
      state.child.stdout.setEncoding('utf8');
      state.child.stdout.on('data', part => {
        state.text += part;
        if (state.text.length > 100000) return fail();
        let end;
        while ((end = state.text.indexOf('\n')) >= 0) {
          const line = state.text.slice(0, end).replace(/^\uFEFF/, '').trim(); state.text = state.text.slice(end + 1);
          if (!line) continue;
          let result; try { result = JSON.parse(line); } catch { return fail(); }
          if (result.ready === true && state.resolveReady) {
            clearTimeout(state.timer); state.timer = null;
            const resolve = state.resolveReady; state.resolveReady = null; state.rejectReady = null; resolve();
          } else if (state.pending && result.id === state.pending.id && typeof result.ok === 'boolean') {
            const pending = state.pending; state.pending = null; clearTimeout(pending.timer);
            if (result.ok) pending.resolve(result.result);
            else pending.reject(new Error('Windows rechazó el trabajo. Revisa la impresora antes de reimprimir.'));
          } else return fail();
        }
      });
      state.child.stderr.resume();
      state.child.stdin.on('error', fail); state.child.once('error', fail); state.child.once('close', fail);
    } catch { fail(); }
    return state.ready;
  }
  fail(state) {
    if (this.current !== state) return;
    this.current = null; clearTimeout(state.timer);
    const error = new Error('No se confirmó el envío a Windows. Revisa el papel antes de reimprimir.');
    if (state.rejectReady) state.rejectReady(error);
    state.resolveReady = null; state.rejectReady = null;
    if (state.pending) { clearTimeout(state.pending.timer); state.pending.reject(error); state.pending = null; }
    state.child?.kill();
  }
  request(action, input) {
    if (!['list', 'print', 'probe'].includes(action)) return Promise.reject(new Error('Acción local no válida.'));
    const job = this.queue.then(async () => {
      await this.ready(); const state = this.current;
      if (!state) throw Error('El proceso de impresión no está disponible.');
      return new Promise((resolve, reject) => {
        const id = ++this.sequence;
        state.pending = { id, resolve, reject, timer: setTimeout(() => this.fail(state), this.requestMs) };
        state.child.stdin.write(JSON.stringify({ id, action, input }) + '\n', error => { if (error) this.fail(state); });
      });
    });
    this.queue = job.catch(() => undefined); return job;
  }
  close() { this.closed = true; if (this.current) this.fail(this.current); }
}
module.exports = { WindowsWorker };
