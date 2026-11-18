# Ficha de clientes y control de sucursales

Cada empresa tiene una ficha en Gestión de clientes con datos generales, usuarios, sucursales, servicios, suscripción, límites, actividad y acciones.

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
