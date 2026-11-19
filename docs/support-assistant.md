# Asistente de soporte y atención humana

## Activación

1. En Superadmin → Base de soporte, revisar los temas iniciales. Agregar preguntas, respuestas y variantes; publicar solo instrucciones verificadas.
2. Elegir visibilidad: clientes autenticados, visitantes del sitio o ambos. Los borradores y archivados nunca se suministran al asistente.
3. En Gemini y configuración, ingresar la clave de Google AI Studio, verificar la conexión, seleccionar un modelo disponible y establecer el límite diario.
4. Activar Gemini y guardar. El chat público requiere una opción adicional. Sin Gemini, las preguntas iniciales y sus variantes siguen funcionando.

La integración utiliza la base publicada como contexto en cada consulta. No modifica ni afina los pesos del modelo. La verificación lista modelos; no demuestra disponibilidad de cuota para generar texto ni configura facturación. Revisar las condiciones de datos y las cuotas del proyecto de Google antes de activarlo para clientes.

## Datos y credenciales

- La clave es de escritura: las respuestas de la API solo indican si hay una clave configurada. Se cifra con AES-256-GCM y una clave derivada mediante HKDF.
- Preferir SUPPORT_ENCRYPTION_KEY dedicado y persistente. Si no se configura, se deriva de JWT_SECRET. Rotar el secreto usado para cifrar exige volver a ingresar la clave de Gemini; respaldarlo junto al procedimiento de recuperación.
- GEMINI_API_KEY puede configurarse en el servidor como alternativa a la clave guardada. La clave guardada tiene prioridad. No se envía al navegador, a los prompts ni a los registros.
- Gemini recibe la consulta, hasta ocho mensajes recientes y hasta seis artículos publicados de la audiencia correspondiente. No consulta las bases de clientes, ventas o documentos tributarios. No agregar datos privados de clientes a los artículos.
- El límite de consultas se reserva atómicamente por día UTC, incluyendo intentos fallidos. No sustituye los límites de gasto del proyecto de Google.

## Conversaciones

BOT → WAITING_HUMAN → HUMAN → RESOLVED. Una solicitud explícita de persona evita Gemini. Una consulta desconocida puede pedir una aclaración; si continúa sin solución, se deriva. Un fallo del proveedor o una respuesta sin fuentes válidas también deriva. Los artículos cambiados o retirados durante una generación invalidan la respuesta pendiente.

Tomar o responder una conversación pausa al asistente y descarta respuestas de IA en vuelo. Solo el superadmin puede reactivarlo. Una nueva consulta después de resolver inicia otro ciclo. Se conservan hasta 200 mensajes recientes en la vista; el historial completo permanece en la base.

Cada mensaje del cliente admite un UUID de idempotencia. Las escrituras de una conversación se serializan en la base y llevan una secuencia. Un procesamiento interrumpido por más de 45 segundos se transforma en solicitud de atención humana.

Las conversaciones internas se identifican por empresa y usuario obtenidos del JWT y verificados en la base. Las públicas usan un UUID aleatorio como capacidad de acceso: no compartir esos identificadores. El navegador lo conserva antes del primer envío para permitir recuperación tras errores de red. El chat público tiene límites de mensajes por conversación y por dirección de conexión; desplegar detrás de un proxy concentra ese límite de conexión. Se recomienda ajustar la limitación en el proxy de confianza si el tráfico público aumenta.

## Correo y recuperación

Al derivar, una transacción guarda el estado, el aviso del panel y una entrada de salida de correo. ADMIN_EMAIL determina el destinatario; por defecto sniggiz@gmail.com. El botón usa FRONTEND_URL y /admin/live-chats?session=<id>. El acceso requiere superadmin y conserva el destino después del inicio de sesión.

El procesador se ejecuta cada 10 segundos, usa reservas exclusivas y reintenta hasta cinco veces con espera creciente. Cada intento lleva la misma clave de idempotencia de Resend. No reintenta después de 23 horas, dentro de la ventana documentada de 24 horas del proveedor. ACCEPTED significa aceptado por Resend, no entrega confirmada en Gmail. El estado de correo se ve en el chat administrativo; FAILED requiere revisión de la configuración y del proveedor. SUPPORT_WORKER_ENABLED=0 desactiva el procesador y solo se usa en las pruebas aisladas.

Las conversaciones existentes se migran con el bot pausado; las cerradas quedan resueltas. No se generan avisos nuevos por el historial anterior. Las cuentas eliminadas borran sus conversaciones y entradas de salida mediante cascada.

## Validación

Pruebas unitarias de cifrado, contrato Gemini y fuentes; integración sobre release-db/release_check con proveedores simulados; migración sobre migration_check; formularios y conversaciones reales en navegador de escritorio y móvil. No requieren claves reales ni envían correos externos. El despliegue conserva respaldo y verificaciones de salud del procedimiento existente.

Referencias: https://ai.google.dev/gemini-api/docs/pricing y https://resend.com/docs/dashboard/emails/idempotency-keys.
