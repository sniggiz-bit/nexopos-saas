# Bienvenida de nuevos comercios

El registro de una empresa intenta enviar la bienvenida a su administrador después de crear la cuenta. Un fallo de correo no revierte el registro.

En Superadmin → Gestión de Clientes → ficha del cliente → Info se puede consultar el último intento por administrador y reenviar la guía. El reenvío conserva la contraseña y no la incluye en el correo. No se recuperan contraseñas desde sus hashes.

## Configuración

- RESEND_API_KEY: clave de envío del proveedor, configurada en el entorno de la API.
- FROM_EMAIL: remitente autorizado; predeterminado noreply@nexopos.cl.
- FRONTEND_URL: URL pública del frontend; predeterminado https://nexopos.cl. En producción se rechazan HTTP y localhost.

El Compose de producción carga el archivo .env de la raíz. Es necesario recrear el contenedor de la API para aplicar cambios en las variables.

## Seguimiento

Los intentos se guardan en SystemLog con mensaje WELCOME_EMAIL y metadatos de usuario, solicitante, estado y referencia del proveedor. No requiere migraciones. Los registros históricos no se reconstruyen.

- PENDING: se inició el intento, pero aún no hay un resultado registrado. Si persiste, comprobar Resend antes de reenviar.
- ACCEPTED: Resend aceptó la solicitud. No confirma entrega al destinatario.
- FAILED: rechazo o fallo de comunicación; consultar el detalle y Resend antes de reintentar.
- NOT_CONFIGURED: falta la clave o la URL es inválida.

El servidor limita los intentos a uno por minuto por administrador y bloquea envíos simultáneos en la misma instancia de la API. No hay reintentos automáticos. El detalle de entrega y rebotes se consulta en Resend.

Las rutas requieren SUPER_ADMIN y verifican la pertenencia del administrador a la empresa. Las empresas suspendidas no reciben reenvíos.

## Validación

Desde la raíz del repositorio, con las dependencias instaladas y el paquete compartido compilado:

~~~sh
npm run build --workspace @nexopos/shared
npm test --workspace api -- --runInBand --runTestsByPath src/email/email.service.spec.ts src/email/welcome-emails.service.spec.ts src/auth/auth.service.spec.ts
npm run build --workspace api
npm run build --workspace web
~~~

Antes de una prueba real, confirmar que la configuración del servidor usa la cuenta de Resend correcta y acordar un destinatario de prueba. El cambio de código no envía mensajes a cuentas existentes de forma masiva.


## Diseño de la bienvenida y primeros pasos

La plantilla está separada en apps/api/src/email/welcome-email.template.ts y se utiliza desde EmailService. Tiene estructura de tablas, estilos principales en línea, ancho adaptable y una versión de contenido legible sin cargar imágenes. La imagen del logo se sirve desde /logo.png en el frontend configurado.

La guía contiene, en este orden: categorías (familias de productos, con el ejemplo de chocolate y Confites), marcas comerciales de los productos, ingreso de productos con todos los campos requeridos e imagen principal, y proveedores.

El soporte ofrece acceso al panel para enviar un mensaje interno y un botón de WhatsApp a https://wa.me/56940082418, número indicado por el propietario.

Para generar de nuevo la vista previa con datos ficticios y ejecutar las comprobaciones focalizadas de contenido, enlaces y seguridad:

~~~sh
node apps/api/scripts/preview-welcome-email.cjs
~~~

La vista previa autocontenida está en docs/previews/welcome-email.html. Las capturas de revisión están en welcome-email-desktop.png y welcome-email-mobile.png dentro de la misma carpeta. La generación local no envía correos.

La revisión en Chromium comprobó los anchos de 800, 390 y 320 px sin desbordamiento horizontal. La plantilla pasó una comprobación estricta de TypeScript aislada y una prueba del servicio con transporte simulado. La presentación final en clientes de correo debe comprobarse tras desplegar mediante un nuevo envío expresamente autorizado.
