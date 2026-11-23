# Ficha de clientes y control de sucursales

Cada empresa tiene una ficha en Gestión de clientes con datos generales, usuarios, sucursales, servicios, suscripción, límites, actividad y acciones.

## Alta de un cliente desde el superadmin

En Clientes, el botón **Nuevo cliente** solicita nombre de empresa, teléfono, nombre y correo del administrador y una contraseña inicial (mínimo 8 caracteres y máximo 72 bytes). RUT, giro y dirección son opcionales. Al guardar se abre la ficha para configurar plan, servicios y límites.

`POST /admin/tenants` exige una sesión SUPER_ADMIN. Reutiliza el alta transaccional para crear empresa activa, Casa Matriz habilitada, usuario TENANT_ADMIN y configuración base. El registro CLIENT_CREATED conserva el actor dentro de la misma transacción. La respuesta contiene identificadores y datos del cliente, sin hashes ni tokens; se conserva la sesión del superadmin.

Se intenta la bienvenida mediante el servicio existente; un fallo de correo no revierte la cuenta. La misma plantilla de bienvenida incluye el correo de acceso y la contraseña inicial al crear la cuenta. La clave se pasa al servicio de correo solo en memoria; la base de datos conserva el hash y los registros de envío no almacenan la clave. Los reenvíos mantienen el acceso con la contraseña actual, sin recuperarla ni cambiarla. El correo se normaliza a minúsculas y se validan duplicados, RUT y campos obligatorios antes de completar el alta.

Las pruebas de alta están en `auth.service.spec.ts`, `tenants.service.spec.ts` y `create-client.controller.spec.ts`. Con una vista local en el puerto 5174, `node apps/web/verify-create-client.cjs` comprueba el formulario en escritorio y móvil con API simulada, sin crear cuentas ni enviar correos reales.

## Autocompletado tributario en el registro

El registro público y Nuevo cliente del superadmin permiten consultar un RUT opcional y completar razón social, giro y dirección. Se reutiliza el proveedor tributario existente. El nombre del administrador se mantiene separado del nombre de la empresa. Los datos son editables y una consulta sin resultados no impide el registro manual.

`GET /common/registration-rut-lookup/:rut` funciona antes de iniciar sesión. Valida el dígito verificador, limita solicitudes por origen y consultas totales al proveedor, comparte consultas simultáneas y conserva resultados brevemente en memoria. Devuelve solo campos tributarios permitidos, sin respuesta cruda del proveedor ni credenciales. El endpoint anterior de Clientes y Proveedores sigue autenticado. El registro no utiliza datos ficticios de desarrollo si falla el proveedor.

La interfaz espera una pausa al escribir, evita consultas con RUT inválido y descarta respuestas de un RUT anterior. No reemplaza datos editados manualmente mientras se consulta. Las pruebas del workflow cubren ambos registros en escritorio y móvil, la edición manual, las respuestas tardías y la persistencia de los datos tributarios.

## Control del superadmin

- Crear, editar, habilitar, deshabilitar y eliminar usuarios sin historial. Las cuentas de plataforma se protegen. Si un usuario tiene actividad, se deshabilita para conservar la trazabilidad; eliminar la empresa completa permite retirar sus datos operativos.
- Asignar roles y sucursales del mismo cliente; restablecer contraseñas sin enviarlas por correo. Una contraseña nueva invalida los tokens anteriores.
- Crear, editar, designar matriz y habilitar/deshabilitar sucursales por empresa. La principal continúa habilitada al registrarse; las adicionales se crean deshabilitadas salvo decisión expresa del superadmin.
- Solo se eliminan sucursales sin usuarios, existencias ni historial. Las demás se pueden deshabilitar. Una sucursal deshabilitada no registra operaciones nuevas y permite cerrar cajas que estuvieran abiertas.
- Asignar planes y límites; modificar datos y estado de suscripción. El estado local de acceso no cancela por sí mismo contratos de cobro de proveedores externos.
- Decidir por empresa qué módulos se habilitan, incluso si están incluidos en el plan. Usar base elimina la excepción manual y conserva la configuración heredada.
- Suspender o reactivar la empresa. Los tokens se verifican contra el usuario y empresa actuales; los cambios no dependen de volver a iniciar sesión.

