export interface WelcomeEmailData {
  name: string;
  email: string;
  companyName: string;
  frontendUrl: string;
  initialPassword?: string;
}

export const SUPPORT_WHATSAPP_URL = 'https://wa.me/56940082418';

const escapeHtml = (value: string): string => value.replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char]!));

export function renderWelcomeEmail(data: WelcomeEmailData): string {
  const frontend = new URL(data.frontendUrl);
  if (!['https:', 'http:'].includes(frontend.protocol)) throw new Error('Invalid frontend URL');
  const baseUrl = frontend.origin;
  const name = escapeHtml(data.name);
  const companyName = escapeHtml(data.companyName);
  const email = escapeHtml(data.email);
  const initialPassword = data.initialPassword ? escapeHtml(data.initialPassword) : null;
  const loginUrl = escapeHtml(baseUrl + '/login');
  const panelUrl = escapeHtml(baseUrl + '/dashboard');
  const logoUrl = escapeHtml(baseUrl + '/logo.png');

  const steps = [
    {
      title: 'Paso 1. Crea las categorías de tus productos',
      description: 'Agrupa tus productos en familias para mantener el catálogo ordenado. Por ejemplo, un chocolate puede pertenecer a la categoría <strong style="color:#172b43;">Confites</strong>.',
    },
    {
      title: 'Paso 2. Registra las marcas con las que trabajas',
      description: 'Registra las marcas comerciales que identifican a tus productos. Las encontrarás en sus envases o etiquetas y podrás asociarlas a cada producto de tu catálogo.',
    },
    {
      title: 'Paso 3. Ingresa tus productos y su imagen principal',
      description: 'En el módulo <strong style="color:#172b43;">Productos</strong>, crea cada producto, completa todos los campos requeridos y agrega su imagen principal. Asigna la categoría y la marca que registraste en los pasos anteriores.',
    },
    {
      title: 'Paso 4. Registra los proveedores de tu negocio',
      description: 'Registra las empresas o personas que abastecen tu negocio. Completa sus datos de contacto para identificar fácilmente a tus proveedores.',
    },
  ];

  const stepRows = steps.map((step, index) => `
    <tr><td style="padding:0 0 14px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#ffffff" style="width:100%;border:1px solid #e4ebf3;border-radius:14px;border-collapse:separate;">
        <tr>
          <td width="44" valign="top" class="step-number" style="width:44px;padding:23px 0 23px 20px;">
            <table role="presentation" width="36" cellspacing="0" cellpadding="0" border="0"><tr><td width="36" height="36" align="center" bgcolor="#e4f5fb" style="width:36px;height:36px;border-radius:10px;color:#007ba6;font-size:14px;line-height:36px;font-weight:700;">0${index + 1}</td></tr></table>
          </td>
          <td class="step-copy" valign="top" style="padding:22px 24px 23px 16px;">
            <h3 style="margin:0 0 9px;color:#12263d;font-size:17px;line-height:25px;font-weight:700;">${step.title}</h3>
            <p style="margin:0;color:#52657c;font-size:14px;line-height:23px;">${step.description}</p>
          </td>
        </tr>
      </table>
    </td></tr>`).join('');

  return `<!DOCTYPE html>
<html lang="es" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>¡Bienvenido a NexoPOS!</title>
  <!--[if mso]><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml><![endif]-->
  <style>
    body, table, td, a { -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
    table, td { mso-table-lspace:0pt; mso-table-rspace:0pt; }
    img { border:0; outline:none; text-decoration:none; -ms-interpolation-mode:bicubic; }
    a[x-apple-data-detectors] { color:inherit !important; text-decoration:none !important; }
    @media only screen and (max-width:600px) {
      .outer { padding:12px 8px !important; }
      .content-pad { padding-left:22px !important; padding-right:22px !important; }
      .hero-title { font-size:32px !important; line-height:38px !important; }
      .hero-pad { padding-top:30px !important; padding-bottom:30px !important; }
      .step-number { padding-left:12px !important; width:38px !important; }
      .step-copy { padding:18px 14px 20px 12px !important; }
      .brand-label { font-size:10px !important; letter-spacing:1px !important; }
      .account-value { overflow-wrap:anywhere !important; word-break:break-word !important; }
      .button-link { display:block !important; padding-left:16px !important; padding-right:16px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;width:100%;background-color:#eef3f8;font-family:Arial,Helvetica,sans-serif;color:#172b43;">
  <div aria-hidden="true" style="display:none;font-size:1px;line-height:1px;color:#eef3f8;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">Tu guía de inicio: categorías, marcas, productos y proveedores. Te acompañamos en cada paso.</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#eef3f8" style="width:100%;table-layout:fixed;">
    <tr><td class="outer" align="center" style="padding:36px 16px;">
      <!--[if mso]><table role="presentation" width="640" align="center" cellspacing="0" cellpadding="0" border="0"><tr><td><![endif]-->
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#ffffff" style="width:100%;table-layout:fixed;max-width:640px;border:1px solid #e0e8f1;border-radius:22px;overflow:hidden;border-collapse:separate;box-shadow:0 12px 36px rgba(16,40,65,0.07);">
        <tr><td class="content-pad" style="padding:7px 40px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr>
            <td valign="middle"><img src="${logoUrl}" alt="NexoPOS" width="144" height="72" style="display:block;width:144px;height:72px;color:#002b43;font-size:22px;font-weight:700;"></td>
            <td align="right" valign="middle" class="brand-label" style="color:#60738b;font-size:10px;line-height:16px;letter-spacing:1.6px;font-weight:700;">TU NEGOCIO.<br>TU SIGUIENTE PASO.</td>
          </tr></table>
        </td></tr>
        <tr><td class="content-pad hero-pad" bgcolor="#10273f" style="padding:34px 40px 36px;background-color:#10273f;background-image:linear-gradient(120deg,#10273f 0%,#063b53 100%);">
          <p style="margin:0 0 17px;font-size:11px;line-height:16px;font-weight:700;letter-spacing:2px;color:#67dbed;">BIENVENIDO A TU NUEVO ESPACIO</p>
          <h1 class="hero-title" style="margin:0 0 15px;color:#ffffff;font-size:38px;line-height:44px;font-weight:700;letter-spacing:-1px;">Un buen comienzo<br>para tu negocio.</h1>
          <p style="margin:0;max-width:460px;color:#d4e6f0;font-size:15px;line-height:24px;">Organiza tu catálogo y prepara tu negocio para comenzar a trabajar con NexoPOS.</p>
        </td></tr>
        <tr><td height="4" bgcolor="#13b8cd" style="height:4px;line-height:4px;font-size:1px;">&nbsp;</td></tr>
        <tr><td class="content-pad" style="padding:30px 40px 26px;">
          <h2 style="margin:0 0 10px;color:#12263d;font-size:21px;line-height:29px;font-weight:700;">Hola, ${name}.</h2>
          <p style="margin:0 0 22px;color:#52657c;font-size:15px;line-height:24px;">Tu espacio de trabajo ya está disponible. Estos son los datos de tu cuenta:</p>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#f4f8fc" style="width:100%;border:1px solid #e4ebf3;border-radius:12px;border-collapse:separate;">
            <tr><td style="padding:18px 20px 7px;"><p style="margin:0 0 4px;color:#60738b;font-size:10px;line-height:15px;font-weight:700;letter-spacing:1.2px;">EMPRESA</p><p class="account-value" style="margin:0;color:#12263d;font-size:15px;line-height:23px;font-weight:700;overflow-wrap:anywhere;word-break:break-word;">${companyName}</p></td></tr>
            <tr><td style="padding:7px 20px 18px;"><p style="margin:0 0 4px;color:#60738b;font-size:10px;line-height:15px;font-weight:700;letter-spacing:1.2px;">CORREO DE ACCESO</p><p class="account-value" style="margin:0;color:#172b43;font-size:14px;line-height:22px;overflow-wrap:anywhere;word-break:break-word;">${email}</p></td></tr>
            ${initialPassword ? `<tr><td style="padding:0 20px 18px;"><p style="margin:0 0 4px;color:#60738b;font-size:10px;line-height:15px;font-weight:700;letter-spacing:1.2px;">CONTRASEÑA INICIAL</p><code class="account-value" style="display:block;margin:0;color:#172b43;font-family:monospace;font-size:15px;line-height:23px;white-space:pre-wrap;overflow-wrap:anywhere;word-break:break-word;">${initialPassword}</code></td></tr>` : ''}
          </table>
          <p style="margin:12px 0 20px;color:#60738b;font-size:12px;line-height:19px;">${initialPassword ? 'Ingresa con el correo de acceso y la contraseña inicial indicados arriba. Puedes cambiar tu contraseña desde tu panel.' : 'Ingresa con tu contraseña actual. Si necesitas ayuda para acceder, contáctanos por los canales de soporte que encontrarás más abajo.'}</p>
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" class="button-table"><tr><td bgcolor="#008bb9" align="center" style="border-radius:9px;mso-padding-alt:14px 26px;"><a class="button-link" href="${loginUrl}" target="_blank" style="display:inline-block;padding:14px 26px;border:1px solid #008bb9;border-radius:9px;color:#ffffff;font-size:14px;line-height:20px;font-weight:700;text-decoration:none;">Ingresar a mi panel &rarr;</a></td></tr></table>
        </td></tr>
        <tr><td class="content-pad" style="padding:0 40px;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td height="1" bgcolor="#e4ebf3" style="height:1px;line-height:1px;font-size:1px;">&nbsp;</td></tr></table></td></tr>
        <tr><td class="content-pad" style="padding:26px 40px 16px;">
          <p style="margin:0 0 7px;color:#007ba6;font-size:10px;line-height:16px;letter-spacing:1.5px;font-weight:700;">TU GUÍA DE INICIO</p>
          <h2 style="margin:0 0 9px;color:#12263d;font-size:24px;line-height:31px;font-weight:700;">Cuatro pasos para empezar</h2>
          <p style="margin:0;color:#52657c;font-size:14px;line-height:23px;">Sigue este orden para construir una base organizada para tu negocio.</p>
        </td></tr>
        <tr><td class="content-pad" style="padding:0 40px 14px;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">${stepRows}</table></td></tr>
        <tr><td class="content-pad" style="padding:0 40px 32px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#ecf9f6" style="width:100%;border:1px solid #ccece4;border-radius:14px;border-collapse:separate;">
            <tr><td style="padding:24px;">
              <p style="margin:0 0 8px;color:#16745f;font-size:10px;line-height:16px;font-weight:700;letter-spacing:1.4px;">ESTAMOS PARA AYUDARTE</p>
              <h2 style="margin:0 0 10px;color:#103f38;font-size:21px;line-height:28px;font-weight:700;">¿Necesitas soporte?</h2>
              <p style="margin:0 0 19px;color:#355f57;font-size:14px;line-height:23px;">Puedes enviarnos un mensaje interno desde tu panel de usuario o escribirnos al chat de soporte por WhatsApp.</p>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr><td bgcolor="#126b57" align="center" style="border-radius:8px;mso-padding-alt:12px 20px;"><a class="button-link" href="${SUPPORT_WHATSAPP_URL}" target="_blank" style="display:inline-block;padding:12px 20px;border:1px solid #126b57;border-radius:8px;color:#ffffff;font-size:13px;line-height:20px;font-weight:700;text-decoration:none;">Abrir chat de WhatsApp &rarr;</a></td></tr></table>
              <p style="margin:15px 0 0;font-size:13px;line-height:21px;"><a href="${panelUrl}" target="_blank" style="color:#126b57;text-decoration:underline;font-weight:700;">Ir a mi panel para enviar un mensaje</a></p>
            </td></tr>
          </table>
        </td></tr>
        <tr><td class="content-pad" bgcolor="#f7f9fc" style="padding:22px 40px;border-top:1px solid #e4ebf3;">
          <p style="margin:0 0 6px;color:#172b43;font-size:12px;line-height:19px;font-weight:700;">NexoPOS &middot; Gestión para tu negocio</p>
          <p style="margin:0;color:#6a7c91;font-size:11px;line-height:18px;">Recibes este correo porque tienes una cuenta en NexoPOS. Para solicitar ayuda, utiliza los canales de soporte indicados arriba.</p>
          <p style="margin:9px 0 0;color:#6a7c91;font-size:11px;line-height:18px;">&copy; ${new Date().getFullYear()} NexoPOS. Todos los derechos reservados.</p>
        </td></tr>
      </table>
      <!--[if mso]></td></tr></table><![endif]-->
    </td></tr>
  </table>
</body>
</html>`.trim();
}
