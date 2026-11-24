// Deterministic, uncompressed ZIP of reviewed source only. Never include local credentials.
const fs = require('node:fs');
const path = require('node:path');
const files = ['server.cjs', 'windows.ps1', 'install-windows.ps1', 'uninstall-windows.ps1', 'install.cmd', 'README.md'];
const table = Array.from({ length: 256 }, (_, n) => { for (let i = 0; i < 8; i++) n = n & 1 ? 0xedb88320 ^ n >>> 1 : n >>> 1; return n >>> 0; });
function crc(data) { let value = 0xffffffff; for (const byte of data) value = table[(value ^ byte) & 255] ^ value >>> 8; return (value ^ 0xffffffff) >>> 0; }
const local = [], central = []; let offset = 0;
for (const name of files) {
  const filename = Buffer.from(name); const data = fs.readFileSync(path.join(__dirname, name)); const checksum = crc(data);
  const header = Buffer.alloc(30); header.writeUInt32LE(0x04034b50); header.writeUInt16LE(20, 4); header.writeUInt16LE(33, 12); header.writeUInt32LE(checksum, 14); header.writeUInt32LE(data.length, 18); header.writeUInt32LE(data.length, 22); header.writeUInt16LE(filename.length, 26);
  local.push(header, filename, data);
  const entry = Buffer.alloc(46); entry.writeUInt32LE(0x02014b50); entry.writeUInt16LE(20, 4); entry.writeUInt16LE(20, 6); entry.writeUInt16LE(33, 14); entry.writeUInt32LE(checksum, 16); entry.writeUInt32LE(data.length, 20); entry.writeUInt32LE(data.length, 24); entry.writeUInt16LE(filename.length, 28); entry.writeUInt32LE(offset, 42);
  central.push(entry, filename); offset += header.length + filename.length + data.length;
}
const directory = Buffer.concat(central), end = Buffer.alloc(22); end.writeUInt32LE(0x06054b50); end.writeUInt16LE(files.length, 8); end.writeUInt16LE(files.length, 10); end.writeUInt32LE(directory.length, 12); end.writeUInt32LE(offset, 16);
const target = process.argv[2] || path.resolve(__dirname, '../web/public/downloads/nexopos-print-windows.zip');
fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, Buffer.concat([...local, directory, end]));
console.log('Packaged NexoPOS Windows print connector: ' + files.length + ' source files');
