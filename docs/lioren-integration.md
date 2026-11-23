# Facturación electrónica: validación, documentos y conciliación

La configuración se administra por empresa y solo por TENANT_ADMIN/SUPER_ADMIN. GET /dte-config informa hasToken y nunca devuelve la credencial. El campo vacío en el formulario conserva el token existente. Una credencial nueva se valida con Mi Empresa antes de reemplazar la anterior. PATCH /dte-config/:id exige que el id pertenezca a la empresa autenticada.

## Desconectar y usar ventas internas

En Configuración → Conexión de facturación, el administrador puede elegir **Desconectar facturación** y confirmar **Quitar token y usar ventas internas**. DELETE /dte-config/token elimina únicamente la credencial de la empresa autenticada, registra la acción sin secretos y conserva logo, RUT, resolución, ventas y documentos. No modifica otras cuentas ni anula envíos ya realizados. La operación es idempotente y comparte el bloqueo de empresa con la comprobación final de emisión.

GET /dte-config/sales-mode permite al personal autenticado consultar solamente el modo, sin descargar configuración ni credenciales. Sin token, el POS muestra comprobante interno y oculta factura y guía. Las nuevas ventas normales se guardan con dteType 0 y estado INTERNO, mantienen pagos, caja, inventario y PDF interno y nunca se envían al servicio de facturación. Siguen siendo internas si se conecta una credencial posteriormente. Las solicitudes explícitas de factura o guía sin credencial se rechazan antes de modificar inventario. Los documentos históricos conservan su tipo y estado para conciliación.

## Empresa y servicios

GET /dte-config/status consulta Mi Empresa y Tipo Documentos. Distingue conexión, coincidencia de RUT, resolución, certificado, módulos NexoPOS y folios. No usa una credencial global como respaldo de otra empresa ni genera cifras de prueba si falta token. Un fallo se representa como dato no disponible; un cero se reserva para una respuesta válida con cero folios.

POST /dte-config/sync-issuer recibe expectedRut y vuelve a consultar el proveedor antes de actualizar RUT y resolución en una transacción. Verifica que la credencial/configuración no haya cambiado. No cambia nombre comercial, logo, ventas ni documentos históricos. El usuario confirmó que debe usarse la empresa del token actual; la pantalla muestra sus datos y pide confirmación antes de guardarlos.

La información de tipos activos en el servicio de facturación no se presenta como prueba de todos los servicios comerciales contratados. La habilitación efectiva también requiere el módulo NexoPOS, identidad/resolución válidas, certificado vigente y folios disponibles. El número mostrado es el próximo folio informado por /tipodocs, no una estimación desde un CAF ni el máximo de folios históricos.

## Métricas

GET /dte-config/stats separa:

- provider: documentos, aceptados SII y rechazados SII del mes calendario de Chile. Se consultan índices de boletas/DTE con rango explícito y filtros de estado. Los totales parciales no se suman como si estuvieran completos. Se cachean por empresa, credencial, configuración y mes durante 60 segundos; las consultas tienen concurrencia limitada.
- local: confirmados con evidencia de proveedor, registros por conciliar, errores/bloqueos y pendientes de estado. Los registros históricos no se convierten automáticamente en confirmados ni se borran.

No se comparan solo montos para asociar documentos históricos. Los siete registros con enlaces ejemplo-mock y los errores existentes necesitan conciliación manual. Una respuesta de error o un timeout no demuestran que el proveedor no haya emitido el documento.

## Emisión

La emisión no tiene un modo de simulación dentro de producción. Los tests inyectan un proveedor ficticio; nunca usan tokens reales.

Se valida empresa, sucursal y módulo antes del envío y se revalida bajo bloqueo de base de datos. DteSubmission conserva payload inmutable, huella de credencial y clave UUID antes del POST. La clave se envía como X-Idempotency-Check. La huella no es una credencial y no se devuelve a clientes. Un envío registrado no se reenvía automáticamente; los errores históricos tampoco se reintentan.

El payload usa los campos documentados: servicio 3 en boletas, precios brutos en boletas y netos en DTE, cantidades decimales y descuentos por línea, receptor y referencias con los nombres oficiales. Facturas, notas de crédito y guías requieren datos completos del receptor, incluida ciudad. No se inventan identificadores de comuna/ciudad. Las notas de crédito mantienen emisor y receptor vinculados al envío original.

Recibir folio no equivale a aceptación del SII. Los estados diferencian ENVIANDO, EMITIDO/PENDIENTE_SII, ACEPTADO, REPARO, RECHAZADO y PENDIENTE_CONFIRMACION. Las respuestas inciertas bloquean reemisión y anulación interna automática. Un total diferente del registrado queda para revisión.

POST /sales/:id/dte/verify consulta un documento ya identificado en el proveedor. Requiere administrador, misma empresa/emisor, id y total coincidentes. No emite ni asocia automáticamente un registro histórico sin evidencia.

