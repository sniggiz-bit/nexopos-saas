"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var EmailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const common_1 = require("@nestjs/common");
let EmailService = EmailService_1 = class EmailService {
    logger = new common_1.Logger(EmailService_1.name);
    resendApiKey = process.env.RESEND_API_KEY;
    fromEmail = process.env.FROM_EMAIL || 'noreply@nexopos.cl';
    async sendWelcomeEmail(email, name, credentials) {
        const emailContent = this.generateWelcomeEmailHtml(name, credentials);
        try {
            if (!this.resendApiKey) {
                this.logger.warn('RESEND_API_KEY not configured. Email will be logged to console.');
                this.logger.log('='.repeat(80));
                this.logger.log('📧 WELCOME EMAIL');
                this.logger.log(`To: ${email}`);
                this.logger.log(`Subject: ¡Bienvenido a NexoPOS!`);
                this.logger.log('-'.repeat(80));
                this.logger.log(emailContent);
                this.logger.log('='.repeat(80));
                return;
            }
            const response = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${this.resendApiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    from: this.fromEmail,
                    to: email,
                    subject: '¡Bienvenido a NexoPOS!',
                    html: emailContent,
                }),
            });
            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Resend API error: ${error}`);
            }
            this.logger.log(`Welcome email sent successfully to ${email}`);
        }
        catch (error) {
            this.logger.error(`Failed to send welcome email to ${email}:`, error);
        }
    }
    generateWelcomeEmailHtml(name, credentials) {
        return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 8px 8px 0 0;
      text-align: center;
    }
    .content {
      background: #f9fafb;
      padding: 30px;
      border-radius: 0 0 8px 8px;
    }
    .credentials {
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      border-left: 4px solid #667eea;
    }
    .button {
      display: inline-block;
      background: #667eea;
      color: white;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      color: #6b7280;
      font-size: 14px;
      margin-top: 30px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>¡Bienvenido a NexoPOS!</h1>
  </div>
  <div class="content">
    <p>Hola <strong>${name}</strong>,</p>
    
    <p>¡Felicitaciones! Tu cuenta de NexoPOS ha sido creada exitosamente para <strong>${credentials.companyName}</strong>.</p>
    
    <div class="credentials">
      <h3>Tus credenciales de acceso:</h3>
      <p><strong>Email:</strong> ${credentials.email}</p>
      <p><strong>Contraseña:</strong> ${credentials.password}</p>
    </div>
    
    <p>Ya puedes comenzar a gestionar tu negocio con inteligencia. Accede a tu panel de control para:</p>
    
    <ul>
      <li>✅ Configurar tu punto de venta</li>
      <li>✅ Agregar productos e inventario</li>
      <li>✅ Gestionar múltiples sucursales</li>
      <li>✅ Emitir documentos tributarios electrónicos</li>
    </ul>
    
    <center>
      <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" class="button">
        Acceder a mi Sistema
      </a>
    </center>
    
    <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
      Si tienes alguna pregunta, no dudes en contactarnos. ¡Estamos aquí para ayudarte!
    </p>
  </div>
  <div class="footer">
    <p>© ${new Date().getFullYear()} NexoPOS. Todos los derechos reservados.</p>
  </div>
</body>
</html>
    `.trim();
    }
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = EmailService_1 = __decorate([
    (0, common_1.Injectable)()
], EmailService);
//# sourceMappingURL=email.service.js.map