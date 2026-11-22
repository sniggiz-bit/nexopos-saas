// Pruebas focalizadas sin base de datos ni envío de correos reales.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '../../..');
const ts = require('typescript/lib/typescript.js');
const cache = new Map();
const contexts = new Map();
const loggerMessages = [];
const noop = () => () => {};
class HttpError extends Error {}
class Logger { warn(m) { loggerMessages.push(m); } error(m) { loggerMessages.push(m); } log(m) { loggerMessages.push(m); } }
const common = { Injectable: noop, Controller: noop, Get: noop, Post: noop, Put: noop, Patch: noop, Param: noop, Body: noop, Req: noop, Inject: noop, forwardRef: f => f, Logger,
 BadRequestException: HttpError, UnauthorizedException: HttpError, NotFoundException: HttpError, ForbiddenException: HttpError, ConflictException: HttpError,
 UseGuards: (...guards) => (_target, _key, descriptor) => { descriptor.value.guards = guards; }
};
function load(file) {
 file = path.resolve(root, file);
 if (cache.has(file)) return cache.get(file);
 const source = fs.readFileSync(file, 'utf8');
 const result = ts.transpileModule(source, { reportDiagnostics: true, compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.CommonJS, experimentalDecorators: true, jsx: ts.JsxEmit.ReactJSX } });
 assert.equal((result.diagnostics || []).filter(d => d.category === ts.DiagnosticCategory.Error).length, 0, file);
 const mod = { exports: {} };
 cache.set(file, mod.exports);
 const requireMock = name => {
   if (name === '@nestjs/common') return common;
   if (name.includes('public.decorator')) return { Public: noop };
   if (name === 'node:crypto') return crypto;
   if (name === '@prisma/client') return { UserRole: { CASHIER: 'CASHIER', MANAGER: 'MANAGER', TENANT_ADMIN: 'TENANT_ADMIN', SUPER_ADMIN: 'SUPER_ADMIN' } };
   if (name === 'uuid') return { v4: crypto.randomUUID };
   if (name === 'bcrypt') return { hash: async () => 'HASH_NOT_PASSWORD' };
   if (name === '@nexopos/shared') return { formatRut: value => value };
   if (name === 'axios') return { post: async () => {} };
   if (name.includes('jwt-auth.guard')) return { JwtAuthGuard: class JwtAuthGuard {} };
   if (/module-access|chat-identity|event-room-access|notification.template|welcome-email.template|super-admin.guard/.test(name)) return load(path.resolve(path.dirname(file), name + '.ts'));
   return {};
 };
 const context = { module: mod, exports: mod.exports, require: requireMock, process: { env: { NODE_ENV: 'production' } }, URL, AbortSignal, Buffer, console: { log() {}, error() {} }, Date, Set };
 contexts.set(file, context);
 vm.runInNewContext(result.outputText, context, { filename: file });
 return mod.exports;
}
const { SupportController } = load('apps/api/src/support/support.controller.ts');
const { NotificationsService } = load('apps/api/src/notifications/notifications.service.ts');
const { AuthService } = load('apps/api/src/auth/auth.service.ts');
const { SuperAdminGuard } = load('apps/api/src/auth/super-admin.guard.ts');
const identity = load('apps/api/src/support/chat-identity.ts');
const { canJoinEventsRoom } = load('apps/api/src/events/event-room-access.ts');
const { renderAdminNotification } = load('apps/api/src/email/admin-notification.template.ts');
const { loginDestination } = load('apps/web/src/lib/login-destination.ts');
const tenantId = '11111111-1111-4111-8111-111111111111';
const userId = '22222222-2222-4222-8222-222222222222';
const req = { user: { sub: userId, tenantId, role: 'TENANT_ADMIN' } };
const flush = () => new Promise(resolve => setImmediate(resolve));
function setup() {
 const sessions = new Map(); const messages = []; const alerts = []; const events = []; const emails = []; const audit = [];
 const prisma = {
   user: { findFirst: async ({ where }) => where.id === userId && where.tenantId === tenantId ? { id: userId, tenantId, name: 'Camila', email: 'camila@example.cl' } : null, findUnique: async () => null },
   tenant: { findUnique: async () => ({ name: 'Almacén Las Palmas' }) },
   chatSession: {
     upsert: async ({ where, create, update }) => { const value = sessions.has(where.id) ? { ...sessions.get(where.id), ...update } : create; sessions.set(where.id, value); return value; },
     findUnique: async ({ where }) => sessions.get(where.id) || null,
     findFirst: async ({ where }) => { const session = sessions.get(where.id); if (!session || session.visitorId !== where.visitorId) return null; return { ...session, messages: messages.filter(m => m.chatSessionId === session.id).slice().reverse().slice(0, 200) }; },
     update: async ({ where, data }) => { const session = { ...sessions.get(where.id), ...data }; sessions.set(where.id, session); return session; },
     findMany: async () => [...sessions.values()].map(s => ({ ...s, messages: messages.filter(m => m.chatSessionId === s.id).slice().reverse() })),
   },
   chatMessage: { create: async ({ data }) => { const m = { id: crypto.randomUUID(), createdAt: new Date(), ...data }; messages.push(m); return m; } },
   systemNotification: { create: async ({ data }) => { const n = { id: crypto.randomUUID(), ...data }; alerts.push(n); return n; } },
   systemLog: { create: async ({ data }) => { audit.push(data); return data; } },
 };
 prisma.$transaction = async fn => fn(prisma);
 const gateway = { emitToTenant: (...args) => events.push(args) };
 const config = { get: key => undefined };
 const email = { sendSystemNotification: async (...args) => { emails.push(args); return { status: 'ACCEPTED', providerId: 'test-provider-id' }; } };
 const notifications = new NotificationsService(prisma, gateway, config, email);
 const controller = new SupportController(prisma, notifications, gateway);
 return { sessions, messages, alerts, events, emails, audit, prisma, gateway, config, email, notifications, controller };
}