## Notas de crédito

La venta original y el inventario permanecen intactos hasta confirmar ACEPTADO. La aplicación comercial se realiza bajo bloqueo y en una transacción; se aplica una sola vez. No se copian pagos positivos a una nota de crédito. Las ventas con crédito asociado requieren conciliación previa y no se anulan por este flujo automático. Si falla la actualización comercial después de la aceptación, consultar el estado permite reintentar esa transacción sin volver a emitir.

## PDF y comprobantes

El servicio de facturación devuelve el PDF codificado en base64. Se valida su encabezado y tamaño y se entrega por rutas autenticadas, sin publicar el token ni el PDF como un enlace de ejemplo. GET /sales/:id/dte/pdf verifica empresa, emisor y sucursal del usuario. La consulta de PDF por tipo/folio en configuración está limitada al administrador. La interfaz descarga mediante su sesión antes de abrir el PDF.

Los tickets internos/ESC-POS no incluyen un QR fabricado presentado como timbre SII. Los registros sin confirmación no se muestran como documentos oficiales ni se envían por correo con esa denominación.

## Migración y publicación

20261118070000_lioren_integrity añade cuatro campos de confirmación a Sale, DteSubmission y Customer.city. No transforma datos fiscales existentes. DteSubmission se elimina por cascada con su venta/empresa y participa en las comprobaciones de referencias entre empresas del borrado completo.

La rama feature/lioren-corrections valida sin desplegar. La publicación en main utiliza el respaldo y recuperación existentes. Sincronizar RUT/resolución es una operación explícita adicional: la migración no copia datos del proveedor ni emite documentos.

## Validación aislada

- Jest verifica contrato, idempotencia, PDF, ausencia de folios ficticios, identidad, certificado, token enmascarado, propiedad, roles, reemplazos fallidos y métricas parciales.
- check-lioren-integrity.cjs exige release-db/release_check y NEXOPOS_LIOREN_CHECK=1. Usa PostgreSQL real y un proveedor inyectado ficticio para concurrencia, una sola emisión, cantidades decimales, descuentos, respuestas inciertas, conservación de históricos, notas de crédito, inventario y eliminación de los nuevos registros.
- check-lioren-ui.cjs usa respuestas de proveedor ficticias en Chromium para formularios, confirmación de emisor, token vacío, métricas, estados desconocidos y vistas de escritorio/móvil.

Fuentes oficiales: [Mi Empresa](https://www.lioren.cl/docs#/api-miempresa), [Tipo Documentos](https://www.lioren.cl/docs#/api-tipodocs), [Boletas](https://www.lioren.cl/docs#/api-emisionboleta), [DTE](https://www.lioren.cl/docs#/api-emisiondte), [Consulta](https://www.lioren.cl/docs#/api-consultadte), [Idempotencia](https://www.lioren.cl/docs#/api-idempotencia).

## Diagnóstico de registros por cliente

El control de registros locales se consulta en Superadmin → Clientes → Ficha → Registros tributarios. Su ruta de lectura `/api/admin/tenants/:id/dte-records` exige SUPER_ADMIN, limita las consultas a la empresa seleccionada y no consulta al proveedor ni modifica documentos. Las categorías pueden superponerse y no se suman a los totales oficiales del servicio de facturación.

La configuración del cliente muestra los datos reales del proveedor, conserva la consulta de documentos con estado pendiente y avisa de intentos actuales que requieren soporte. Los errores históricos sin DteSubmission no activan ese aviso. El resumen del negocio utiliza los rechazos del SII consultados en el servicio de facturación, en lugar del contador de errores locales. No se eliminan ni reemiten registros al consultar estas pantallas.

## Nota de crédito desde Ventas

La acción «Nota de crédito» abre una validación de solo lectura (`GET /api/sales/:id/nota-credito`), visible para administradores de la empresa. Muestra documento original, total, sucursal, impedimentos y una nota existente si la hay. No emite al abrir el diálogo. La emisión exige confirmar expresamente la anulación total y vuelve a validar servicio, folios, emisor, receptor y original. Sin folios o con original sin verificar, no se crea una nueva nota bloqueada.

Se admiten originales de tipo 33 y 39, con receptor coincidente y datos completos conforme al contrato de DTE del servicio de facturación. Los tickets internos, notas, guías, originales históricos sin confirmar y ventas con crédito asociado no se anulan por esta acción. Fuente del contrato: https://cl.lioren.enterprises/docs#/api-emisiondte .

Una nota existente no se duplica. Su estado puede consultarse desde la misma acción o desde su fila. La anulación de la venta y la devolución de inventario se aplican una sola vez tras la aceptación SII. No se automatiza una devolución de dinero ni se ofrecen anulaciones parciales. En móvil las ventas se presentan como tarjetas con las acciones a la vista.
