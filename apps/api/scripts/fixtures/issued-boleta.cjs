// Fictitious signed XML for rendering checks; never submitted to a fiscal service.
const { generateKeyPairSync, sign } = require('node:crypto');
const key = generateKeyPairSync('rsa', { modulusLength: 1024 });
const jwk = key.publicKey.export({ format: 'jwk' });
const b64 = value => Buffer.from(value, 'base64url').toString('base64');
const signature = value => sign('RSA-SHA1', Buffer.from(value, 'latin1'), key.privateKey).toString('base64');
function issuedBoleta(count = 1) {
  const total = count * 1000;
  const da = '<DA><RE>76000000-0</RE><RS>Almacén de Prueba</RS><TD>39</TD><RNG><D>16000</D><H>16999</H></RNG><FA>2026-01-01</FA><RSAPK><M>' + b64(jwk.n) + '</M><E>' + b64(jwk.e) + '</E></RSAPK><IDK>100</IDK></DA>';
  const caf = '<CAF version="1.0">' + da + '<FRMA algoritmo="SHA1withRSA">' + signature(da) + '</FRMA></CAF>';
  const dd = '<DD><RE>76000000-0</RE><TD>39</TD><F>16608</F><FE>2026-11-23</FE><RR>66666666-6</RR><RSR>Consumidor final</RSR><MNT>' + total + '</MNT><IT1>Café &amp; té</IT1>' + caf + '<TSTED>2026-11-23T15:19:00</TSTED></DD>';
  const ted = '<TED version="1.0">' + dd + '<FRMT algoritmo="SHA1withRSA">' + signature(dd) + '</FRMT></TED>';
  const details = Array.from({ length: count }, (_, i) => '<Detalle><NroLinDet>' + (i + 1) + '</NroLinDet><NmbItem>' + (i ? 'Producto de prueba ' + (i + 1) + ' con descripción larga para comprobar el salto de página' : 'Café &amp; té') + '</NmbItem><QtyItem>1</QtyItem><UnmdItem>UN</UnmdItem><PrcItem>1000</PrcItem><MontoItem>1000</MontoItem></Detalle>').join('');
  const xml = '<?xml version="1.0" encoding="ISO-8859-1"?><DTE version="1.0" xmlns="http://www.sii.cl/SiiDte"><Documento ID="B16608"><Encabezado><IdDoc><TipoDTE>39</TipoDTE><Folio>16608</Folio><FchEmis>2026-11-23</FchEmis></IdDoc><Emisor><RUTEmisor>76000000-0</RUTEmisor><RznSocEmisor>Almacén de Prueba</RznSocEmisor><GiroEmisor>Venta de alimentos</GiroEmisor><DirOrigen>Avenida Ejemplo 123</DirOrigen><CmnaOrigen>Santiago</CmnaOrigen><CiudadOrigen>Santiago</CiudadOrigen></Emisor><Receptor><RUTRecep>66666666-6</RUTRecep><RznSocRecep>Consumidor final</RznSocRecep></Receptor><Totales><MntNeto>' + Math.round(total / 1.19) + '</MntNeto><IVA>' + (total - Math.round(total / 1.19)) + '</IVA><MntTotal>' + total + '</MntTotal></Totales></Encabezado>' + details + ted + '</Documento></DTE>';
  return { document: { id: 87013877, tipodoc: '39', folio: 16608, montototal: total, xml: Buffer.from(xml, 'latin1').toString('base64') }, expected: { providerId: '87013877', folio: 16608, issuerRut: '76.000.000-0', total }, ted: Buffer.from(ted, 'latin1'), dd: Buffer.from(dd, 'latin1'), key, xml };
}
module.exports = { issuedBoleta };