test('chat: delega consulta e historial a la identidad obtenida en el servidor', async () => {
 const actor = { id: userId, tenantId }; const calls = [];
 const service = { account: async request => { assert.equal(request, req); return actor; }, accountHistory: async value => { assert.equal(value, actor); return { messages: [] }; }, accountTurn: async (value, input) => { calls.push([value, input]); return { messages: [] }; } };
 const controller = new SupportController(service, {});
 await controller.getChat(req); const input = { message: 'Consulta' }; await controller.chat(req, input); assert.equal(calls[0][0], actor); assert.equal(calls[0][1], input);
});
test('chat: las rutas de administración requieren el guard de superadmin', () => {
 const guard = new SuperAdminGuard({});
 assert.throws(() => guard.canActivate({ switchToHttp: () => ({ getRequest: () => ({ user: { role: 'TENANT_ADMIN' } }) }) }));
 assert(guard.canActivate({ switchToHttp: () => ({ getRequest: () => ({ user: { role: 'SUPER_ADMIN' } }) }) }));
 assert(SupportController.prototype.adminReply.guards.includes(SuperAdminGuard));
 assert(SupportController.prototype.getActiveSessions.guards.includes(SuperAdminGuard));
 for (const method of ['action','settings','updateSettings','checkGemini','articles','createArticle','updateArticle']) assert(SupportController.prototype[method].guards.includes(SuperAdminGuard));
});
test('socket: protege avisos de administración y respuestas internas', () => {
 assert.equal(canJoinEventsRoom('superadmin', req.user), false);
 assert.equal(canJoinEventsRoom('superadmin', { role: 'SUPER_ADMIN' }), true);
 const room = identity.accountChatRoom(tenantId, userId);
 assert.equal(canJoinEventsRoom(room, null), false); assert.equal(canJoinEventsRoom(room, req.user), true);
 assert.equal(canJoinEventsRoom(room, { ...req.user, sub: 'otro' }), false);
 assert.equal(canJoinEventsRoom('visitor_' + identity.accountVisitorId(tenantId, userId), null), false);
 assert.equal(canJoinEventsRoom('visitor_33333333-3333-4333-8333-333333333333', null), true);
});
test('login: conserva el chat seleccionado y bloquea destinos externos o de otro rol', () => {
 const target = { pathname: '/admin/live-chats', search: '?session=abc' };
 assert.equal(loginDestination('SUPER_ADMIN', target), '/admin/live-chats?session=abc');
 assert.equal(loginDestination('TENANT_ADMIN', target), '/dashboard');
 assert.equal(loginDestination('SUPER_ADMIN', { pathname: '//example.com' }), '/admin/dashboard');
 assert.equal(loginDestination('SUPER_ADMIN', { pathname: '/admin/../dashboard' }), '/admin/dashboard');
 assert.equal(loginDestination('SUPER_ADMIN', { pathname: '/admin/tenants/abc' }), '/admin/tenants/abc');
});
test('correo: escapa el mensaje y presenta el botón de respuesta sin contraseñas ni tokens', () => {
 const html = renderAdminNotification({ title: 'Soporte <script>x</script>', message: 'Usuario <img src=x>\nNecesito ayuda', type: 'CHAT', actionUrl: 'https://nexopos.cl/admin/live-chats?session=abc&source=email' });
 assert(!html.includes('<script>')); assert(!html.includes('<img src=x>')); assert(html.includes('&lt;img'));
 assert(html.includes('<br>')); assert(html.includes('Ir directo al chat')); assert(html.includes('&amp;source=email'));
 assert.throws(() => renderAdminNotification({ title: 'x', message: 'x', type: 'CHAT', actionUrl: 'javascript:alert(1)' }));
});
test('registro: envía los datos del nuevo administrador y enlace a su empresa', async () => {
 const s = setup(); s.prisma.tenant.findUnique = async () => null;
 const tenants = { createWithDefaults: async () => ({ tenant: { id: tenantId, name: 'Tienda', slug: 'tienda', createdAt: new Date() }, branch: { id: 'branch', name: 'Casa Matriz' }, user: { id: userId } }) };
 const auth = new AuthService({ signAsync: async () => 'TEST_TOKEN' }, s.prisma, { send: async () => {} }, tenants, s.notifications);
 const result = await auth.registerTenant({ email: 'camila@example.cl', userName: 'Camila', companyName: 'Tienda', phone: '123456789', password: 'SECRET_PASSWORD' }); await flush();
 assert.equal(result.access_token, 'TEST_TOKEN'); assert.equal(s.emails.length, 1);
 const [, title, message, type, url] = s.emails[0]; assert.equal(type, 'REGISTRATION'); assert(title.includes('usuario'));
 assert(message.includes('camila@example.cl')); assert(message.includes('123456789')); assert(message.includes('Casa Matriz'));
 assert(!message.includes('SECRET_PASSWORD')); assert(!message.includes('TEST_TOKEN')); assert.equal(url, 'https://nexopos.cl/admin/tenants/' + tenantId);
});
test('avisos: registra fallos de proveedor sin exponer contenido del chat en logs', async () => {
 const s = setup(); s.email.sendSystemNotification = async () => ({ status: 'FAILED', error: 'Rechazado HTTP 403' });
 await s.notifications.notifySuperAdmin('Consulta', 'CONTENIDO_PRIVADO', 'CHAT'); await flush();
 assert.equal(s.audit[0].context.status, 'FAILED'); assert(!JSON.stringify(s.audit).includes('CONTENIDO_PRIVADO'));
});
test('avisos: respeta el destinatario configurado y el origen público', async () => {
 const s = setup(); s.config.get = key => ({ ADMIN_EMAIL: 'sniggiz@gmail.com', FRONTEND_URL: 'https://www.nexopos.cl/' })[key];
 await s.notifications.notifySuperAdmin('Consulta', 'Mensaje', 'CHAT', { actionPath: '/admin/live-chats?session=abc' }); await flush();
 assert.equal(s.emails[0][0], 'sniggiz@gmail.com'); assert.equal(s.emails[0][4], 'https://www.nexopos.cl/admin/live-chats?session=abc');
});
test('avisos: rechaza enlaces externos y configuración localhost en producción', async () => {
 const s = setup(); await assert.rejects(s.notifications.sendEmailNotification('n', 't', 'm', 'CHAT', '//example.com'));
 s.config.get = key => key === 'FRONTEND_URL' ? 'http://localhost:5173' : undefined;
 await assert.rejects(s.notifications.sendEmailNotification('n', 't', 'm', 'CHAT')); assert.equal(s.emails.length, 0);
});
// Sintaxis TSX de los puntos modificados, sin requerir dependencias del frontend.
for (const file of ['apps/web/src/pages/LoginPage.tsx', 'apps/web/src/pages/admin/LiveChatsPage.tsx', 'apps/web/src/components/dashboard/SupportChatWidget.tsx', 'apps/web/src/components/admin/NotificationBell.tsx', 'apps/web/src/components/landing/PublicChatWidget.tsx', 'apps/web/src/components/support/SupportConversationWidget.tsx', 'apps/web/src/pages/admin/SupportKnowledgePage.tsx', 'apps/web/src/pages/admin/AdminLandingPage.tsx']) {
 test('sintaxis: ' + file, () => { load(file); });
}