El panel del cliente muestra sus sucursales y sus estados. No crea ni habilita sucursales. Las rutas correspondientes también exigen SUPER_ADMIN; ocultar el botón no es la medida de autorización.

Los cambios de plan desde el cliente generan una solicitud en su chat de soporte. Los endpoints de activación de addons o cambios/pagos simulados quedan reservados al superadmin. Se conserva el flujo de pago real existente.

Los accesos SSO requieren una sesión autenticada para emitir tokens. No se pueden emitir tokens para usuarios ajenos desde una cuenta normal. Los módulos y roles vigentes se obtienen del servidor; se revocan conexiones Socket.IO/SSE y se actualizan los permisos visibles del panel.

## Eliminación completa

La ficha muestra un resumen de datos y exige la frase ELIMINAR <slug> y la contraseña actual del superadmin. El borrado de una cuenta propia de plataforma o de una empresa con SUPER_ADMIN se rechaza.

La eliminación se realiza en una transacción serializable, verificando referencias entre empresas antes de borrar usuarios, sucursales, catálogo, inventario, ventas, compras, cajas, traspasos, créditos, cotizaciones, integraciones, facturas y conversaciones internas. Un fallo de base de datos revierte toda la operación. Se conserva un registro administrativo mínimo, sin contraseñas ni copia de datos operativos, para identificar la acción.

Después de confirmar la transacción se retiran los archivos locales vinculados o con propiedad registrada, preservando los que utilice otra empresa. Los nuevos uploads registran su propietario, incluso si todavía no se asignaron a un producto. Los archivos legados sin vínculo ni propietario confiable no se eliminan por inferencia.

Las copias de respaldo, correos ya enviados, historial de notificaciones de la plataforma y datos de proveedores externos se conservan. La eliminación no borra tiendas Shopify/WooCommerce ni cancela automáticamente contratos externos.

Si falla la limpieza de algún archivo, la cuenta ya no existe y el registro CLIENT_ACCOUNT_DELETED conserva filesPending. La respuesta informa el número pendiente. Un superadmin puede reintentar la limpieza mediante POST /admin/tenants/deleted-records/:auditId/cleanup. Se rechaza limpiar una cuenta que actualmente exista, por ejemplo después de restaurar un respaldo.

## Migración y publicación

20261118060000_client_management añade:
- User.isActive, por defecto true para conservar el acceso existente.
- User.tokenVersion, por defecto 0, compatible con los JWT de login actuales.
- TenantModuleOverride, para decisiones por empresa.
- UploadAsset, para propiedad y retirada segura de archivos.

La sucursal principal no cambia de estado al aplicar la migración. No hay borrado de cuentas durante la publicación.

La rama feature/client-management ejecuta validación y no despliega. El despliegue de producción permanece limitado a main y utiliza el respaldo y la recuperación existentes.

## Comprobación aislada

El workflow comprueba primero la migración sobre el esquema anterior y un usuario existente. Luego compila API/web, ejecuta lint y pruebas de bienvenida y avisos, y levanta API/web con PostgreSQL desechable.

check-client-management.cjs exige release-db/release_check y NEXOPOS_CLIENT_CHECK=1. Cubre permisos, fichas sin hashes, límites, asignaciones, sesiones, módulos heredados, cierre de caja, propiedad de archivos, protección de plataforma, referencias cruzadas, fallo tardío con rollback y eliminación del grafo completo conservando otra empresa y archivos compartidos.

check-client-ui.cjs ejercita formularios reales en Chromium, estados de sucursales, módulos, confirmación y eliminación de una cuenta ficticia y el panel del cliente sin creación de sucursales. Genera capturas de escritorio y móvil. El artefacto client-management-preview incluye solamente PNG con datos ficticios; no incluye el contexto de autenticación de las pruebas.

Estas comprobaciones no usan credenciales de producción ni envían correos reales.
