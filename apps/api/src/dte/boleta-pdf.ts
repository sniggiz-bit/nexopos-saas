import { XMLParser, XMLValidator } from 'fast-xml-parser';
import bwipjs = require('bwip-js');
import PDFDocument = require('pdfkit');

export type BoletaPrintFormat = '58mm' | '80mm' | 'A4';
export interface IssuedBoletaExpectation { folio: number; issuerRut: string; providerId: string; total: number }
export interface IssuedBoleta {
  folio: number; date: string; ted: Buffer;
  issuer: { rut: string; name: string; giro: string; address: string; comuna: string; city: string };
  receiver: { rut: string; name: string };
  items: Array<{ name: string; quantity: number | null; unit: string; price: number | null; amount: number; discount: number }>;
  adjustments: Array<{ label: string; value: number; percent: boolean }>;
  net: number | null; exempt: number | null; tax: number | null; total: number;
}
export class BoletaRepresentationError extends Error {}
const fail = (): never => { throw new BoletaRepresentationError('No se pudo validar el XML y el timbre de la boleta emitida. El documento no se volverá a emitir.'); };
const rut = (value: string) => value.replace(/[^0-9kK]/g, '').toUpperCase();
const text = (value: any): string => typeof value === 'string' || typeof value === 'number' ? String(value).trim() : value && typeof value['#text'] === 'string' ? value['#text'].trim() : '';
const list = (value: any): any[] => value == null ? [] : Array.isArray(value) ? value : [value];
function number(value: any, optional = false): number | null {
  const raw = text(value);
  if (!raw && optional) return null;
  if (!/^\d+(?:\.\d+)?$/.test(raw)) return fail();
  const result = Number(raw);
  if (!Number.isFinite(result) || result < 0 || result > Number.MAX_SAFE_INTEGER) return fail();
  return result;
}
export function boletaPrintFormat(value?: string): BoletaPrintFormat {
  if (value === undefined || value === '') return '80mm';
  if (value === '58mm' || value === '80mm' || value === 'A4') return value;
  throw new BoletaRepresentationError('Elige formato de boleta 58mm, 80mm o A4.');
}

