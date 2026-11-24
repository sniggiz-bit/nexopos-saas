import { spawn } from 'child_process';
export class ThermalPrintError extends Error {}
export interface ThermalPrintOptions { format: '58mm' | '80mm'; columns80: 42 | 48; cutPaper: boolean }
export function thermalPrintOptions(format = '80mm', columns = '48', cut = '1'): ThermalPrintOptions {
  if (!['58mm', '80mm'].includes(format) || !['42', '48'].includes(columns) || !['0', '1'].includes(cut)) throw new ThermalPrintError('La impresión directa requiere 58mm u 80mm, 42/48 columnas y una opción de corte válida.');
  return { format: format as '58mm' | '80mm', columns80: Number(columns) as 42 | 48, cutPaper: cut === '1' };
}
let active = 0;
const waiting: Array<() => void> = [];
async function acquire() {
  if (active < 2) { active++; return; }
  if (waiting.length >= 16) throw new ThermalPrintError('La preparación de impresión está ocupada. La venta está guardada; vuelve a intentar la reimpresión.');
  await new Promise<void>(resolve => waiting.push(resolve));
}
function release() { const next = waiting.shift(); if (next) next(); else active--; }
/** Renders our own verified PDF in memory. No remote PDF, file path or shell input. */
async function monochromePdf(pdf: Buffer): Promise<Buffer> {
  if (pdf.length > 8 * 1024 * 1024 || pdf.subarray(0, 5).toString() !== '%PDF-') throw new ThermalPrintError('No se recibió una boleta válida para imprimir.');
  await acquire();
  try {
    return await new Promise<Buffer>((resolve, reject) => {
      const child = spawn('pdftoppm', ['-r', '203', '-gray', '-aa', 'no', '-aaVector', 'no', '-singlefile', '-f', '1', '-l', '1', '-'], { stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true });
      const chunks: Buffer[] = []; let size = 0; let failed = false;
      const timer = setTimeout(() => { failed = true; child.kill(); }, 15000);
      child.stdout.on('data', (chunk: Buffer) => { size += chunk.length; if (size > 8 * 1024 * 1024) { failed = true; child.kill(); } else chunks.push(chunk); });
      child.stderr.resume(); // Do not expose document contents or local runtime paths.
      child.stdin.on('error', () => { failed = true; });
      child.on('error', () => { clearTimeout(timer); reject(new ThermalPrintError('No se pudo preparar la boleta para impresión directa. La venta está guardada.')); });
      child.on('close', code => { clearTimeout(timer); if (failed || code !== 0) reject(new ThermalPrintError('No se pudo preparar la boleta para impresión directa. La venta está guardada.')); else resolve(Buffer.concat(chunks)); });
      child.stdin.end(pdf);
    });
  } finally { release(); }
}
export function readPbm(buffer: Buffer): { width: number; height: number; pixels: Buffer } {
  let offset = 0;
  const token = () => {
    while (offset < buffer.length) {
      if (buffer[offset] === 35) { while (offset < buffer.length && buffer[offset] !== 10) offset++; }
      else if ([9, 10, 13, 32].includes(buffer[offset])) offset++;
      else break;
    }
    const start = offset;
    while (offset < buffer.length && ![9, 10, 13, 32].includes(buffer[offset])) offset++;
    return buffer.subarray(start, offset).toString('ascii');
  };
  const encoding = token();
  if (encoding !== 'P4' && encoding !== 'P5') throw new ThermalPrintError('No se pudo leer la imagen imprimible de la boleta.');
  const width = Number(token()), height = Number(token());
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 100 || width > 1000 || height < 1 || height > 40000) throw new ThermalPrintError('La boleta excede el tamaño de impresión directa.');
  if (encoding === 'P5' && token() !== '255') throw new ThermalPrintError('Imagen de impresión no válida.');
  if (buffer[offset] === 13 && buffer[offset + 1] === 10) offset += 2;
  else if ([9, 10, 13, 32].includes(buffer[offset])) offset++;
  else throw new ThermalPrintError('Imagen de impresión incompleta.');
  const length = (encoding === 'P5' ? width : Math.ceil(width / 8)) * height;
  if (buffer.length - offset !== length) throw new ThermalPrintError('Imagen de impresión incompleta.');
  if (encoding === 'P5') {
    // Threshold once, avoiding monochrome error-diffusion noise inside stamp bars.
    const stride = Math.ceil(width / 8), pixels = Buffer.alloc(stride * height);
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) if (buffer[offset + y * width + x] < 128) pixels[y * stride + (x >> 3)] |= 0x80 >> (x & 7);
    return { width, height, pixels };
  }
  return { width, height, pixels: buffer.subarray(offset) };
}
/** The PDF is rendered at the exact head width: crop only, never rescale stamp modules. */
export function rasterEscPos(image: ReturnType<typeof readPbm>, options: ThermalPrintOptions): { data: Buffer; widthDots: number; heightDots: number; format: '58mm' | '80mm' } {
  const margin = 20; // Exact twenty-dot margin in the thermal PDF profile.
  const sourceHeight = image.height - margin * 2;
  const width = options.format === '58mm' ? 384 : options.columns80 * 12;
  const sourceWidth = image.width - margin * 2;
  if (Math.abs(sourceWidth - width) > 2 || sourceHeight <= 0) throw new ThermalPrintError('Imagen de impresión incompleta.');
  const height = sourceHeight, stride = Math.ceil(width / 8), sourceStride = Math.ceil(image.width / 8);
  if (height > 35000) throw new ThermalPrintError('La boleta es demasiado extensa para impresión directa.');
  const bitmap = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    const sy = margin + y;
    for (let x = 0; x < width; x++) {
      const sx = margin + x;
      if (image.pixels[sy * sourceStride + (sx >> 3)] & (0x80 >> (sx & 7))) bitmap[y * stride + (x >> 3)] |= 0x80 >> (x & 7);
    }
  }
  const parts = [Buffer.from([0x1b, 0x40, 0x1d, 0x4c, 0, 0, 0x1d, 0x57, width & 255, width >> 8])];
  for (let y = 0; y < height; y += 256) {
    const rows = Math.min(256, height - y);
    parts.push(Buffer.from([0x1d, 0x76, 0x30, 0, stride & 255, stride >> 8, rows & 255, rows >> 8]), bitmap.subarray(y * stride, (y + rows) * stride));
  }
  parts.push(Buffer.from([10, 10, 10, 10]));
  if (options.cutPaper) parts.push(Buffer.from([0x1d, 0x56, 0x42, 0]));
  return { data: Buffer.concat(parts), widthDots: width, heightDots: height, format: options.format };
}
export async function boletaPrintData(pdf: Buffer, options: ThermalPrintOptions) { return rasterEscPos(readPbm(await monochromePdf(pdf)), options); }
