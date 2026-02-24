import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resendApiKey = process.env.RESEND_API_KEY;
  private readonly fromEmail = process.env.FROM_EMAIL || 'noreply@nexopos.cl';

  async sendWelcomeEmail(
    email: string,
    name: string,
    credentials: { email: string; password: string; companyName: string },
  ): Promise<void> {
    const emailContent = this.generateWelcomeEmailHtml(name, credentials);

    try {
      if (!this.resendApiKey) {
        // Fallback: Log to console if no API key configured
        this.logger.warn(
          'RESEND_API_KEY not configured. Email will be logged to console.',
        );
        this.logger.log('='.repeat(80));
        this.logger.log('📧 WELCOME EMAIL');
        this.logger.log(`To: ${email}`);
        this.logger.log(`Subject: ¡Bienvenido a NexoPOS!`);
        this.logger.log('-'.repeat(80));
        this.logger.log(emailContent);
        this.logger.log('='.repeat(80));
        return;
      }

      // Send email via Resend API
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
    } catch (error) {
      // Don't throw - we don't want email failures to block registration
      this.logger.error(`Failed to send welcome email to ${email}:`, error);
    }
  }

  private generateWelcomeEmailHtml(
    name: string,
    credentials: { email: string; password: string; companyName: string },
  ): string {
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
}