/** Reads the issued XML without rebuilding or signing its TED. */
export function readIssuedBoleta(document: any, expected: IssuedBoletaExpectation): IssuedBoleta {
  if (String(document?.id) !== expected.providerId || Number(document?.tipodoc) !== 39 || Number(document?.folio) !== expected.folio) return fail();
  const value = document?.xml;
  if (typeof value !== 'string' || !value || value.length > 3 * 1024 * 1024) return fail();
  let bytes: Buffer;
  const plaintext = value.trimStart().startsWith('<');
  if (plaintext) bytes = Buffer.from(value, 'utf8');
  else {
    if (!/^[A-Za-z0-9+/=\r\n]+$/.test(value)) return fail();
    bytes = Buffer.from(value, 'base64');
  }
  if (!bytes.length || bytes.length > 2 * 1024 * 1024) return fail();
  const declaration = bytes.subarray(0, 180).toString('ascii');
  const encoding: BufferEncoding = /encoding\s*=\s*['"](?:ISO-8859-1|latin1)['"]/i.test(declaration) ? 'latin1' : 'utf8';
  const xml = plaintext ? value : bytes.toString(encoding);
  if (/<!DOCTYPE|<!ENTITY/i.test(xml) || XMLValidator.validate(xml) !== true) return fail();
  let parsed: any;
  try { parsed = new XMLParser({ ignoreAttributes: false, removeNSPrefix: true, parseTagValue: false, trimValues: false, maxNestedTags: 32 }).parse(xml); }
  catch { return fail(); }
  const documents: any[] = [];
  const visit = (node: any, depth = 0) => {
    if (depth > 32) return fail();
    if (!node || typeof node !== 'object') return;
    for (const [key, child] of Object.entries(node)) {
      if (key === 'Documento') documents.push(...list(child));
      else if (Array.isArray(child)) child.forEach(item => visit(item, depth + 1));
      else visit(child, depth + 1);
    }
  };
  visit(parsed);
  if (documents.length !== 1) return fail();
  const source = documents[0]; const header = source.Encabezado;
  const id = header?.IdDoc; const emisor = header?.Emisor; const receiver = header?.Receptor; const totals = header?.Totales;
  const tedMatches = [...xml.matchAll(/<((?:[A-Za-z_][\w.-]*:)?TED)\b[^>]*>[\s\S]*?<\/\1\s*>/g)];
  if (tedMatches.length !== 1 || Array.isArray(source.TED)) return fail();
  const ted = source.TED; const dd = ted?.DD; const caf = dd?.CAF; const da = caf?.DA;
  const total = number(totals?.MntTotal)!;
  const date = text(id?.FchEmis);
  const firstItem = list(source.Detalle)[0];
  if (Number(text(id?.TipoDTE)) !== 39 || Number(text(id?.Folio)) !== expected.folio || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date))) return fail();
  if (rut(text(emisor?.RUTEmisor)) !== rut(expected.issuerRut) || rut(text(dd?.RE)) !== rut(expected.issuerRut) || Number(text(dd?.TD)) !== 39 || Number(text(dd?.F)) !== expected.folio || text(dd?.FE) !== date) return fail();
  if (Number(text(dd?.MNT)) !== total || !Number.isFinite(Number(document?.montototal)) || Number(document.montototal) !== total || Math.abs(total - Math.round(expected.total)) > 1) return fail();
  if (!text(dd?.IT1) || !text(firstItem?.NmbItem).startsWith(text(dd.IT1)) || !text(dd?.RR) || text(receiver?.RUTRecep) && rut(text(receiver.RUTRecep)) !== rut(text(dd.RR))) return fail();
  if (!Number.isSafeInteger(number(da?.RNG?.D)) || !Number.isSafeInteger(number(da?.RNG?.H))) return fail();
  if (rut(text(da?.RE)) !== rut(expected.issuerRut) || Number(text(da?.TD)) !== 39 || expected.folio < Number(text(da?.RNG?.D)) || expected.folio > Number(text(da?.RNG?.H)) || !text(da?.RSAPK?.M) || !text(da?.RSAPK?.E)) return fail();
  for (const signature of [ted?.FRMT, caf?.FRMA]) {
    if (!/^[A-Za-z0-9+/=]{32,}$/.test(text(signature).replace(/\s/g, '')) || !/SHA1withRSA/i.test(text(signature?.['@_algoritmo']))) return fail();
  }
  const items = list(source.Detalle).map(item => {
    const name = text(item.NmbItem); if (!name || name.length > 500) return fail();
    const quantity = number(item.QtyItem, true); if (quantity !== null && quantity <= 0) return fail();
    return { name, quantity, unit: text(item.UnmdItem), price: number(item.PrcItem, true), amount: number(item.MontoItem)!, discount: number(item.DescuentoMonto, true) || 0 };
  });
  if (!items.length || items.length > 60 || !text(emisor?.RznSocEmisor || emisor?.RznSoc)) return fail();
  return {
    folio: expected.folio, date, ted: Buffer.from(tedMatches[0][0], encoding),
    issuer: { rut: text(emisor.RUTEmisor), name: text(emisor.RznSocEmisor || emisor.RznSoc), giro: text(emisor.GiroEmisor || emisor.GiroEmis), address: text(emisor.DirOrigen), comuna: text(emisor.CmnaOrigen), city: text(emisor.CiudadOrigen) },
    receiver: { rut: text(receiver?.RUTRecep), name: text(receiver?.RznSocRecep) }, items,
    adjustments: list(source.DscRcgGlobal).map(item => ({ label: text(item.GlosaDR) || (text(item.TpoMov) === 'D' ? 'Descuento global' : 'Recargo global'), value: number(item.ValorDR)!, percent: text(item.TpoValor) === '%' })),
    net: number(totals.MntNeto, true), exempt: number(totals.MntExe, true), tax: number(totals.IVA, true), total,
  };
}

export async function boletaStamp(boleta: IssuedBoleta, format: BoletaPrintFormat, printWidthDots?: number): Promise<Buffer> {
  const options: bwipjs.RenderOptions & { columns: number; eclevel: number } = { bcid: 'pdf417', text: boleta.ted.toString('latin1'), binarytext: true, columns: printWidthDots ? Math.floor((printWidthDots / 2 - 12 - 69) / 17) : format === '58mm' ? 10 : 12, eclevel: 5, scale: printWidthDots ? 2 : 3, padding: 3, backgroundcolor: 'FFFFFF' };
  try {
    if (printWidthDots === 384) {
      // Rotate the complete symbol on narrow heads rather than thinning its modules.
      // Preserve the original bytes, correction level and two-dot modules.
      for (let columns = 12; columns <= 30; columns++) {
        let image: Buffer;
        try { const rotated: typeof options = { ...options, columns, rotate: 'R' }; image = await bwipjs.toBuffer(rotated); } catch { continue; }
        if (image.readUInt32BE(16) <= printWidthDots && image.readUInt32BE(20) >= 360) return image;
      }
      throw new Error('Stamp does not fit');
    }
    return await bwipjs.toBuffer(options);
  } catch { throw new BoletaRepresentationError('No se pudo representar el timbre original en este formato. Prueba 80mm o A4; no se realizará otra emisión.'); }
}

