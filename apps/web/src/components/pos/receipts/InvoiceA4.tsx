import React from 'react';
import { Sale } from '@/api/sales';
import { formatPrice } from '@/utils/formatters';

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
                `}
            </style>

            <div className="header">
                <div className="tenant-info">
                    <h1>{tenantName}</h1>
                    <p style={{ margin: '5px 0' }}>{tenantAddress}</p>
                    <p style={{ margin: '0' }}>Contacto: soporte@nexopos.cl</p>
                </div>
                <div className="doc-type">
                    <h2>R.U.T.: {tenantRut}</h2>
                    <h1 style={{ margin: '10px 0', fontSize: '20px' }}>BOLETA ELECTRÓNICA</h1>
                    <h2>Nº {sale.dteFolio || 'SIN FOLIO'}</h2>
                </div>
            </div>

            <div className="client-info" style={{ marginBottom: '30px' }}>
                <h3 style={{ borderBottom: '1px solid #000', paddingBottom: '5px' }}>Detalle del Cliente</h3>
                {sale.customer ? (
                    <>
                        <p><strong>RUT:</strong> {sale.customer.rut}</p>
                        <p><strong>Nombre:</strong> {sale.customer.name}</p>
                    </>
                ) : (
                    <p>Venta a Cliente Final</p>
                )}
                <p><strong>Fecha Emisión:</strong> {new Date(sale.createdAt).toLocaleString()}</p>
            </div>

            <table className="details-table">
                <thead>
                    <tr>
                        <th>Descripción</th>
                        <th style={{ textAlign: 'center' }}>Cant.</th>
                        <th style={{ textAlign: 'right' }}>Precio Unit.</th>
                        <th style={{ textAlign: 'right' }}>Total</th>
                    </tr>
                </thead>
                <tbody>
                    {sale.items?.map((item, idx) => (
                        <tr key={idx}>
                            <td>{item.product.name}</td>
                            <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                            <td style={{ textAlign: 'right' }}>{formatPrice(item.price)}</td>
                            <td style={{ textAlign: 'right' }}>{formatPrice(item.quantity * item.price)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="totals-section">
                <div className="totals-box">
                    <div className="flex-justify">
                        <span>Monto Neto:</span>
                        <span>{formatPrice(sale.total / 1.19)}</span>
                    </div>
                    <div className="flex-justify">
                        <span>IVA (19%):</span>
                        <span>{formatPrice(sale.total - (sale.total / 1.19))}</span>
                    </div>
                    <div className="flex-justify grand-total">
                        <span>TOTAL:</span>
                        <span>{formatPrice(sale.total)}</span>
                    </div>
                </div>
            </div>

            <div className="footer" style={{ marginTop: '100px', fontSize: '12px', color: '#666', textAlign: 'center' }}>
                <p>Este documento es una representación impresa de un comprobante electrónico.</p>
                <p>Timbre Electrónico SII de prueba.</p>
                <p><strong>www.nexopos.cl</strong></p>
            </div>
        </div>
    );
};
