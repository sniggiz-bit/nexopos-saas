// Genera ejemplos locales; no envía correos.
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript/lib/typescript.js');
const root = path.resolve(__dirname, '../../..');
const compiled = ts.transpileModule(fs.readFileSync(path.join(root, 'apps/api/src/email/admin-notification.template.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2023 } });
const template = { exports: {} };
new Function('exports', compiled.outputText)(template.exports);
const dir = path.join(root, 'docs/previews');
fs.mkdirSync(dir, { recursive: true });
const examples = {
 'admin-registration-email': { title: 'Nuevo usuario registrado', type: 'REGISTRATION', message: 'Empresa: Almacén Las Palmas\nUsuario: Camila\nCorreo: camila@example.cl\nTeléfono: No informado\nRol: Administrador de empresa\nSucursal inicial: Casa Matriz\nFecha de creación: 18-11-2026 (Chile)', actionUrl: 'https://nexopos.cl/admin/tenants/11111111-1111-4111-8111-111111111111' },
 'admin-chat-email': { title: 'Nuevo mensaje de soporte', type: 'CHAT', message: 'Usuario: Camila\nCorreo: camila@example.cl\nEmpresa: Almacén Las Palmas\n\nMensaje:\nHola, necesito ayuda para organizar las categorías de mis productos.', actionUrl: 'https://nexopos.cl/admin/live-chats?session=22222222-2222-4222-8222-222222222222' },
};
for (const [name, data] of Object.entries(examples)) fs.writeFileSync(path.join(dir, name + '.html'), template.exports.renderAdminNotification(data));
console.log('Vistas previas generadas con datos ficticios: registro y chat del administrador.');
