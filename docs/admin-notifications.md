# Avisos por correo al administrador

Los avisos se envían al destinatario de ADMIN_EMAIL, con sniggiz@gmail.com como valor predeterminado. El correo del nuevo usuario sigue siendo independiente del aviso al administrador.

## Altas de usuarios

- El registro de una nueva empresa avisa después de crear la empresa, su sucursal y el administrador. Incluye nombre, correo, empresa, teléfono, rol, sucursal inicial y fecha en horario de Chile.
- La creación de usuarios internos también avisa, con nombre, correo, empresa, rol y fecha. No modifica los campos de respuesta de la API de usuarios.
- El botón del aviso abre la ficha de la empresa y su lista de usuarios en el superadmin.
- Los avisos no incluyen contraseñas, hashes ni tokens de acceso.

## Mensajes de soporte

Cada mensaje del usuario desde su panel se guarda en una conversación asociada a su cuenta y empresa. La conversación se reutiliza entre pestañas y al volver a entrar al panel, sin mezclar empresas. Los mensajes que antes solo existían en la memoria del navegador no se reconstruyen.

El correo incluye usuario, correo de contacto, empresa y texto del mensaje. Su botón Responder en el chat abre /admin/live-chats?session=UUID y selecciona la conversación indicada. El chat público conserva sus alertas y ahora también proporciona el enlace a su conversación concreta.

La respuesta del administrador se guarda y puede verse desde el chat interno del usuario, también al regresar después. El widget actualiza el historial cada cinco segundos mientras está abierto y la página está visible. El historial cargado contiene los últimos 200 mensajes. Las respuestas del administrador y las confirmaciones automáticas no generan nuevos correos al administrador.

Si la sesión está cerrada, se solicita el login y luego se conserva el destino del enlace, incluida la conversación. Se exige rol SUPER_ADMIN para leer la bandeja y responder; el enlace no contiene credenciales ni permite omitir la autenticación. El canal de eventos del superadmin y las salas de soporte interno verifican la identidad autorizada.

## Configuración y despliegue

En el entorno de la API:

~~~dotenv
ADMIN_EMAIL=sniggiz@gmail.com
FRONTEND_URL=https://nexopos.cl
~~~

Se mantienen RESEND_API_KEY y FROM_EMAIL del envío existente. El archivo .env local no cambia el entorno del contenedor de producción por sí solo.

Actualizar primero la API y después el frontend. Estos cambios utilizan ChatSession, ChatMessage, SystemNotification y SystemLog existentes; no añaden migraciones de esquema. El frontend nuevo requiere la API actualizada para recuperar el historial y las respuestas.

El registro o el mensaje no se revierten si falla el envío de correo. El resultado se registra en SystemLog como ADMIN_EMAIL_NOTIFICATION, con referencia de la notificación, estado y referencia del proveedor, sin copiar el mensaje del usuario al log de envío. ACCEPTED indica aceptación por Resend, no entrega final. No se han añadido reintentos automáticos de correo.

## Comprobaciones realizadas

~~~sh
node --test apps/api/scripts/check-admin-notifications.cjs
node apps/api/scripts/preview-admin-notifications.cjs
~~~

Las 21 comprobaciones focalizadas usan una base de datos y transporte simulados; cubren creación del aviso, destinatario, registros nuevos e internos, enlaces, validación, historial y respuestas, controles de acceso, escape HTML, errores de envío y destino tras login. También se comprobó el widget con React real en Chromium y una API simulada: envío, recepción de respuesta, reapertura del historial y conservación del borrador ante fallo.

Los helpers de redirección y la plantilla administrativa pasaron una comprobación estricta aislada de TypeScript. Las vistas previas de registro y chat están en docs/previews. La compilación global sigue pendiente porque la instalación local carece de dependencias como class-validator, axios, socket.io, Vite y vite-plugin-pwa, además de otros errores de resolución. Debe completarse antes de desplegar.

No se enviaron correos reales ni se modificó producción durante estas comprobaciones. Después del despliegue falta comprobar el recorrido con una cuenta de prueba y un envío expresamente autorizado.
