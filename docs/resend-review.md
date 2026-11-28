# Revisión de Resend — 16 de noviembre de 2026

Revisión de solo lectura, tras confirmar el usuario que la clave del archivo .env es la utilizada en producción. No se enviaron correos ni se modificaron claves.

## Evidencia

- El listado consultado contiene 69 envíos; has_more=false. Esto describe el historial disponible, no todos los envíos históricos de la cuenta.
- Intervalo disponible: 11-11-2026, 9:34:54 a. m. a 13-11-2026, 9:36:24 p. m. (America/Santiago).
- Estados: 32 entregados y 37 rebotados. No aparece el asunto de bienvenida de NexoPOS.
- Se observan asuntos como “Review your Prime Membership” y “Ending Soon: 20% Off Sitewide”, además de remitentes variables bajo @nexopos.cl. Son indicios de actividad ajena al flujo revisado, sujetos a confirmación del propietario.
- El listado de claves contiene “nexopos.cl” y “Correos Tecnomedia POS”. El último uso registrado de esta última coincide en el mismo segundo con el último envío listado. Esta coincidencia es un indicio; no prueba qué clave originó cada mensaje. El uso reciente de “nexopos.cl” también incluye nuestras consultas.
- .env y apps/api/.env no están versionados actualmente. La ruta pública /.env respondió HTML, sin variables de entorno ni la clave configurada. Estas comprobaciones no descartan exposiciones anteriores u otras vías.

## Pendiente

Confirmar si el propietario reconoce esos envíos y la integración Tecnomedia. El endpoint de listado devuelve los envíos del equipo, no una atribución por clave: https://resend.com/docs/api-reference/emails/list-emails

Si los envíos no son reconocidos, revisar los registros de Resend para atribuirlos y coordinar la sustitución de las credenciales de las integraciones afectadas. Instalar y comprobar los reemplazos antes de revocar claves utilizadas por servicios legítimos. La clave nueva del sistema debe limitarse a envío y al dominio necesario. No registrar los valores de las claves en documentación, código ni chats.


## Contraste con el código local

El propietario indica que no recuerda si reconoce los envíos o la integración Tecnomedia. Por ello su autorización permanece sin confirmar; no se han revocado ni generado credenciales.

En el código versionado revisado, las llamadas a api.resend.com y la configuración FROM_EMAIL se concentran en apps/api/src/email/email.service.ts. Sus cuatro flujos producen estos asuntos:

- ¡Bienvenido a NexoPOS!
- Cotización seguida del número y del nombre de la empresa.
- Tu comprobante de venta seguido del tipo de documento, folio y NexoPOS.
- NexoPOS Alerta seguida del título.

La dirección del remitente se obtiene de FROM_EMAIL y es común a estos envíos. Las cotizaciones cambian el nombre visible de la empresa, conservando la dirección de correo. Los asuntos y las direcciones variables observados no corresponden a estos flujos tal como están implementados en el código revisado. No se ha comprobado todavía qué versión exacta se ejecuta en producción ni si otros servicios comparten la cuenta de Resend.

Para continuar es necesario revisar los registros del servidor y de Resend, identificar el uso legítimo de ambas claves y coordinar cualquier sustitución con los servicios afectados. Una modificación del .env local por sí sola no actualiza el entorno del contenedor de producción.


## Configuración observada en producción

El usuario ejecutó consultas de lectura desde Terminal de WHM como root y compartió las salidas el 16 de noviembre de 2026:

- RESEND_API_KEY está definida en el entorno del contenedor nexopos_api. Esta comprobación indica presencia, no verifica por sí sola la autenticación con el proveedor.
- Remitente configurado: hola@nexopos.cl, con nombre visible NexoPOS.
- Origen de FRONTEND_URL: https://nexopos.cl. El fallback a localhost del código local original no se está usando en ese entorno.
- En la consulta de logs de los últimos siete días, limitada a las últimas 20.000 líneas del contenedor actual, los cuatro contadores fueron cero: bienvenidas aceptadas, errores de bienvenida, avisos de falta de clave y errores de Resend. Esto no prueba ausencia histórica de envíos ni confirma entrega: falta conocer la antigüedad del contenedor, las altas recientes y el flujo desplegado.


## Altas recientes y código desplegado

El usuario compartió nuevas consultas de lectura desde WHM Terminal:

- El contenedor nexopos_api figura iniciado en 2026-08-16T18:18:21.06644301Z.
- Se encontró el archivo compilado de AuthService y contiene la referencia de envío de bienvenida. Es una comprobación estática, no prueba de ejecución ni de entrega.
- Empresas creadas en los últimos siete días: 0.
- Última empresa creada: 2026-09-07T00:24:12.000Z.

La ausencia de altas en la ventana consultada es coherente con los contadores de bienvenida en cero. No hay evidencia suficiente para afirmar que el registro actual esté fallando al enviar correos. Sigue pendiente una prueba controlada del transporte con un destinatario expresamente autorizado. Esta prueba no debe crear empresas ni utilizar contraseñas reales; tampoco sustituye una prueba completa del registro.


## Prueba recibida el 17 de noviembre de 2026

El usuario compartió la salida del envío de prueba desde WHM como root, con el mensaje de aceptación de EmailService, y una captura del correo recibido en Gmail con los datos ficticios autorizados. Esto confirma una entrega de la plantilla anterior al destinatario de prueba. No confirma el envío automático en todas las altas ni corresponde al rediseño local realizado después.