test('transporte real del servicio con fetch simulado: destinatario, HTML y fallos', async () => {
 const file = path.resolve(root, 'apps/api/src/email/email.service.ts');
 const { EmailService } = load(file); const context = contexts.get(file);
 context.process.env.RESEND_API_KEY = 'TEST_KEY'; let payload;
 context.fetch = async (_url, init) => { payload = JSON.parse(init.body); return { ok: true, json: async () => ({ id: 'provider-id' }) }; };
 const email = new EmailService();
 const result = await email.sendSystemNotification('sniggiz@gmail.com', 'Soporte', 'Consulta <script>x</script>', 'CHAT', 'https://nexopos.cl/admin/live-chats?session=test');
 assert.equal(result.status, 'ACCEPTED'); assert.equal(payload.to, 'sniggiz@gmail.com'); assert(payload.html.includes('Ir directo al chat')); assert(!payload.html.includes('<script>'));
 context.fetch = async () => ({ ok: false, status: 403, text: async () => 'SECRET_RESPONSE' });
 const failed = await email.sendSystemNotification('sniggiz@gmail.com', 'Soporte', 'Consulta', 'CHAT');
 assert.equal(failed.status, 'FAILED'); assert(!JSON.stringify(failed).includes('SECRET_RESPONSE'));
 delete context.process.env.RESEND_API_KEY;
 assert.equal((await new EmailService().sendSystemNotification('sniggiz@gmail.com', 'Soporte', 'Consulta', 'CHAT')).status, 'NOT_CONFIGURED');
});

