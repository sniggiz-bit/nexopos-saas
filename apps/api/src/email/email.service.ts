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
    companyName?: string,
    quoteDetails?: any,
  ): Promise<void> {
    const htmlContent = this.generateQuoteEmailHtml(quoteNumber, message, companyName, quoteDetails);
    const cleanDisplayName = (companyName || 'NexoPOS').replace(/["'<>]/g, '').trim();
    const fromHeader = `${cleanDisplayName} <${this.fromEmail}>`;
    const subject = `Cotización ${quoteNumber} - ${cleanDisplayName}`;

    try {
      if (!this.resendApiKey) {
        this.logger.warn(
          'RESEND_API_KEY not configured. Email will be logged to console.',
        );
        this.logger.log('='.repeat(80));
        this.logger.log(`📧 SEND QUOTE EMAIL [${quoteNumber}]`);
        this.logger.log(`From: ${fromHeader}`);
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
          from: fromHeader,
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

      this.logger.log(`Quote email ${quoteNumber} sent successfully to ${email} from ${fromHeader}`);
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

  private generateQuoteEmailHtml(
    quoteNumber: string,
    message?: string,
    companyName?: string,
    quote?: any,
  ): string {
    const senderTitle = companyName || 'NexoPOS';
    const personalMessageHtml = message
      ? `<div class="message-card">
           <p style="margin: 0; font-style: italic;">"${message}"</p>
         </div>`
      : '';

    let itemsTableHtml = '';
    if (quote && Array.isArray(quote.items) && quote.items.length > 0) {
      const rowsHtml = quote.items
        .map((item: any, idx: number) => {
          const bg = idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
          const name = item.productName || item.product?.name || 'Producto';
          const price = Number(item.price) || 0;
          const qty = Number(item.quantity) || 0;
          const lineTotal = Number(item.total) || price * qty;
          return `
            <tr style="background-color: ${bg}; border-bottom: 1px solid #E2E8F0;">
              <td style="padding: 10px 12px; font-weight: 500; color: #1E293B;">${name}</td>
              <td style="padding: 10px 12px; text-align: center; color: #475569;">${qty}</td>
              <td style="padding: 10px 12px; text-align: right; color: #475569;">$${price.toLocaleString('es-CL')}</td>
              <td style="padding: 10px 12px; text-align: right; font-weight: 700; color: #0F172A;">$${lineTotal.toLocaleString('es-CL')}</td>
            </tr>
          `;
        })
        .join('');

      itemsTableHtml = `
        <div style="margin: 25px 0;">
          <div style="font-size: 13px; font-weight: 700; color: #64748B; text-transform: uppercase; tracking-wide: 0.5px; margin-bottom: 8px;">Resumen de la Cotización</div>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; border-radius: 8px; overflow: hidden; border: 1px solid #E2E8F0;">
            <thead>
              <tr style="background-color: #0099CC; color: #FFFFFF; text-align: left; font-size: 12px;">
                <th style="padding: 10px 12px;">Producto</th>
                <th style="padding: 10px 12px; text-align: center;">Cant.</th>
                <th style="padding: 10px 12px; text-align: right;">Precio</th>
                <th style="padding: 10px 12px; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <div style="margin-top: 15px; background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 16px; text-align: right;">
            <div style="font-size: 13px; color: #64748B; margin-bottom: 4px;">
              Subtotal (neto): <strong style="color: #1E293B;">$${(quote.subtotal || 0).toLocaleString('es-CL')}</strong>
            </div>
            <div style="font-size: 13px; color: #64748B; margin-bottom: 8px;">
              IVA (19%): <strong style="color: #1E293B;">$${(quote.tax || 0).toLocaleString('es-CL')}</strong>
            </div>
            <div style="font-size: 18px; font-weight: 800; color: #0099CC; border-top: 1px solid #E2E8F0; pt-2; padding-top: 8px;">
              TOTAL: $${(quote.total || 0).toLocaleString('es-CL')}
            </div>
          </div>
        </div>
      `;
    }

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cotización Enviada - ${senderTitle}</title>
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
    .company-title {
      font-size: 26px;
      font-weight: 800;
      letter-spacing: -0.5px;
      margin-bottom: 5px;
      color: #FFFFFF;
    }
    .logo-highlight {
      color: #0099CC;
    }
    .header h1 {
      font-size: 18px;
      font-weight: 600;
      margin: 8px 0 0 0;
      color: #94A3B8;
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
        <div class="company-title">${senderTitle}</div>
        <h1>Cotización Formal</h1>
      </div>
      <div class="content">
        <h2 class="email-title">Estimado Cliente,</h2>
        <p>Agradecemos su interés. Le adjuntamos la cotización formal emitida por <strong>${senderTitle}</strong>.</p>
        
        <div class="doc-badge">DOCUMENTO N° ${quoteNumber}</div>
        
        ${personalMessageHtml}

        ${itemsTableHtml}
        
        <div class="instructions-card">
          <div class="instructions-title">¿Cómo aceptar o continuar con esta cotización?</div>
          <ol class="steps-list">
            <li><strong>Revisar PDF:</strong> Puede descargar o abrir el PDF oficial adjunto a este correo.</li>
            <li><strong>Aceptar Compra:</strong> Para confirmar la orden, simplemente responda a este correo electrónico.</li>
            <li><strong>Dudas o Cambios:</strong> Si necesita modificar ítems o cantidades, contáctenos directamente respondiendo a este mensaje.</li>
          </ol>
        </div>
      </div>
      <div class="footer">
        <p>Documento emitido por <strong>${senderTitle}</strong> mediante el sistema NexoPOS.</p>
        <p>© ${new Date().getFullYear()} ${senderTitle}. Todos los derechos reservados.</p>
        <p class="disclaimer">CONFIDENCIALIDAD: Este correo electrónico y cualquier archivo adjunto son confidenciales. Si no es el destinatario intencional, favor eliminarlo.</p>
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

  async sendSystemNotification(
    email: string,
    title: string,
    message: string,
    type: string,
    actionUrl?: string,
  ): Promise<void> {
    const htmlContent = this.generateSystemNotificationHtml(title, message, type, actionUrl);
    const subject = `NexoPOS Alerta: ${title}`;

    try {
      if (!this.resendApiKey) {
        this.logger.warn('RESEND_API_KEY not configured. Email will be logged to console.');
        this.logger.log('='.repeat(80));
        this.logger.log(`📧 SEND SYSTEM NOTIFICATION`);
        this.logger.log(`To: ${email}`);
        this.logger.log(`Subject: ${subject}`);
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
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Resend API error: ${error}`);
      }

      this.logger.log(`System notification sent successfully to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send system notification to ${email}:`, error);
    }
  }

  private generateSystemNotificationHtml(title: string, message: string, type: string, actionUrl?: string): string {
    const actionHtml = actionUrl
      ? `<div style="text-align: center; margin-top: 30px;">
           <a href="${actionUrl}" style="background-color: #0099CC; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
             Continuar Conversación
           </a>
         </div>`
      : '';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Alerta NexoPOS</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <div style="background-color: #0B0F1A; color: white; padding: 20px; text-align: center; border-bottom: 4px solid #0099CC;">
      <h1 style="margin: 0; font-size: 24px;">NexoPOS</h1>
    </div>
    <div style="padding: 30px;">
      <h2 style="margin-top: 0; color: #333;">${title}</h2>
      <span style="display: inline-block; background-color: #e2e8f0; color: #475569; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: bold; margin-bottom: 20px;">
        TIPO: ${type}
      </span>
      <p style="color: #4a5568; line-height: 1.6; font-size: 16px; background-color: #f8fafc; padding: 15px; border-left: 4px solid #0099CC; border-radius: 0 8px 8px 0;">
        ${message}
      </p>
      ${actionHtml}
    </div>
    <div style="background-color: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
      Este es un mensaje automático del sistema NexoPOS.
    </div>
  </div>
</body>
</html>
    `.trim();
  }
}
