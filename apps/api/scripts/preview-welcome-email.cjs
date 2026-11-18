// Genera una vista previa local con datos ficticios. No envía correos.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const ts = require('typescript/lib/typescript.js');
const root = path.resolve(__dirname, '../../..');
const sourcePath = path.join(root, 'apps/api/src/email/welcome-email.template.ts');
const compiled = ts.transpileModule(fs.readFileSync(sourcePath, 'utf8'), {
  reportDiagnostics: true,
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2023 },
});
assert.equal((compiled.diagnostics || []).filter(d => d.category === ts.DiagnosticCategory.Error).length, 0);
const template = { exports: {} };
new Function('exports', compiled.outputText)(template.exports);
const { renderWelcomeEmail, SUPPORT_WHATSAPP_URL } = template.exports;
const data = { name: 'Camila', email: 'camila@example.cl', companyName: 'Almacén Las Palmas', frontendUrl: 'https://nexopos.cl' };
const html = renderWelcomeEmail(data);
const expected = ['Paso 1. Crea las categorías', 'Paso 2. Registra las marcas', 'Paso 3. Ingresa tus productos y su imagen principal', 'Paso 4. Registra los proveedores'];
let previous = -1;
for (const text of expected) { const index = html.indexOf(text); assert(index > previous, text); previous = index; }
assert(html.includes('Confites'));
assert(html.includes('completa todos los campos requeridos'));
assert(html.includes('mensaje interno desde tu panel de usuario'));
assert(html.includes('https://nexopos.cl/login'));
assert(html.includes('https://nexopos.cl/dashboard'));
assert.equal(SUPPORT_WHATSAPP_URL, 'https://wa.me/56940082418');
assert(html.includes('href="' + SUPPORT_WHATSAPP_URL + '"'));
assert(Buffer.byteLength(html, 'utf8') < 95000, 'El HTML no debe acercarse al límite de recorte de Gmail');
const unsafe = renderWelcomeEmail({ ...data, name: '<script>alert(1)</script>', companyName: '<img src=x onerror=alert(1)>', email: '" onclick="alert(1)', password: 'SECRET_PASSWORD' });
assert(!unsafe.includes('<script>'));
assert(!unsafe.includes('<img src=x'));
assert(unsafe.includes('&lt;script&gt;'));
assert(!unsafe.includes('SECRET_PASSWORD'));
assert.throws(() => renderWelcomeEmail({ ...data, frontendUrl: 'javascript:alert(1)' }));
assert(!html.includes('boleta electrónica'));
assert(!html.includes('Configura tus Sucursales'));
const output = path.join(root, 'docs/previews');
fs.mkdirSync(output, { recursive: true });
const logo = fs.readFileSync(path.join(root, 'apps/web/public/logo.png')).toString('base64');
const preview = html.replace('https://nexopos.cl/logo.png', 'data:image/png;base64,' + logo);
fs.writeFileSync(path.join(output, 'welcome-email.html'), preview);
console.log('PASS: orden de los cuatro pasos, contenidos requeridos, soporte, enlaces, escape HTML, ausencia de contraseñas y tamaño del correo.');
console.log('Vista previa: docs/previews/welcome-email.html');