test('usuarios internos: avisa del alta sin exponer contraseña ni cambiar la respuesta de la API', async () => {
 const s = setup(); const { UsersService } = load('apps/api/src/users/users.service.ts');
 s.prisma.user.create = async ({ select }) => { assert(!select.password); return { id: userId, tenantId, email: 'cajero@example.cl', name: 'Diego', role: 'CASHIER', createdAt: new Date(), tenant: { name: 'Tienda' } }; };
 const service = new UsersService(s.prisma, s.notifications);
 const created = await service.create({ email: 'cajero@example.cl', password: 'SECRET_PASSWORD', name: 'Diego', role: 'CASHIER' }, { role: 'TENANT_ADMIN', tenantId }); await flush();
 assert.equal(created.email, 'cajero@example.cl'); assert.equal(created.tenant, undefined);
 assert.equal(s.emails.length, 1); assert.equal(s.emails[0][0], 'sniggiz@gmail.com'); assert(s.emails[0][2].includes('CASHIER')); assert(!s.emails[0][2].includes('SECRET_PASSWORD'));
 assert.equal(s.emails[0][4], 'https://nexopos.cl/admin/tenants/' + tenantId);
 await assert.rejects(service.create({ email: 'x@example.cl' }, { role: 'CASHIER', tenantId }));
 assert.equal(s.emails.length, 1);
});

test('chat: genera UUID seguros cuando el navegador no expone randomUUID', () => {
 const { supportUuid } = load('apps/web/src/lib/support-id.ts');
 const provider = { getRandomValues: value => crypto.randomFillSync(value) };
 const first = supportUuid(provider); const second = supportUuid(provider);
 assert.match(first, /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/);
 assert.notEqual(first, second);
 assert.throws(() => supportUuid({}));
});
