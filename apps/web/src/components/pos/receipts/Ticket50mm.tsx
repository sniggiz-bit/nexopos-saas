import React from 'react';
import { Sale } from '@/api/sales';
import { formatPrice } from '@/utils/formatters';

interface Ticket50mmProps {
    sale: Sale;
    tenantName?: string;
}

export const Ticket50mm: React.FC<Ticket50mmProps> = ({ sale, tenantName = 'NEXOPOS' }) => {
    return (
        <div className="ticket-50mm" style={{
            width: '50mm',
            padding: '2px',
            fontFamily: 'monospace',
            fontSize: '10px',
            lineHeight: '1.1',
            color: '#000',
            backgroundColor: '#fff'
        }}>
            <style>
                {`
                @media print {
                    @page {
                        margin: 0;
                        size: 50mm auto;
                    }
                    body {
                        margin: 0;
                    }
                }
                .text-center { text-align: center; }
                .text-right { text-align: right; }
                .bold { font-weight: bold; }
                .dashed-line { border-top: 1px dashed #000; margin: 3px 0; }
                .flex-justify { display: flex; justify-content: space-between; }
                `}
            </style>

            <div className="text-center">
                <h2 style={{ margin: '0', fontSize: '12px' }}>{tenantName}</h2>
                <p style={{ margin: '0' }}>Ticket</p>
                <p style={{ margin: '0' }}>{new Date(sale.createdAt).toLocaleDateString()}</p>
            </div>

            <div className="dashed-line" />

            <div className="items">
                {sale.items?.map((item, idx) => (
                    <div key={idx} style={{ marginBottom: '2px' }}>
                        <div>{item.product.name.substring(0, 20)}</div>
                        <div className="flex-justify">
                            <span>{item.quantity}x{item.price}</span>
                            <span className="bold">{item.quantity * item.price}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="dashed-line" />

            <div className="totals">
                {sale.discountAmount ? (
                    <div className="flex-justify" style={{ fontSize: '9px' }}>
                        <span>DCTO:</span>
                        <span>-{formatPrice(sale.discountAmount)}</span>
                    </div>
                ) : null}
                <div className="flex-justify bold" style={{ fontSize: '11px', marginTop: '2px' }}>
                    <span>TOTAL:</span>
                    <span>{formatPrice(sale.total)}</span>
                </div>
            </div>

            <div className="dashed-line" />

            <div className="text-center" style={{ marginTop: '5px', fontSize: '8px' }}>
                <p>¡Gracias!</p>
            </div>
        </div>
    );
};