export interface BoletaBranding { name?: string; logo?: Buffer; resolution: string; resolutionDate: string }
type Cell = { text: string; x: number; width: number; size: number; bold?: boolean; align?: 'left' | 'center' | 'right' };
type Block = { height: number; cells?: Cell[]; image?: { bytes: Buffer; width: number; height: number }; line?: boolean; gap?: number; keepHeight?: number };
const mm = (value: number) => value * 72 / 25.4;
const money = (value: number) => '$' + value.toLocaleString('es-CL', { maximumFractionDigits: 6 });
const displayRut = (value: string) => { const clean = rut(value); return clean.length < 2 ? value : clean.slice(0, -1).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + '-' + clean.slice(-1); };

/** NexoPOS representation of the existing boleta, with the unchanged issued TED. */
export async function renderBoletaPdf(boleta: IssuedBoleta, branding: BoletaBranding, format: BoletaPrintFormat, printWidthDots?: 384 | 504 | 576): Promise<Buffer> {
  const stamp = await boletaStamp(boleta, format, printWidthDots);
  const width = printWidthDots ? (printWidthDots + 40) * 72 / 203 : format === 'A4' ? 595.28 : mm(format === '58mm' ? 58 : 80);
  const margin = printWidthDots ? 20 * 72 / 203 : format === 'A4' ? 40 : mm(2.5); const inner = width - margin * 2;
  const measure = new PDFDocument({ size: 'A4', margin: 0 });
  const blocks: Block[] = [];
  const row = (cells: Cell[], gap = 3) => {
    const height = Math.max(...cells.map(cell => measure.font(cell.bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(cell.size).heightOfString(cell.text, { width: cell.width, lineGap: 1 })), 1);
    blocks.push({ height, cells, gap });
  };
  const centered = (value: string, size = 8, bold = false, gap = 3) => { if (value) row([{ text: value, x: 0, width: inner, size, bold, align: 'center' }], gap); };
  const line = () => blocks.push({ height: 1, line: true, gap: 5 });
  if (branding.logo) {
    try {
      const image = (measure as any).openImage(branding.logo);
      if (image.width > 0 && image.height > 0 && image.width <= 4096 && image.height <= 4096) {
        const imageWidth = Math.min(mm(32), inner, image.width * 60 / image.height);
        blocks.push({ height: imageWidth * image.height / image.width, image: { bytes: branding.logo, width: imageWidth, height: imageWidth * image.height / image.width }, gap: 5 });
      }
    } catch { /* A missing or unsupported logo never changes fiscal data. */ }
  }
  if (branding.name && branding.name.toUpperCase() !== boleta.issuer.name.toUpperCase()) centered(branding.name, 13, true);
  centered(boleta.issuer.name, 10, true); centered('RUT: ' + displayRut(boleta.issuer.rut), 9, true);
  centered(boleta.issuer.giro); centered(boleta.issuer.address); centered([boleta.issuer.comuna, boleta.issuer.city].filter(Boolean).join(' - '));
  line(); centered('BOLETA ELECTRONICA', 11, true); centered('N.º ' + boleta.folio, 15, true, 5);
  centered('Fecha de emisión: ' + boleta.date.split('-').reverse().join('-')); line();
  if (boleta.receiver.rut && rut(boleta.receiver.rut) !== '666666666') {
    centered(boleta.receiver.name); centered('RUT receptor: ' + displayRut(boleta.receiver.rut)); line();
  }
  const amountWidth = format === 'A4' ? 95 : inner * 0.32;
  row([{ text: 'DETALLE', x: 0, width: inner - amountWidth, size: 8, bold: true }, { text: 'IMPORTE', x: inner - amountWidth, width: amountWidth, size: 8, bold: true, align: 'right' }], 5);
  for (const item of boleta.items) {
    const itemIndex = blocks.length;
    row([{ text: item.name, x: 0, width: inner - amountWidth - 3, size: 9, bold: true }, { text: money(item.amount), x: inner - amountWidth, width: amountWidth, size: 9, align: 'right' }], 1);
    const detail = [item.quantity === null ? '' : item.quantity.toLocaleString('es-CL', { maximumFractionDigits: 6 }) + (item.unit ? ' ' + item.unit : ''), item.price === null ? '' : 'x ' + money(item.price), item.discount ? 'Dcto. ' + money(item.discount) : ''].filter(Boolean).join(' ');
    if (detail) row([{ text: detail, x: 0, width: inner, size: 8 }], 5);
    blocks[itemIndex].keepHeight = blocks.slice(itemIndex).reduce((sum, block) => sum + block.height + (block.gap || 0), 0);
  }
  line();
  for (const item of boleta.adjustments) row([{ text: item.label, x: 0, width: inner - amountWidth, size: 8 }, { text: item.percent ? item.value + '%' : money(item.value), x: inner - amountWidth, width: amountWidth, size: 8, align: 'right' }]);
  for (const [label, value] of [['Neto', boleta.net], ['Exento', boleta.exempt], ['IVA', boleta.tax]] as Array<[string, number | null]>) {
    if (value !== null) row([{ text: label, x: 0, width: inner - amountWidth, size: 9 }, { text: money(value), x: inner - amountWidth, width: amountWidth, size: 9, align: 'right' }]);
  }
  line(); row([{ text: 'TOTAL', x: 0, width: inner - amountWidth, size: 13, bold: true }, { text: money(boleta.total), x: inner - amountWidth, width: amountWidth, size: 13, bold: true, align: 'right' }], 9);
  const stampWidth = printWidthDots ? stamp.readUInt32BE(16) * 72 / 203 : Math.min(inner, mm(72)); const stampHeight = stampWidth * stamp.readUInt32BE(20) / stamp.readUInt32BE(16);
  const stampIndex = blocks.length;
  const stampBlock: Block = { height: stampHeight, image: { bytes: stamp, width: stampWidth, height: stampHeight }, gap: 3 };
  blocks.push(stampBlock);
  centered('Timbre electrónico SII', 8, true);
  if (branding.resolution && branding.resolutionDate) centered('Res. N.º ' + branding.resolution + ' del ' + branding.resolutionDate.split('-').reverse().join('-'), 7);
  centered('Verifique documento en www.sii.cl', 7);
  stampBlock.keepHeight = blocks.slice(stampIndex).reduce((sum, block) => sum + block.height + (block.gap || 0), 0);
  line();
  centered('¡Gracias por su compra!', 9, true); centered('Documento generado por NexoPOS', 7, false, 0);
  measure.end();
  const contentHeight = blocks.reduce((sum, block) => sum + block.height + (block.gap || 0), 0);
  if (contentHeight > 12000) throw new BoletaRepresentationError('El contenido excede el tamaño imprimible. Utiliza el formato A4.');
  const doc = new PDFDocument({ size: format === 'A4' ? 'A4' : [width, contentHeight + margin * 2 + 5], margin, bufferPages: true, info: { Title: 'Boleta electrónica N.º ' + boleta.folio + ' - NexoPOS', Producer: 'NexoPOS', Creator: 'NexoPOS' } });
  const chunks: Buffer[] = [];
  const completed = new Promise<Buffer>((resolve, reject) => { doc.on('data', chunk => chunks.push(chunk)); doc.on('end', () => resolve(Buffer.concat(chunks))); doc.on('error', reject); });
  let y = margin;
  for (const block of blocks) {
    if (format === 'A4' && y + (block.keepHeight || block.height) > doc.page.height - margin - 15) {
      doc.addPage(); y = margin;
      doc.font('Helvetica-Bold').fontSize(9).text('BOLETA ELECTRONICA N.º ' + boleta.folio + ' - ' + boleta.issuer.name, margin, y, { width: inner }); y = doc.y + 9;
    }
    if (block.line) doc.moveTo(margin, y).lineTo(width - margin, y).lineWidth(0.5).stroke('#000000');
    if (block.image) {
      const alignDot = (value: number) => printWidthDots ? Math.round(value * 203 / 72) * 72 / 203 : value;
      doc.image(block.image.bytes, alignDot(margin + (inner - block.image.width) / 2), alignDot(y), { width: block.image.width, height: block.image.height });
    }
    for (const cell of block.cells || []) doc.font(cell.bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(cell.size).fillColor('#000000').text(cell.text, margin + cell.x, y, { width: cell.width, height: block.height + 1, lineGap: 1, align: cell.align || 'left' });
    y += block.height + (block.gap || 0);
  }
  if (format === 'A4') {
    const pages = doc.bufferedPageRange();
    for (let i = pages.start; i < pages.start + pages.count; i++) {
      doc.switchToPage(i); const bottom = doc.page.margins.bottom; doc.page.margins.bottom = 0;
      doc.font('Helvetica').fontSize(7).text('NexoPOS - Página ' + (i + 1) + ' de ' + pages.count, margin, doc.page.height - 24, { width: inner, align: 'right', lineBreak: false });
      doc.page.margins.bottom = bottom;
    }
  }
  doc.end();
  return completed;
}
