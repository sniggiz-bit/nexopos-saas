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
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>¡Bienvenido a NexoPOS!</title>
  <style>
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #1F2937;
      background-color: #F3F4F6;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      background-color: #F3F4F6;
      padding: 30px 15px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #FFFFFF;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
    }
    .header {
      background-color: #0B0F1A;
      background-image: linear-gradient(135deg, #0B0F1A 0%, #1E293B 100%);
      color: #FFFFFF;
      padding: 40px 30px;
      text-align: center;
      border-bottom: 4px solid #0099CC;
    }
    .logo-text {
      font-size: 28px;
      font-weight: 800;
      letter-spacing: -0.5px;
      margin-bottom: 10px;
      color: #FFFFFF;
    }
    .logo-highlight {
      color: #0099CC;
    }
    .header h1 {
      font-size: 22px;
      font-weight: 700;
      margin: 10px 0 0 0;
      color: #F3F4F6;
    }
    .content {
      padding: 40px 30px;
      background-color: #FFFFFF;
    }
    .welcome-title {
      font-size: 20px;
      font-weight: 700;
      color: #111827;
      margin-top: 0;
      margin-bottom: 15px;
    }
    .credentials-card {
      background-color: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-left: 4px solid #0099CC;
      border-radius: 8px;
      padding: 24px;
      margin: 25px 0;
    }
    .credentials-title {
      font-size: 15px;
      font-weight: 700;
      color: #0F172A;
      margin-top: 0;
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .credential-field {
      margin-bottom: 8px;
      font-size: 14px;
    }
    .credential-label {
      color: #64748B;
      font-weight: 500;
    }
    .credential-value {
      color: #0F172A;
      font-weight: 600;
      font-family: 'Courier New', Courier, monospace;
      background-color: #E2E8F0;
      padding: 2px 6px;
      border-radius: 4px;
    }
    .features-list {
      margin: 25px 0;
      padding-left: 20px;
      list-style-type: none;
    }
    .features-list li {
      position: relative;
      margin-bottom: 12px;
      font-size: 15px;
      color: #334155;
    }
    .features-list li::before {
      content: "✓";
      position: absolute;
      left: -20px;
      color: #0099CC;
      font-weight: bold;
    }
    .btn-container {
      text-align: center;
      margin: 30px 0 10px 0;
    }
    .button {
      display: inline-block;
      background-color: #0099CC;
      color: #FFFFFF !important;
      font-weight: 600;
      font-size: 15px;
      text-decoration: none;
      padding: 12px 32px;
      border-radius: 6px;
      box-shadow: 0 4px 6px -1px rgba(0, 153, 204, 0.2);
    }
    .footer {
      text-align: center;
      padding: 30px;
      background-color: #F8FAFC;
      border-top: 1px solid #E2E8F0;
      color: #64748B;
      font-size: 12px;
    }
    .footer p {
      margin: 5px 0;
    }
    .disclaimer {
      font-size: 11px;
      color: #94A3B8;
      line-height: 1.4;
      margin-top: 15px !important;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="logo-text">Nexo<span class="logo-highlight">POS</span></div>
        <h1>¡Bienvenido a NexoPOS!</h1>
      </div>
      <div class="content">
        <h2 class="welcome-title">Hola ${name},</h2>
        <p>¡Felicitaciones! Tu cuenta de NexoPOS ha sido creada exitosamente para la empresa <strong>${credentials.companyName}</strong>.</p>
        
        <p>A partir de ahora, tienes en tus manos una herramienta potente para gestionar tus ventas, inventarios, clientes y sucursales en tiempo real.</p>
        
        <div class="credentials-card">
          <div class="credentials-title">Tus credenciales de acceso:</div>
          <div class="credential-field">
            <span class="credential-label">Empresa:</span>
            <span class="credential-value" style="font-family: inherit; background: none; padding: 0; font-weight: bold; border-radius: 0;">${credentials.companyName}</span>
          </div>
          <div class="credential-field">
            <span class="credential-label">Correo:</span>
            <span class="credential-value">${credentials.email}</span>
          </div>
          <div class="credential-field">
            <span class="credential-label">Contraseña temporal:</span>
            <span class="credential-value">${credentials.password}</span>
          </div>
        </div>
        
        <p>Comienza a configurar tu negocio siguiendo estos sencillos pasos:</p>
        <ul class="features-list">
          <li><strong>Configura tus Sucursales:</strong> Define tus locales y asigna cajeros y vendedores.</li>
          <li><strong>Carga tu Inventario:</strong> Sube tus productos, categorías y controla el stock fácilmente.</li>
          <li><strong>Personaliza tu POS:</strong> Ajusta los métodos de pago y de boleta electrónica.</li>
          <li><strong>Comienza a Vender:</strong> Realiza transacciones rápidas desde cualquier dispositivo.</li>
        </ul>
        
        <div class="btn-container">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" class="button" target="_blank">
            Ingresar al Panel de NexoPOS
          </a>
        </div>
      </div>
      <div class="footer">
        <p><strong>NexoPOS SpA</strong></p>
        <p>Gestión inteligente para tu punto de venta</p>
        <p>© ${new Date().getFullYear()} NexoPOS. Todos los derechos reservados.</p>
        <p class="disclaimer">Este es un correo automático. Por favor no respondas directamente a este mensaje. Para soporte técnico, contáctanos a soporte@nexopos.cl.</p>
      </div>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  async sendQuoteEmail(
    email: string,
    quoteNumber: string,
    pdfBuffer: Buffer,
    message?: string,
  ): Promise<void> {
    const htmlContent = this.generateQuoteEmailHtml(quoteNumber, message);
    const subject = `Cotización ${quoteNumber} - NexoPOS`;

    try {
      if (!this.resendApiKey) {
        this.logger.warn(
          'RESEND_API_KEY not configured. Email will be logged to console.',
        );
        this.logger.log('='.repeat(80));
        this.logger.log(`📧 SEND QUOTE EMAIL [${quoteNumber}]`);
        this.logger.log(`To: ${email}`);
        this.logger.log(`Subject: ${subject}`);
        this.logger.log(`Attached PDF: cotizacion-${quoteNumber}.pdf (${pdfBuffer.length} bytes)`);
        this.logger.log('-'.repeat(80));
        this.logger.log(htmlContent);
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
          subject,
          html: htmlContent,
          attachments: [
            {
              content: pdfBuffer.toString('base64'),
              filename: `cotizacion-${quoteNumber}.pdf`,
            },
          ],
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Resend API error: ${error}`);
      }

      this.logger.log(`Quote email ${quoteNumber} sent successfully to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send quote email to ${email}:`, error);
      throw error;
    }
  }

  async sendSaleReceiptEmail(
    email: string,
    docTypeLabel: string,
    folio: string,
    pdfBuffer: Buffer,
    filename: string,
  ): Promise<void> {
    const htmlContent = this.generateReceiptEmailHtml(docTypeLabel, folio);
    const subject = `Tu comprobante de venta (${docTypeLabel} #${folio}) - NexoPOS`;

    try {
      if (!this.resendApiKey) {
        this.logger.warn(
          'RESEND_API_KEY not configured. Email will be logged to console.',
        );
        this.logger.log('='.repeat(80));
        this.logger.log(`📧 SEND SALE RECEIPT EMAIL [${docTypeLabel} #${folio}]`);
        this.logger.log(`To: ${email}`);
        this.logger.log(`Subject: ${subject}`);
        this.logger.log(`Attached PDF: ${filename} (${pdfBuffer.length} bytes)`);
        this.logger.log('-'.repeat(80));
        this.logger.log(htmlContent);
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
          subject,
          html: htmlContent,
          attachments: [
            {
              content: pdfBuffer.toString('base64'),
              filename,
            },
          ],
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Resend API error: ${error}`);
      }

      this.logger.log(`Sale receipt email sent successfully to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send sale receipt email to ${email}:`, error);
      throw error;
    }
  }

  private generateQuoteEmailHtml(quoteNumber: string, message?: string): string {
    const personalMessageHtml = message
      ? `<div class="message-card">
           <p style="margin: 0; font-style: italic;">"${message}"</p>
         </div>`
      : '';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cotización Enviada - NexoPOS</title>
  <style>
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #1F2937;
      background-color: #F3F4F6;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      background-color: #F3F4F6;
      padding: 30px 15px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #FFFFFF;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
    }
    .header {
      background-color: #0B0F1A;
      background-image: linear-gradient(135deg, #0B0F1A 0%, #1E293B 100%);
      color: #FFFFFF;
      padding: 40px 30px;
      text-align: center;
      border-bottom: 4px solid #0099CC;
    }
    .logo-text {
      font-size: 28px;
      font-weight: 800;
      letter-spacing: -0.5px;
      margin-bottom: 10px;
      color: #FFFFFF;
    }
    .logo-highlight {
      color: #0099CC;
    }
    .header h1 {
      font-size: 22px;
      font-weight: 700;
      margin: 10px 0 0 0;
      color: #F3F4F6;
    }
    .content {
      padding: 40px 30px;
      background-color: #FFFFFF;
    }
    .email-title {
      font-size: 20px;
      font-weight: 700;
      color: #111827;
      margin-top: 0;
      margin-bottom: 15px;
    }
    .doc-badge {
      display: inline-block;
      background-color: #E0F2FE;
      color: #0369A1;
      font-size: 13px;
      font-weight: 700;
      padding: 6px 16px;
      border-radius: 9999px;
      margin-bottom: 20px;
      border: 1px solid #BAE6FD;
    }
    .message-card {
      background-color: #F0F9FF;
      border-left: 4px solid #0099CC;
      padding: 20px;
      border-radius: 0 8px 8px 0;
      margin: 25px 0;
      font-style: italic;
      color: #334155;
      font-size: 15px;
    }
    .instructions-card {
      background-color: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 8px;
      padding: 24px;
      margin: 25px 0;
    }
    .instructions-title {
      font-size: 15px;
      font-weight: 700;
      color: #0F172A;
      margin-top: 0;
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .steps-list {
      margin: 0;
      padding-left: 20px;
    }
    .steps-list li {
      margin-bottom: 8px;
      font-size: 14px;
      color: #475569;
    }
    .btn-container {
      text-align: center;
      margin: 30px 0 10px 0;
    }
    .button {
      display: inline-block;
      background-color: #0099CC;
      color: #FFFFFF !important;
      font-weight: 600;
      font-size: 15px;
      text-decoration: none;
      padding: 12px 32px;
      border-radius: 6px;
      box-shadow: 0 4px 6px -1px rgba(0, 153, 204, 0.2);
    }
    .footer {
      text-align: center;
      padding: 30px;
      background-color: #F8FAFC;
      border-top: 1px solid #E2E8F0;
      color: #64748B;
      font-size: 12px;
    }
    .footer p {
      margin: 5px 0;
    }
    .disclaimer {
      font-size: 11px;
      color: #94A3B8;
      line-height: 1.4;
      margin-top: 15px !important;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="logo-text">Nexo<span class="logo-highlight">POS</span></div>
        <h1>Cotización Recibida</h1>
      </div>
      <div class="content">
        <h2 class="email-title">Estimado Cliente,</h2>
        <p>Adjunto a este correo electrónico encontrará la cotización formal solicitada.</p>
        
        <div class="doc-badge">DOCUMENTO N° ${quoteNumber}</div>
        
        ${personalMessageHtml}
        
        <div class="instructions-card">
          <div class="instructions-title">¿Cómo continuar con esta cotización?</div>
          <ol class="steps-list">
            <li><strong>Revisión:</strong> Abra el archivo PDF adjunto a este correo para revisar el desglose y el valor total de la cotización.</li>
            <li><strong>Aceptación:</strong> Si está de acuerdo y desea concretar la compra, simplemente responda directamente a este correo.</li>
            <li><strong>Vencimiento:</strong> Tenga en cuenta la fecha de validez indicada en el documento PDF para conservar los precios cotizados.</li>
          </ol>
        </div>
        
        <p>Si necesita realizar cambios, agregar productos o requiere alguna aclaración adicional, no dude en contactarse respondiendo a este mensaje.</p>
        
        <div class="btn-container">
          <span class="button" style="background-color: #475569; box-shadow: none; cursor: default;">PDF Adjunto en este Correo</span>
        </div>
      </div>
      <div class="footer">
        <p>Este documento es una cotización informativa y no constituye una factura o boleta electrónica.</p>
        <p>© ${new Date().getFullYear()} NexoPOS. Todos los derechos reservados.</p>
        <p class="disclaimer">CONFIDENCIALIDAD: Este correo electrónico y cualquier archivo adjunto son confidenciales y pueden contener información legalmente privilegiada. Si usted no es el destinatario intencional, queda estrictamente prohibida cualquier divulgación, distribución o copia del mismo.</p>
      </div>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  private generateReceiptEmailHtml(docTypeLabel: string, folio: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Comprobante de Venta - NexoPOS</title>
  <style>
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #1F2937;
      background-color: #F3F4F6;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      background-color: #F3F4F6;
      padding: 30px 15px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #FFFFFF;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
    }
    .header {
      background-color: #0B0F1A;
      background-image: linear-gradient(135deg, #0B0F1A 0%, #1E293B 100%);
      color: #FFFFFF;
      padding: 40px 30px;
      text-align: center;
      border-bottom: 4px solid #0099CC;
    }
    .logo-text {
      font-size: 28px;
      font-weight: 800;
      letter-spacing: -0.5px;
      margin-bottom: 10px;
      color: #FFFFFF;
    }
    .logo-highlight {
      color: #0099CC;
    }
    .header h1 {
      font-size: 22px;
      font-weight: 700;
      margin: 10px 0 0 0;
      color: #F3F4F6;
    }
    .content {
      padding: 40px 30px;
      background-color: #FFFFFF;
    }
    .email-title {
      font-size: 20px;
      font-weight: 700;
      color: #111827;
      margin-top: 0;
      margin-bottom: 15px;
    }
    .doc-badge {
      display: inline-block;
      background-color: #DCFCE7;
      color: #15803D;
      font-size: 13px;
      font-weight: 700;
      padding: 6px 16px;
      border-radius: 9999px;
      margin-bottom: 20px;
      border: 1px solid #BBF7D0;
      text-transform: uppercase;
    }
    .receipt-info-card {
      background-color: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 8px;
      padding: 24px;
      margin: 25px 0;
    }
    .receipt-info-title {
      font-size: 15px;
      font-weight: 700;
      color: #0F172A;
      margin-top: 0;
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .receipt-info-list {
      margin: 0;
      padding-left: 20px;
    }
    .receipt-info-list li {
      margin-bottom: 8px;
      font-size: 14px;
      color: #475569;
    }
    .btn-container {
      text-align: center;
      margin: 30px 0 10px 0;
    }
    .button {
      display: inline-block;
      background-color: #10B981;
      color: #FFFFFF !important;
      font-weight: 600;
      font-size: 15px;
      text-decoration: none;
      padding: 12px 32px;
      border-radius: 6px;
      box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.2);
    }
    .footer {
      text-align: center;
      padding: 30px;
      background-color: #F8FAFC;
      border-top: 1px solid #E2E8F0;
      color: #64748B;
      font-size: 12px;
    }
    .footer p {
      margin: 5px 0;
    }
    .disclaimer {
      font-size: 11px;
      color: #94A3B8;
      line-height: 1.4;
      margin-top: 15px !important;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="logo-text">Nexo<span class="logo-highlight">POS</span></div>
        <h1>¡Gracias por tu compra!</h1>
      </div>
      <div class="content">
        <h2 class="email-title">Hola,</h2>
        <p>Agradecemos sinceramente tu preferencia. Adjunto a este correo electrónico encontrarás el comprobante digital de tu transacción.</p>
        
        <div class="doc-badge">${docTypeLabel} #${folio}</div>
        
        <div class="receipt-info-card">
          <div class="receipt-info-title">Detalles del Documento</div>
          <ul class="receipt-info-list">
            <li><strong>Tipo de Documento:</strong> ${docTypeLabel}</li>
            <li><strong>Folio / Número:</strong> ${folio}</li>
            <li><strong>Formato:</strong> PDF Adjunto (Listo para descargar o imprimir)</li>
            <li><strong>Emisión:</strong> Emitido electrónicamente de forma inmediata</li>
          </ul>
        </div>
        
        <p>Por favor, descarga y guarda el archivo adjunto para tus registros y controles de compras.</p>
        
        <div class="btn-container">
          <span class="button" style="cursor: default;">Documento Adjunto</span>
        </div>
      </div>
      <div class="footer">
        <p>Este documento es una copia autorizada del comprobante tributario oficial de tu compra.</p>
        <p>© ${new Date().getFullYear()} NexoPOS. Todos los derechos reservados.</p>
        <p class="disclaimer">Este es un correo de entrega automatizada. Si tienes dudas respecto a los productos adquiridos o deseas coordinar un cambio/devolución, por favor comunícate directamente con la sucursal de emisión.</p>
      </div>
    </div>
  </div>
</body>
</html>
    `.trim();
  }
}
