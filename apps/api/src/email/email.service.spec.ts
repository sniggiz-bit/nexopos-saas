import { Logger } from '@nestjs/common';
import { EmailService } from './email.service';

describe('Welcome email transport', () => {
  const originalEnv = { ...process.env };
  const originalFetch = global.fetch;
  const credentials = { email: 'owner@example.cl', companyName: '<img src=x>' };
  beforeEach(() => {
    process.env = { ...originalEnv, RESEND_API_KEY: 'test-key', NODE_ENV: 'production' };
    delete process.env.FRONTEND_URL;
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 'provider-id' }) });
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
  });
  afterEach(() => { process.env = { ...originalEnv }; global.fetch = originalFetch; jest.restoreAllMocks(); });

  it('preserves the welcome template and omits initial credentials on a resend', async () => {
    const result = await new EmailService().sendWelcomeEmail(credentials.email, '<script>alert(1)</script>', { ...credentials, password: 'SECRET' } as typeof credentials);
    expect(result).toEqual({ status: 'ACCEPTED', providerId: 'provider-id' });
    const html = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body).html;
    expect(html).toContain('https://nexopos.cl/login');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('&lt;img');
    expect(html).not.toContain('SECRET');
    expect(html).not.toContain('localhost');
    expect(html).toContain('Paso 1. Crea las categorías');
    expect(html).toContain('Paso 2. Registra las marcas');
    expect(html).toContain('Paso 3. Ingresa tus productos y su imagen principal');
    expect(html).toContain('Paso 4. Registra los proveedores');
    expect(html).toContain('https://wa.me/56940082418');
    expect(html).toContain('https://nexopos.cl/dashboard');
  });

  it('includes the exact escaped initial password in the configured welcome email', async () => {
    process.env.FROM_EMAIL = 'NexoPOS <welcome@example.test>';
    const initialPassword = '  Clave<&>' + String.fromCharCode(34, 39) + '  ';
    await new EmailService().sendWelcomeEmail(credentials.email, 'Owner', { ...credentials, initialPassword });
    const request = (global.fetch as jest.Mock).mock.calls[0][1];
    const payload = JSON.parse(request.body);
    expect(payload.from).toBe(process.env.FROM_EMAIL);
    expect(payload.to).toBe(credentials.email);
    expect(payload.subject).toBe('\u00a1Bienvenido a NexoPOS!');
    expect(payload.html).toContain('CONTRASE\u00d1A INICIAL');
    expect(payload.html).toContain('>  Clave&lt;&amp;&gt;&quot;&#39;  </code>');
    expect(payload.html).toContain('white-space:pre-wrap');
    expect(payload.html).toContain(credentials.email);
    expect(payload.html).toContain('https://nexopos.cl/login');
    expect(payload.html).toContain('Paso 1. Crea las categor\u00edas');
    expect(payload.html).toContain('https://wa.me/56940082418');
    expect(payload.html).not.toContain(initialPassword);
    expect(Logger.prototype.log).not.toHaveBeenCalled();
  });

  it('keeps the initial password out of logs and errors when sending fails', async () => {
    const initialPassword = 'INITIAL_PASSWORD_ONLY_FOR_TEST';
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error(initialPassword));
    const result = await new EmailService().sendWelcomeEmail(credentials.email, 'Owner', { ...credentials, initialPassword });
    expect(result.status).toBe('FAILED');
    const calls = [Logger.prototype.log, Logger.prototype.warn, Logger.prototype.error].map(method => (method as jest.Mock).mock.calls);
    expect(JSON.stringify({ result, calls })).not.toContain(initialPassword);
  });

  it('skips transport and content logging when no key is configured', async () => {
    delete process.env.RESEND_API_KEY;
    await expect(new EmailService().sendWelcomeEmail(credentials.email, 'Owner', credentials)).resolves.toHaveProperty('status', 'NOT_CONFIGURED');
    expect(global.fetch).not.toHaveBeenCalled();
    expect(Logger.prototype.log).not.toHaveBeenCalled();
  });

  it.each(['http://localhost:5173', 'https://localhost', 'javascript:alert(1)', 'not-a-url', 'https://user:pass@example.cl'])('rejects an invalid production URL: %s', async url => {
    process.env.FRONTEND_URL = url;
    await expect(new EmailService().sendWelcomeEmail(credentials.email, 'Owner', credentials)).resolves.toHaveProperty('status', 'NOT_CONFIGURED');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('uses a configured HTTPS URL without duplicating the login path', async () => {
    process.env.FRONTEND_URL = 'https://www.nexopos.cl/';
    await new EmailService().sendWelcomeEmail(credentials.email, 'Owner', credentials);
    expect(JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body).html).toContain('https://www.nexopos.cl/login');
  });

  it('reports rejection without exposing the provider response body', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 403, text: async () => 'sensitive provider data' });
    await expect(new EmailService().sendWelcomeEmail(credentials.email, 'Owner', credentials)).resolves.toEqual({ status: 'FAILED', error: 'Resend rechazó el envío (HTTP 403).' });
  });

  it('handles network failures and ambiguous responses without claiming delivery', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('secret'));
    await expect(new EmailService().sendWelcomeEmail(credentials.email, 'Owner', credentials)).resolves.toHaveProperty('status', 'FAILED');
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => ({}) });
    await expect(new EmailService().sendWelcomeEmail(credentials.email, 'Owner', credentials)).resolves.toHaveProperty('status', 'FAILED');
  });
});
