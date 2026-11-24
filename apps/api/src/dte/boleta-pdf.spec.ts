import { verify } from 'crypto';
import { BoletaRepresentationError, boletaPrintFormat, readIssuedBoleta } from './boleta-pdf';
import { LiorenService } from './lioren.service';
import { LiorenApiService } from './lioren-api.service';
const { issuedBoleta } = require('../../scripts/fixtures/issued-boleta.cjs');
describe('NexoPOS issued boleta representation', () => {
  it('preserves every Latin-1 byte and signed entity in the original TED', () => {
    const f = issuedBoleta(); const boleta = readIssuedBoleta(f.document, f.expected);
    expect(boleta.ted).toEqual(f.ted); expect(boleta.items[0].name).toBe('Café & té');
    const signature = boleta.ted.toString('latin1').match(/<FRMT[^>]*>([^<]+)<\/FRMT>/)![1];
    expect(verify('RSA-SHA1', f.dd, f.key.publicKey, Buffer.from(signature, 'base64'))).toBe(true);
  });
  it.each(['providerId', 'folio', 'issuerRut', 'total'])('rejects another document: %s', field => {
    const f = issuedBoleta(); const wrong = { ...f.expected, [field]: field === 'folio' || field === 'total' ? 1 : 'other' };
    expect(() => readIssuedBoleta(f.document, wrong)).toThrow(BoletaRepresentationError);
  });
  it.each([
    (xml: string) => xml.replace(/<TED[\s\S]*<\/TED>/, ''),
    (xml: string) => xml.replace('<MNT>1000</MNT>', '<MNT>2000</MNT>'),
    (xml: string) => xml.replace('<H>16999</H>', '<H>16001</H>'),
    (xml: string) => xml.replace('<IT1>Café &amp; té</IT1>', '<IT1>Otro producto</IT1>'),
    (xml: string) => xml.replace('<DTE ', '<!DOCTYPE DTE [<!ENTITY e SYSTEM "file:///etc/passwd">]><DTE '),
    (xml: string) => xml.replace('</Documento>', '<TED version="1.0"></TED></Documento>'),
  ])('refuses incomplete, inconsistent or unsafe XML without inventing a stamp', change => {
    const f = issuedBoleta(); f.document.xml = Buffer.from(change(f.xml), 'latin1').toString('base64');
    expect(() => readIssuedBoleta(f.document, f.expected)).toThrow(BoletaRepresentationError);
  });
  it('accepts only supported print formats', () => {
    expect(boletaPrintFormat()).toBe('80mm'); for (const format of ['58mm', '80mm', 'A4']) expect(boletaPrintFormat(format)).toBe(format);
    expect(() => boletaPrintFormat('https://example.invalid')).toThrow();
  });
  function serviceFixture() {
    const f = issuedBoleta(); const sale = { id: 'sale', tenantId: 'a', branchId: 'branch-a', dteType: 39, dteVerifiedAt: new Date(), dteProviderId: f.expected.providerId, dteFolio: 16608, dteIssuerRut: '760000000', total: 1000 };
    const db: any = { sale: { findFirst: jest.fn(async ({ where }) => where.tenantId === sale.tenantId ? sale : null), update: jest.fn() } };
    const api: any = { document: jest.fn(async () => f.document), issue: jest.fn() };
    const connection = { token: 'fixture-only', tenant: { name: 'NexoPOS Pruebas' }, config: {}, status: { connected: true, identityMatches: true, company: { rut: '76000000-0', resolution: '99', resolutionDate: '2014-10-21' } } };
    const account: any = { connection: jest.fn(async () => connection), requireEmission: jest.fn() };
    return { f, sale, db, api, account, connection, service: new LiorenService(db, api, account) };
  }
  it('renders an existing boleta using only the XML GET, never another emission or DB write', async () => {
    const f = serviceFixture(); const buffer = await f.service.salePdf('sale', { tenantId: 'a', role: 'TENANT_ADMIN' }, '80mm');
    expect(buffer.subarray(0, 5).toString()).toBe('%PDF-'); expect(f.api.document).toHaveBeenCalledWith('fixture-only', 39, 16608, 'xml');
    expect(f.api.issue).not.toHaveBeenCalled(); expect(f.db.sale.update).not.toHaveBeenCalled(); expect(f.account.requireEmission).not.toHaveBeenCalled();
  });
  it('isolates tenants, branches and the original issuer before retrieving XML', async () => {
    const f = serviceFixture();
    await expect(f.service.salePdf('sale', { tenantId: 'b' })).rejects.toThrow('no encontrado');
    await expect(f.service.salePdf('sale', { tenantId: 'a', role: 'CASHIER', branchId: 'branch-b' })).rejects.toThrow('sucursal');
    f.connection.status.company.rut = '11111111-1';
    await expect(f.service.salePdf('sale', { tenantId: 'a' })).rejects.toThrow('emisor'); expect(f.api.document).not.toHaveBeenCalled();
  });
  it('prepares a private thermal job from an already issued boleta without emitting again', async () => {
    const f = serviceFixture(); const job = await f.service.salePrintData('sale', { tenantId: 'a', role: 'TENANT_ADMIN' }, '80mm', '42', '0');
    expect(job.widthDots).toBe(504); expect(job.data.subarray(0, 2)).toEqual(Buffer.from([27, 64]));
    expect(f.api.document).toHaveBeenCalledWith('fixture-only', 39, 16608, 'xml');
    expect(f.api.issue).not.toHaveBeenCalled(); expect(f.db.sale.update).not.toHaveBeenCalled(); expect(f.account.requireEmission).not.toHaveBeenCalled();
  });
  it('rejects invalid formats, other tenants, branches and non-boletas before a thermal job', async () => {
    const f = serviceFixture();
    await expect(f.service.salePrintData('sale', { tenantId: 'a' }, 'A4')).rejects.toThrow('58mm');
    await expect(f.service.salePrintData('sale', { tenantId: 'b' })).rejects.toThrow('no encontrado');
    await expect(f.service.salePrintData('sale', { tenantId: 'a', role: 'CASHIER', branchId: 'b' })).rejects.toThrow('sucursal');
    f.sale.dteType = 33;
    await expect(f.service.salePrintData('sale', { tenantId: 'a' })).rejects.toThrow('boletas');
    expect(f.api.document).not.toHaveBeenCalled();
  });
  it('requests signed XML through the documented consultation endpoint', async () => {
    const f = issuedBoleta(); const api = new LiorenApiService(); jest.spyOn(api, 'get').mockResolvedValue(f.document);
    await api.document('fixture-only', 39, 16608, 'xml'); expect(api.get).toHaveBeenCalledWith('fixture-only', 'boletas', { tipodoc: 39, folio: 16608, expects: 'xml' });
  });
});
