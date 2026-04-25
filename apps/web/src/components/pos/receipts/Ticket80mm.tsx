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
                <h2 style={{ margin: '0', fontSize: '16px' }}>{tenantName} - TICKET DE VENTA</h2>
                {branchName && <p style={{ margin: '0' }}>{branchName}</p>}
                <p style={{ margin: '5px 0' }}>Comprobante de Venta</p>
                <p style={{ margin: '0', fontSize: '10px' }}>ID: {sale.id.split('-')[0]}</p>
                <p style={{ margin: '0' }}>{new Date(sale.createdAt).toLocaleString()}</p>
            </div>

            <div className="dashed-line" />

            <div className="items">
                {sale.items?.map((item, idx) => {
                    const itemTotal = Number(item.quantity) * Number(item.price);
                    const itemDiscount = Number(item.discountAmount) || 0;
                    const finalItemTotal = itemTotal - itemDiscount;

                    return (
                        <div key={idx} style={{ marginBottom: '5px' }}>
                            <div className="flex-justify">
                                <span className="bold">{item.product.name}</span>
                            </div>
                            <div className="flex-justify">
                                <span>{Number(item.quantity)} x {formatPrice(Number(item.price))}</span>
                                <div className="text-right">
                                    {itemDiscount > 0 && (
                                        <div style={{ fontSize: '10px', textDecoration: 'line-through', opacity: '0.6' }}>
                                            {formatPrice(itemTotal)}
                                        </div>
                                    )}
                                    <span className="bold">{formatPrice(finalItemTotal)}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="dashed-line" />

            <div className="totals">
                <div className="flex-justify">
                    <span>Subtotal:</span>
                    <span>{formatPrice(sale.total + (sale.discountAmount || 0))}</span>
                </div>
                
                {sale.discountAmount && sale.discountAmount > 0 ? (
                    <div className="flex-justify" style={{ color: '#000' }}>
                        <span>TOTAL DESCUENTO:</span>
                        <span>-{formatPrice(sale.discountAmount)}</span>
                    </div>
                ) : null}

                <div className="flex-justify bold" style={{ fontSize: '14px', marginTop: '5px', borderTop: '1px solid #000', paddingTop: '3px' }}>
                    <span>TOTAL:</span>
                    <span>{formatPrice(sale.total)}</span>
                </div>

                <div className="dashed-line" style={{ margin: '3px 0' }} />

                <div className="flex-justify" style={{ fontSize: '10px', opacity: 0.8 }}>
                    <span>Neto:</span>
                    <span>{formatPrice(Math.round(sale.total / 1.19))}</span>
                </div>
                
                <div className="flex-justify" style={{ fontSize: '10px', opacity: 0.8 }}>
                    <span>IVA (19%):</span>
                    <span>{formatPrice(sale.total - Math.round(sale.total / 1.19))}</span>
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
