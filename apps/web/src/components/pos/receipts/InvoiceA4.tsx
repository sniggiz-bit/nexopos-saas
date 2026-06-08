import React from 'react';
import { Sale } from '@/api/sales';
import { formatPrice } from '@/utils/formatters';

// ── Mapas de tipo de documento ────────────────────────────────────────────────
const DTE_LABELS: Record<number, string> = {
    39: 'BOLETA ELECTRÓNICA',
    33: 'FACTURA ELECTRÓNICA',
    61: 'NOTA DE CRÉDITO ELECTRÓNICA',
    52: 'GUÍA DE DESPACHO ELECTRÓNICA',
};

interface InvoiceA4Props {
    sale: Sale;
    tenantName?: string;
    tenantRut?: string;
    tenantAddress?: string;
}

export const InvoiceA4: React.FC<InvoiceA4Props> = ({
    sale,
    tenantName = 'NEXOPOS SOFTWARE POS',
    tenantRut = '77.777.777-7',
    tenantAddress = 'Santiago, Chile'
}) => {
    const dteLabel = DTE_LABELS[sale.dteType ?? 39] ?? `DOCUMENTO DTE TIPO ${sale.dteType}`;
    const hasRealPdf = sale.dtePdfUrl && !sale.dtePdfUrl.includes('ejemplo-mock');

    return (
        <div className="invoice-a4" style={{
            width: '210mm',
            minHeight: '297mm',
            padding: '20mm',
            fontFamily: 'Arial, sans-serif',
            fontSize: '14px',
            lineHeight: '1.5',
            color: '#333',
            backgroundColor: '#fff',
            boxSizing: 'border-box'
        }}>
            <style>
                {`
                @media print {
                    @page {
                        margin: 0;
                        size: A4;
                    }
                    body {
                        margin: 0;
                        padding: 0;
                    }
                    .no-print { display: none !important; }
                }
                .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
                .tenant-info h1 { margin: 0; color: #000; font-size: 24px; }
                .doc-type { border: 2px solid #e11d48; padding: 15px; text-align: center; color: #e11d48; min-width: 200px; }
                .doc-type h2 { margin: 0; font-size: 18px; }
                .details-table { width: 100%; border-collapse: collapse; margin: 30px 0; }
                .details-table th { background-color: #f3f4f6; text-align: left; padding: 12px; border-bottom: 2px solid #d1d5db; }
                .details-table td { padding: 12px; border-bottom: 1px solid #e5e7eb; }
                .totals-section { display: flex; justify-content: flex-end; margin-top: 30px; }
                .totals-box { width: 300px; border: 1px solid #d1d5db; border-radius: 8px; padding: 15px; }
                .flex-justify { display: flex; justify-content: space-between; margin-bottom: 8px; }
                .grand-total { border-top: 2px solid #000; padding-top: 10px; font-weight: bold; font-size: 18px; color: #000; }
                .lioren-banner { background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 12px; margin: 20px 0; text-align: center; }
                .lioren-banner a { color: #16a34a; font-weight: bold; text-decoration: none; }
                .draft-notice { background: #fef9c3; border: 1px solid #fde047; border-radius: 8px; padding: 12px; margin: 20px 0; text-align: center; font-size: 12px; color: #854d0e; }
                `}
            </style>

            {/* Enlace al PDF oficial de Lioren (con TED real) — visible en pantalla, oculto al imprimir */}
            {hasRealPdf && (
                <div className="lioren-banner no-print">
                    ✅ <strong>Documento DTE aceptado por el SII</strong> —{' '}
                    <a href={sale.dtePdfUrl!} target="_blank" rel="noopener noreferrer">
                        Ver / Imprimir documento oficial con Timbre Electrónico (TED) →
                    </a>
                </div>
            )}

            {!hasRealPdf && (
                <div className="draft-notice no-print">
                    ⚠️ Este es un comprobante interno de vista previa. El documento oficial con Timbre Electrónico (TED)
                    estará disponible al completar la emisión DTE con Lioren.
                </div>
            )}

            <div className="header">
                <div className="tenant-info">
                    <h1>{tenantName}</h1>
                    <p style={{ margin: '5px 0' }}>{tenantAddress}</p>
                    <p style={{ margin: '0' }}>Contacto: soporte@nexopos.cl</p>
                </div>
                <div className="doc-type">
                    <h2>R.U.T.: {tenantRut}</h2>
                    <h1 style={{ margin: '10px 0', fontSize: '18px' }}>{dteLabel}</h1>
                    <h2>Nº {sale.dteFolio ?? 'SIN FOLIO'}</h2>
                    {sale.dteStatus === 'ACEPTADO' && (
                        <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 'bold' }}>
                            ✓ ACEPTADO SII
                        </span>
                    )}
                    {sale.dteStatus === 'ERROR' && (
                        <span style={{ fontSize: '11px', color: '#dc2626', fontWeight: 'bold' }}>
                            ✗ ERROR EMISIÓN
                        </span>
                    )}
                </div>
            </div>

            <div className="client-info" style={{ marginBottom: '30px' }}>
                <h3 style={{ borderBottom: '1px solid #000', paddingBottom: '5px' }}>Detalle del Cliente</h3>
                {sale.customer ? (
                    <>
                        <p><strong>RUT:</strong> {sale.customer.rut}</p>
                        <p><strong>Nombre:</strong> {sale.customer.name}</p>
                        {(sale.customer as any).giro && <p><strong>Giro:</strong> {(sale.customer as any).giro}</p>}
                        {(sale.customer as any).address && <p><strong>Dirección:</strong> {(sale.customer as any).address}</p>}
                    </>
                ) : (
                    <p>Venta a Cliente Final</p>
                )}
                <p><strong>Fecha Emisión:</strong> {new Date(sale.createdAt).toLocaleString('es-CL')}</p>
            </div>

            <table className="details-table">
                <thead>
                    <tr>
                        <th>Descripción</th>
                        <th style={{ textAlign: 'center' }}>Cant.</th>
                        <th style={{ textAlign: 'right' }}>Precio Unit.</th>
                        <th style={{ textAlign: 'right' }}>Dcto.</th>
                        <th style={{ textAlign: 'right' }}>Total</th>
                    </tr>
                </thead>
                <tbody>
                    {sale.items?.map((item, idx) => (
                        <tr key={idx}>
                            <td>{item.product.name}</td>
                            <td style={{ textAlign: 'center' }}>{Number(item.quantity)}</td>
                            <td style={{ textAlign: 'right' }}>{formatPrice(Number(item.price))}</td>
                            <td style={{ textAlign: 'right' }}>{item.discountAmount ? `-${formatPrice(item.discountAmount)}` : '-'}</td>
                            <td style={{ textAlign: 'right' }}>{formatPrice((Number(item.quantity) * Number(item.price)) - (Number(item.discountAmount) || 0))}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="totals-section">
                <div className="totals-box">
                    <div className="flex-justify">
                        <span>Suma de Items:</span>
                        <span>{formatPrice(sale.total + (sale.discountAmount || 0))}</span>
                    </div>
                    {sale.discountAmount ? (
                        <div className="flex-justify" style={{ color: '#e11d48', fontWeight: 'bold' }}>
                            <span>Total Descuentos:</span>
                            <span>-{formatPrice(sale.discountAmount)}</span>
                        </div>
                    ) : null}
                    <div className="flex-justify">
                        <span>Monto Neto:</span>
                        <span>{formatPrice(Math.round(sale.total / 1.19))}</span>
                    </div>
                    <div className="flex-justify">
                        <span>IVA (19%):</span>
                        <span>{formatPrice(sale.total - Math.round(sale.total / 1.19))}</span>
                    </div>
                    <div className="flex-justify grand-total">
                        <span>TOTAL:</span>
                        <span>{formatPrice(sale.total)}</span>
                    </div>
                </div>
            </div>

            <div className="footer" style={{ marginTop: '80px', fontSize: '11px', color: '#666', textAlign: 'center' }}>
                {hasRealPdf ? (
                    <>
                        <p style={{ marginBottom: 4 }}>
                            Timbre Electrónico SII incluido en el documento oficial.
                        </p>
                        <p>
                            Para obtener el documento con validez tributaria, descargue el PDF oficial desde:{' '}
                            <strong>{sale.dtePdfUrl}</strong>
                        </p>
                    </>
                ) : (
                    <p>Este es un comprobante interno de control de venta. El Timbre Electrónico SII
                    se incluye en el PDF oficial emitido por Lioren.</p>
                )}
                <p style={{ marginTop: 8 }}><strong>www.nexopos.cl</strong></p>
            </div>
        </div>
    );
};

