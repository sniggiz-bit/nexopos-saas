ALTER TABLE "Sale" ADD COLUMN "offlineId" TEXT,
  ADD COLUMN "offlineReceipt" TEXT,
  ADD COLUMN "offlinePayment" TEXT;

CREATE UNIQUE INDEX "Sale_tenantId_offlineId_key" ON "Sale"("tenantId", "offlineId");

-- Update the former default copy if it was saved through landing administration.
UPDATE "LandingConfig"
SET "data" = replace(replace("data"::text, to_jsonb($text$Busca el producto por código de barra, nombre o categoría en milisegundos. El sistema calcula cambios, descuentos y propinas automáticamente. Múltiples métodos de pago en un clic. Funciona offline si cae el internet. Compatible con impresoras térmicas 57mm y 80mm, lectores de barra y gavetas electrónicas.$text$::text)::text, to_jsonb($text$Busca productos por código, nombre o categoría. Con el catálogo guardado y un turno abierto, la caja puede seguir registrando ventas y pagos recibidos durante un corte. Compatible con impresoras térmicas, lectores de barra y gavetas electrónicas.$text$::text)::text), to_jsonb($text$Sí. El módulo de caja cuenta con modo offline inteligente. Puedes seguir vendiendo y registrando pagos sin conexión. Tan pronto vuelva la señal, los datos se sincronizan automáticamente con la nube sin intervención manual.$text$::text)::text, to_jsonb($text$Sí. Con un turno abierto y el catálogo guardado, el POS registra efectivo o pagos ya confirmados por otro medio. Las ventas se conservan en este equipo y se sincronizan automáticamente al volver la conexión o al reabrir la caja. Si la facturación está habilitada, ingresa la referencia del documento ya emitido por contingencia.$text$::text)::text)::jsonb,
    "updatedAt" = CURRENT_TIMESTAMP
WHERE strpos("data"::text, to_jsonb($text$Busca el producto por código de barra, nombre o categoría en milisegundos. El sistema calcula cambios, descuentos y propinas automáticamente. Múltiples métodos de pago en un clic. Funciona offline si cae el internet. Compatible con impresoras térmicas 57mm y 80mm, lectores de barra y gavetas electrónicas.$text$::text)::text) > 0
   OR strpos("data"::text, to_jsonb($text$Sí. El módulo de caja cuenta con modo offline inteligente. Puedes seguir vendiendo y registrando pagos sin conexión. Tan pronto vuelva la señal, los datos se sincronizan automáticamente con la nube sin intervención manual.$text$::text)::text) > 0;
