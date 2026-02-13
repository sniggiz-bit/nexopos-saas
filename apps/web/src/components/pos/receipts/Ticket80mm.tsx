import React from 'react';
import { Sale } from '@/api/sales';
import { formatPrice } from '@/utils/formatters';

interface Ticket80mmProps {
    sale: Sale;
    tenantName?: string;
    branchName?: string;
}

export const Ticket80mm: React.FC<Ticket80mmProps> = ({ sale, tenantName = 'NEXOPOS', branchName }) => {
    return (
        <div className="ticket-80mm" style={{
            width: '80mm',
            padding: '5px',
            fontFamily: 'monospace',
            fontSize: '12px',
            lineHeight: '1.2',
            color: '#000',
            backgroundColor: '#fff'
        }}>
            <style>
                {`
                @media print {
                    @page {
                        margin: 0;
                        size: 80mm auto;
                    }
                    body {
                        margin: 0;
                        padding: 0;
                    }
                    .no-print {
                        display: none;
                    }
                }
                .ticket-80mm * {
                    box-sizing: border-box;
                }
                .text-center { text-align: center; }
                .text-right { text-align: right; }
                .bold { font-weight: bold; }
                .dashed-line { border-top: 1px dashed #000; margin: 5px 0; }
                .flex-justify { display: flex; justify-content: space-between; }
                `}
            </style>

            <div className="text-center">
                <h2 style={{ margin: '0', fontSize: '16px' }}>{tenantName}</h2>
                {branchName && <p style={{ margin: '0' }}>{branchName}</p>}
                <p style={{ margin: '5px 0' }}>Ticket Interno</p>
                <p style={{ margin: '0', fontSize: '10px' }}>ID: {sale.id.split('-')[0]}</p>
                <p style={{ margin: '0' }}>{new Date(sale.createdAt).toLocaleString()}</p>
            </div>

            <div className="dashed-line" />

            <div className="items">
                {sale.items?.map((item, idx) => (
                    <div key={idx} style={{ marginBottom: '3px' }}>
                        <div className="flex-justify">
                            <span>{item.product.name}</span>
                        </div>
                        <div className="flex-justify">
                            <span>{item.quantity} x {formatPrice(item.price)}</span>
                            <span className="bold">{formatPrice(item.quantity * item.price)}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="dashed-line" />

            <div className="totals">
                <div className="flex-justify">
                    <span>Subtotal:</span>
                    <span>{formatPrice(sale.total / 1.19)}</span>
                </div>
                <div className="flex-justify">
                    <span>IVA (19%):</span>
                    <span>{formatPrice(sale.total - (sale.total / 1.19))}</span>
                </div>
                <div className="flex-justify bold" style={{ fontSize: '14px', marginTop: '5px' }}>
                    <span>TOTAL:</span>
                    <span>{formatPrice(sale.total)}</span>
                </div>
            </div>

            <div className="dashed-line" />

            <div className="payments">
                {sale.payments?.map((payment, idx) => (
                    <div key={idx} className="flex-justify">
                        <span>{payment.paymentMethod}:</span>
                        <span>{formatPrice(payment.amount)}</span>
                    </div>
                ))}
            </div>

            <div className="dashed-line" />

            <div className="text-center" style={{ marginTop: '10px', fontSize: '10px' }}>
                <p>Gracias por su compra</p>
                <p>www.nexopos.cl</p>
            </div>
        </div>
    );
};
