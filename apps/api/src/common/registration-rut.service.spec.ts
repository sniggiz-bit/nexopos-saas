import { BadRequestException, HttpException } from '@nestjs/common';
import { RegistrationRutService } from './registration-rut.service';

const rut = '12.345.678-5';
const company = { reasonSocial: 'Almacén de prueba', giro: 'Comercio', address: 'Dirección de prueba', comuna: 'Comuna de prueba', city: 'Ciudad de prueba', _raw: { token: 'PRIVATE_PROVIDER_DATA' } };
const fixtureRut = (number: number) => {
  let sum = 0;
  let factor = 2;
  for (const digit of String(number).split('').reverse()) { sum += Number(digit) * factor; factor = factor === 7 ? 2 : factor + 1; }
  const result = 11 - sum % 11;
  return number + '-' + (result === 11 ? '0' : result === 10 ? 'K' : result);
};

describe('Registration RUT lookup', () => {
  let provider: { consultaRut: jest.Mock };
  let service: RegistrationRutService;
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-11-23T12:00:00Z'));
    provider = { consultaRut: jest.fn().mockResolvedValue({ success: true, data: company }) };
    service = new RegistrationRutService(provider as any);
  });
  afterEach(() => { jest.useRealTimers(); });

  it('reuses the provider without a tenant or development fixtures and returns only business fields', async () => {
    const result = await service.lookup('123456785', 'browser');
    expect(provider.consultaRut).toHaveBeenCalledWith(rut, undefined, false);
    expect(result).toEqual({ success: true, data: { rut, reasonSocial: company.reasonSocial, giro: company.giro, address: company.address, comuna: company.comuna, city: company.city } });
    expect(JSON.stringify(result)).not.toContain('PRIVATE_PROVIDER_DATA');
    expect(JSON.stringify(result)).not.toContain('_raw');
  });

  it.each(['12345678-9', 'bad-rut', '123456785?token=secret', '1'.repeat(30)])('rejects invalid input before contacting the provider: %s', async value => {
    await expect(service.lookup(value, 'browser')).rejects.toThrow(BadRequestException);
    expect(provider.consultaRut).not.toHaveBeenCalled();
  });

  it('normalizes equivalent RUTs, caches results and refreshes after expiration', async () => {
    await service.lookup(rut, 'browser');
    await service.lookup('123456785', 'browser');
    expect(provider.consultaRut).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(300001);
    await service.lookup(rut, 'browser');
    expect(provider.consultaRut).toHaveBeenCalledTimes(2);
  });

  it('shares simultaneous requests for the same company', async () => {
    let release!: (value: unknown) => void;
    provider.consultaRut.mockImplementation(() => new Promise(resolve => { release = resolve; }));
    const first = service.lookup(rut, 'one');
    const second = service.lookup('123456785', 'two');
    expect(provider.consultaRut).toHaveBeenCalledTimes(1);
    release({ success: true, data: company });
    expect(await first).toEqual(await second);
  });

  it.each(['missing', 'error', 'empty'])('allows manual completion without exposing provider details (%s)', async kind => {
    if (kind === 'error') provider.consultaRut.mockRejectedValue(new Error('PRIVATE_PROVIDER_TOKEN'));
    else provider.consultaRut.mockResolvedValue(kind === 'empty' ? { success: true, data: {} } : { success: false, error: 'PRIVATE_PROVIDER_TOKEN' });
    const result = await service.lookup(rut, 'browser');
    expect(result.success).toBe(false);
    expect(result.message).toContain('manualmente');
    expect(JSON.stringify(result)).not.toContain('PRIVATE_PROVIDER_TOKEN');
  });

  it('bounds lookup text and does not stringify upstream objects', async () => {
    provider.consultaRut.mockResolvedValue({ success: true, data: { ...company, reasonSocial: 'x'.repeat(1000), giro: { private: true }, address: 'y'.repeat(1000) } });
    const result = await service.lookup(rut, 'browser');
    expect(result.data?.reasonSocial).toHaveLength(150);
    expect(result.data?.giro).toBe('');
    expect(result.data?.address).toHaveLength(300);
  });

  it('limits repeated requests and allows requests again after the window', async () => {
    for (let i = 0; i < 20; i++) await service.lookup(rut, 'browser');
    await expect(service.lookup(rut, 'browser')).rejects.toThrow(HttpException);
    expect(provider.consultaRut).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(60001);
    await expect(service.lookup(rut, 'browser')).resolves.toHaveProperty('success', true);
  });

  it('limits total provider queries across clients', async () => {
    for (let i = 0; i < 60; i++) await service.lookup(fixtureRut(50000000 + i), 'browser-' + i);
    await expect(service.lookup(fixtureRut(50000100), 'another-browser')).rejects.toThrow(HttpException);
    expect(provider.consultaRut).toHaveBeenCalledTimes(60);
  });
});
