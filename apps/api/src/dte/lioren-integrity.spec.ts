import axios from 'axios';
import { LiorenApiError, LiorenApiService, chileDate, chileMonth } from './lioren-api.service';
import { LiorenAccountService } from './lioren-account.service';
import { LiorenService } from './lioren.service';
import { DteConfigService } from '../dte-config/dte-config.service';
import { DteConfigController } from '../dte-config/dte-config.controller';
import { DteService } from './dte.service';
jest.mock('axios');
const http = axios as jest.Mocked<typeof axios>;
const token = 'fixture-lioren-key-never-real';
const company = { rut: '76000000-0', name: 'Empresa ficticia', resolution: '80', resolutionDate: '2020-01-01', validFrom: '2020-01-01', validTo: '2099-01-01' };
function fixture() {
  const tenant: any = { id: 'tenant-a', rut: company.rut, status: 'ACTIVE', billingStatus: 'ACTIVE', settings: { enableBoletaDte: true }, dteConfig: { id: 'config-a', tenantId: 'tenant-a', liorenToken: token, dteResolution: '80', resolutionDate: new Date('2020-01-01'), updatedAt: new Date('2026-01-01') } };
  const db: any = { tenant: { findUnique: jest.fn(async () => tenant), update: jest.fn() }, module: { findMany: jest.fn(async () => []) }, dteConfig: { findUnique: jest.fn(async () => tenant.dteConfig), findFirst: jest.fn(async () => null), upsert: jest.fn(async () => tenant.dteConfig), update: jest.fn() }, systemLog: { create: jest.fn() }, $queryRawUnsafe: jest.fn(), $transaction: jest.fn(async fn => fn(db)) };
  const api: any = { company: jest.fn(async () => company), types: jest.fn(async () => [{ type: 39, label: 'Boleta', providerActive: true, available: 10, nextFolio: 123 }]) };
  return { tenant, db, api, account: new LiorenAccountService(db, api) };
}
describe('Lioren contract and isolation', () => {
  beforeEach(() => jest.clearAllMocks());
  it('disconnects only the authenticated tenant and retains issuer settings and history', async () => {
    const f = fixture(); const service = new DteConfigService(f.db, f.account, f.api);
    f.tenant.dteConfig.liorenLogo = '/uploads/logo.png';
    await f.account.status('tenant-a');
    f.db.dteConfig.update.mockImplementation(async ({ data }) => Object.assign(f.tenant.dteConfig, data));
    const result = await service.disconnect('tenant-a', 'admin');
    expect(result).toMatchObject({ hasToken: false, liorenLogo: '/uploads/logo.png', dteResolution: '80' });
    expect(f.db.dteConfig.update).toHaveBeenCalledWith({ where: { tenantId: 'tenant-a' }, data: { liorenToken: null } });
    expect(f.db.$queryRawUnsafe).toHaveBeenCalledWith(expect.stringContaining('FOR UPDATE'), 'tenant-a');
    expect(f.db.tenant.update).not.toHaveBeenCalled();
    expect(JSON.stringify(result) + JSON.stringify(f.db.systemLog.create.mock.calls)).not.toContain(token);
    f.api.company.mockClear(); f.api.types.mockClear();
    expect(await f.account.status('tenant-a')).toMatchObject({ configured: false, connected: false, company: null });
    expect(await service.salesMode('tenant-a')).toEqual({ mode: 'internal' });
    await service.disconnect('tenant-a', 'admin');
    expect(f.db.dteConfig.update).toHaveBeenCalledTimes(1);
    expect(f.api.company).not.toHaveBeenCalled(); expect(f.api.types).not.toHaveBeenCalled();
  });
  it('rejects non-admin disconnection and derives the tenant exclusively from the user', async () => {
    const config = { disconnect: jest.fn() }; const f = fixture();
    const controller = new DteConfigController(config as any, f.account, {} as any);
    for (const role of ['CASHIER', 'MANAGER']) expect(() => controller.disconnect({ role, tenantId: 'tenant-b' })).toThrow('administrador');
    expect(config.disconnect).not.toHaveBeenCalled();
    controller.disconnect({ id: 'admin', tenantId: 'tenant-a', role: 'TENANT_ADMIN' });
    expect(config.disconnect).toHaveBeenCalledWith('tenant-a', 'admin');
  });
  it('never sends an internal receipt to Lioren even after reconnecting', async () => {
    const provider: any = { emitirBoleta: jest.fn() };
    const db: any = { sale: { findUnique: jest.fn(async () => ({ dteType: 0, tenant: { status: 'ACTIVE' } })) } };
    expect(await new DteService(provider, db).emitirDte('internal-sale')).toEqual({ success: true, status: 'INTERNO' });
    expect(provider.emitirBoleta).not.toHaveBeenCalled();
  });
  it('uses Chile calendar at UTC month boundary', () => { expect(chileDate(new Date('2026-12-01T01:00:00Z'))).toBe('2026-11-30'); expect(chileMonth(new Date('2026-12-01T01:00:00Z'))).toEqual({ from: '2026-11-01', to: '2026-11-30', label: '2026-11' }); });
  it('reads available and NEXT folio from tipodocs, never inferring a last folio', async () => {
    http.get.mockResolvedValueOnce({ data: { tipodocs: [{ codigosii: '39', folios: { disponibles: 100, siguiente: 16008 } }] } });
    const types = await new LiorenApiService().types(token);
    expect(types[0]).toMatchObject({ available: 100, nextFolio: 16008 }); expect(types[1]).toMatchObject({ providerActive: false, available: null, nextFolio: null });
  });
  it('preserves confirmed zero but rejects malformed counters', async () => {
    http.get.mockResolvedValueOnce({ data: [{ codigosii: '39', folios: { disponibles: 0, siguiente: 0 } }, { codigosii: '33', folios: { disponibles: 'invalid', siguiente: null } }] });
    const types = await new LiorenApiService().types(token); expect(types[0].available).toBe(0); expect(types[0].nextFolio).toBeNull(); expect(types[1].available).toBeNull();
  });
  it('does not follow redirects with a bearer token', async () => {
    http.get.mockResolvedValueOnce({ data: company }); await new LiorenApiService().get(token, 'miempresa');
    expect(http.get.mock.calls[0][1]).toMatchObject({ maxRedirects: 0, timeout: 8000 });
  });
  it('uses a persisted idempotency key and decodes duplicate success', async () => {
    http.post.mockRejectedValueOnce({ response: { status: 409, data: { original_status: 201, original_response: { id: 1, folio: 10 } } } });
    const api = new LiorenApiService(); expect(await api.issue(token, 39, {}, '12345678-1234-1234-1234-123456789012')).toEqual({ id: 1, folio: 10 });
    expect(http.post.mock.calls[0][2]?.headers).toMatchObject({ 'X-Idempotency-Check': '12345678-1234-1234-1234-123456789012' });
  });
  it('does not expose a provider error body or token', async () => {
    http.get.mockRejectedValueOnce({ response: { status: 401, data: { token } }, config: { headers: { Authorization: token } } });
    try { await new LiorenApiService().get(token, 'miempresa'); throw Error('Expected failure'); } catch (error) { expect(error).toBeInstanceOf(LiorenApiError); expect(String(error)).not.toContain(token); }
  });
  it('marks network loss as an uncertain emission', async () => { http.post.mockRejectedValueOnce(new Error(token)); await expect(new LiorenApiService().issue(token, 39, {}, 'fixture')).rejects.toMatchObject({ uncertain: true }); });
  it('decodes only actual base64 PDF documents', () => {
    const api = new LiorenApiService(); expect(api.pdfBuffer(Buffer.from('%PDF-1.4 fixture').toString('base64')).toString()).toContain('%PDF-');
    expect(() => api.pdfBuffer('https://example.invalid/document')).toThrow(); expect(() => api.pdfBuffer(Buffer.from('<html>fake</html>').toString('base64'))).toThrow();
  });
  it.each(['', 'TEST_TOKEN_fixture', 'YOUR_TOKEN'])('never invents folios for missing or placeholder token %s', async bad => {
    const f = fixture(); f.tenant.dteConfig.liorenToken = bad; const status = await f.account.status('tenant-a');
    expect(status.types.every(type => type.available === null && !type.ready)).toBe(true); expect(f.api.company).not.toHaveBeenCalled();
  });
  it('blocks emission when provider identity differs', async () => { const f = fixture(); f.tenant.rut = '11111111-1'; await expect(f.account.requireEmission('tenant-a', 39)).rejects.toThrow('RUT'); });
  it('blocks expired certificate without replacing the real folio information', async () => { const f = fixture(); f.api.company.mockResolvedValue({ ...company, validTo: '2020-02-01' }); const status = await f.account.status('tenant-a'); expect(status.types[0].available).toBe(10); expect(status.types[0].ready).toBe(false); expect(status.state).toBe('certificate_invalid'); });
  it('rejects synchronization if the provider company changed', async () => { const f = fixture(); await expect(f.account.syncIssuer('tenant-a', '11111111-1', 'admin')).rejects.toThrow('cambió'); expect(f.db.tenant.update).not.toHaveBeenCalled(); });
  it('synchronizes only issuer RUT and resolution in one transaction', async () => { const f = fixture(); await f.account.syncIssuer('tenant-a', company.rut, 'admin'); expect(f.db.tenant.update).toHaveBeenCalledWith({ where: { id: 'tenant-a' }, data: { rut: company.rut } }); expect(f.db.dteConfig.update).toHaveBeenCalledWith(expect.objectContaining({ where: { tenantId: 'tenant-a' }, data: { dteResolution: '80', resolutionDate: new Date('2020-01-01') } })); });
  it('returns configuration without the saved secret', async () => { const f = fixture(); const service = new DteConfigService(f.db, f.account, f.api); const response = await service.findByTenant('tenant-a'); expect(response?.hasToken).toBe(true); expect(JSON.stringify(response)).not.toContain(token); });
  it('rejects a foreign configuration id before any update', async () => { const f = fixture(); await expect(new DteConfigService(f.db, f.account, f.api).update('other-id', 'tenant-a', { liorenLogo: 'x' })).rejects.toThrow('esta empresa'); expect(f.db.dteConfig.upsert).not.toHaveBeenCalled(); });
  it('preserves the saved credential when a new token is invalid', async () => { const f = fixture(); await expect(new DteConfigService(f.db, f.account, f.api).upsert({ tenantId: 'tenant-a', liorenToken: 'TEST_TOKEN' })).rejects.toThrow('credencial real'); expect(f.db.dteConfig.upsert).not.toHaveBeenCalled(); });
  it('rejects configuration access for cashiers and managers', () => { const f = fixture(); const controller = new DteConfigController({} as any, f.account, {} as any); for (const role of ['CASHIER', 'MANAGER']) expect(() => controller.find({ role, tenantId: 'tenant-a' })).toThrow('administrador'); });
  it('does not emit a legacy error or historical unverified folio', async () => {
    const db: any = { sale: { findUnique: jest.fn(async () => ({ id: 'sale', dteType: 39, dteStatus: 'ERROR' })) } };
    const api: any = { issue: jest.fn() }; const service = new LiorenService(db, api, {} as any);
    expect((await service.emitirBoleta('sale')).success).toBe(false); expect(api.issue).not.toHaveBeenCalled();
    db.sale.findUnique.mockResolvedValueOnce({ dteType: 39, dteFolio: 80000, dteStatus: 'ACEPTADO', dtePdfUrl: 'ejemplo-mock' });
    expect((await service.emitirBoleta('sale')).success).toBe(false); expect(api.issue).not.toHaveBeenCalled();
  });
  it('distinguishes a real monthly zero from an unavailable provider query', async () => {
    const f = fixture(); f.db.sale = { count: jest.fn(async () => 0), findMany: jest.fn(async () => []) };
    f.api.index = jest.fn(async () => ({ total: 0, rows: [] }));
    const first = await new DteConfigService(f.db, f.account, f.api).getStats('tenant-a');
    expect(first.provider.total).toBe(0); expect(first.provider.partial).toBe(false);
    f.api.index.mockImplementation(async (_token: string, type: number) => { if (type === 33) throw new LiorenApiError(503); return { total: 0, rows: [] }; });
    const partial = await new DteConfigService(f.db, f.account, f.api).getStats('tenant-a');
    expect(partial.provider.total).toBeNull(); expect(partial.provider.partial).toBe(true); expect(partial.provider.types[0].total).toBe(0);
  });
  it('keeps the previous token when the provider rejects a replacement', async () => {
    const f = fixture(); f.api.company.mockRejectedValueOnce(new LiorenApiError(401));
    await expect(new DteConfigService(f.db, f.account, f.api).upsert({ tenantId: 'tenant-a', liorenToken: 'rejected-fixture-credential' })).rejects.toThrow('Se conserva');
    expect(f.db.dteConfig.upsert).not.toHaveBeenCalled();
  });

});
