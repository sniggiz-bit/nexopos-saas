const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const { readBarcodes, prepareZXingModule } = require('zxing-wasm/reader');
const { readIssuedBoleta, renderBoletaPdf } = require('../dist/dte/boleta-pdf');
const { boletaPrintData, readPbm, thermalPrintOptions } = require('../dist/dte/thermal-raster');
const { issuedBoleta } = require('./fixtures/issued-boleta.cjs');
const table = Array.from({length:256}, (_, n) => { for (let i=0;i<8;i++) n = n & 1 ? 0xedb88320 ^ (n >>> 1) : n >>> 1; return n >>> 0; });
function crc(bytes) { let n=0xffffffff; for (const b of bytes) n=table[(n^b)&255]^(n>>>8); return (n^0xffffffff)>>>0; }
function chunk(type,data) { const name=Buffer.from(type); const header=Buffer.alloc(4);header.writeUInt32BE(data.length);const end=Buffer.alloc(4);end.writeUInt32BE(crc(Buffer.concat([name,data])));return Buffer.concat([header,name,data,end]); }
function png(width,height,bits) {
  const header=Buffer.alloc(13);header.writeUInt32BE(width);header.writeUInt32BE(height,4);header[8]=1;
  const stride=Math.ceil(width/8);const scan=Buffer.alloc((stride+1)*height);
  for(let y=0;y<height;y++)for(let x=0;x<stride;x++)scan[y*(stride+1)+1+x]=bits[y*stride+x]^255;
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',zlib.deflateSync(scan)),chunk('IEND',Buffer.alloc(0))]);
}
function decodeWire(data, expectedWidth, cut) {
  assert.deepEqual([...data.subarray(0,6)],[27,64,29,76,0,0]); assert.equal(data[6],29);assert.equal(data[7],87);assert.equal(data[8]+256*data[9],expectedWidth);
  let offset=10;let height=0;const stripes=[];
  while(data[offset]===29&&data[offset+1]===118) {
    assert.deepEqual([...data.subarray(offset,offset+4)],[29,118,48,0]);
    const stride=data[offset+4]+data[offset+5]*256,rows=data[offset+6]+data[offset+7]*256;
    assert.equal(stride*8,expectedWidth);assert(rows>0&&rows<=256);offset+=8;
    assert(offset+stride*rows<=data.length);stripes.push(data.subarray(offset,offset+stride*rows));offset+=stride*rows;height+=rows;
  }
  assert.deepEqual([...data.subarray(offset)],cut?[10,10,10,10,29,86,66,0]:[10,10,10,10]);
  return png(expectedWidth,height,Buffer.concat(stripes));
}
(async()=>{
  const output=process.env.BOLETA_OUTPUT||'/checks-results';fs.mkdirSync(output,{recursive:true});
  const wasm=fs.readFileSync(path.resolve(path.dirname(require.resolve('zxing-wasm/reader')),'../../reader/zxing_reader.wasm'));
  await prepareZXingModule({overrides:{wasmBinary:new Uint8Array(wasm)}});
  const branding={name:'Mi almacén de prueba',resolution:'99',resolutionDate:'2014-10-21'};
  const f=issuedBoleta();const boleta=readIssuedBoleta(f.document,f.expected);
  for(const [format,columns,cut] of [['58mm','48','0'],['80mm','48','1'],['80mm','42','0']]) {
    const options=thermalPrintOptions(format,columns,cut); const pdf=await renderBoletaPdf(boleta,branding,format,format==='58mm'?384:Number(columns)*12);
    const result=await boletaPrintData(pdf,options);const expectedWidth=format==='58mm'?384:Number(columns)*12;
    assert.equal(result.widthDots,expectedWidth);const image=decodeWire(result.data,expectedWidth,cut==='1');
    fs.writeFileSync(path.join(output,'silent-boleta-'+format+'-'+columns+'.png'),image);
    const codes=await readBarcodes(image,{formats:['PDF417'],tryHarder:true,maxNumberOfSymbols:1});
    assert.equal(codes.length,1,'Original stamp must be readable from the actual ESC/POS raster: '+format+' '+columns);
    assert.deepEqual(Buffer.from(codes[0].bytes),f.ted,'The silent print must contain the unchanged original TED');
    console.log('PASS silent boleta '+format+' '+columns+' columns: '+result.widthDots+' dots, signed TED decoded byte-for-byte, '+result.data.length+' bytes');
  }
  const source=Buffer.concat([Buffer.from('P4\n128 64\n'),Buffer.alloc(16*64,32)]);assert.equal(readPbm(source).pixels[0],32);
  assert.throws(()=>thermalPrintOptions('A4'));assert.throws(()=>thermalPrintOptions('80mm','99'));assert.throws(()=>readPbm(Buffer.from('P4\n128 64\n')));
})().catch(error=>{console.error(error);process.exitCode=1;});
