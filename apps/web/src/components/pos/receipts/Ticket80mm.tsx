import React from 'react';
import { Sale } from '@/api/sales';
import { formatPrice } from '@/utils/formatters';

interface TenantInfo {
    name?: string;
    rut?: string | null;
    giro?: string | null;
    address?: string | null;
    phone?: string | null;
}

interface Ticket80mmProps {
    sale: Sale;
    tenantName?: string;
    branchName?: string;
    branchAddress?: string;
    tenant?: TenantInfo;
}

function formatChileanDate(dateStr: string | Date): string {
    const d = new Date(dateStr);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    return `${dd}-${mm}-${yyyy}  ${hh}:${min}:${ss}`;
}

function formatRut(rut?: string | null): string {
    if (!rut) return '';
    // Ensure format: XX.XXX.XXX-X
    const clean = rut.replace(/[^0-9kK]/g, '');
    if (clean.length < 2) return rut;
    const body = clean.slice(0, -1);
    const dv = clean.slice(-1).toUpperCase();
    const formatted = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${formatted}-${dv}`;
}

function getPaymentLabel(method: string): string {
    const map: Record<string, string> = {
        CASH: 'EFECTIVO',
        CARD: 'TARJETA',
        DEBIT: 'DÉBITO',
        CREDIT_CARD: 'CRÉDITO',
        TRANSFER: 'TRANSFERENCIA',
        CHECK: 'CHEQUE',
        OTHER: 'OTRO',
    };
    return map[method?.toUpperCase()] ?? method;
}

export const Ticket80mm: React.FC<Ticket80mmProps> = ({
    sale,
    tenantName,
    branchName,
    branchAddress,
    tenant,
}) => {
    const neto = Math.round(sale.total / 1.19);
    const iva = sale.total - neto;
    const subtotalBruto = sale.total + (Number(sale.discountAmount) || 0);
    const displayName = tenant?.name || tenantName || 'NEXOPOS';
    const folio = sale.id?.split('-')[0]?.toUpperCase() ?? '';

    return (
        <div className="ticket-80mm" style={{
            width: '80mm',
            padding: '6px 8px',
            fontFamily: "'Courier New', Courier, monospace",
            fontSize: '11px',
            lineHeight: '1.3',
            color: '#000',
            backgroundColor: '#fff',
        }}>
            <style>{`
                @media print {
                    @page { margin: 0; size: 80mm auto; }
                    body { margin: 0; padding: 0; }
                    .no-print { display: none; }
                }
                .ticket-80mm * { box-sizing: border-box; }
                .tc { text-align: center; }
                .tr { text-align: right; }
                .tl { text-align: left; }
                .bold { font-weight: bold; }
                .small { font-size: 9px; }
                .dash { border-top: 1px dashed #000; margin: 4px 0; }
                .solid { border-top: 1px solid #000; margin: 4px 0; }
                .double { border-top: 3px double #000; margin: 4px 0; }
                .row { display: flex; justify-content: space-between; align-items: baseline; }
                .row-col { display: flex; flex-direction: column; }
                .upper { text-transform: uppercase; }
            `}</style>

            {/* ── ENCABEZADO EMISOR ── */}
            <div className="tc" style={{ marginBottom: '4px' }}>
                <div className="bold upper" style={{ fontSize: '13px', letterSpacing: '0.5px' }}>
                    {displayName}
                </div>
                {tenant?.rut && (
                    <div className="small">RUT: {formatRut(tenant.rut)}</div>
                )}
                {tenant?.giro && (
                    <div className="small upper">{tenant.giro}</div>
                )}
                {(branchAddress || tenant?.address) && (
                    <div className="small">{branchAddress || tenant?.address}</div>
                )}
                {branchName && (
                    <div className="small bold">Sucursal: {branchName}</div>
                )}
                {tenant?.phone && (
                    <div className="small">Tel: {tenant.phone}</div>
                )}
            </div>

            <div className="double" />

            {/* ── TIPO DOCUMENTO ── */}
            <div className="tc bold" style={{ fontSize: '12px', margin: '3px 0' }}>
                COMPROBANTE DE VENTA
            </div>
            <div className="tc small">
                (No es documento tributario oficial)
            </div>

            <div className="dash" />

            {/* ── FOLIO Y FECHA ── */}
            <div className="row small">
                <span>N° Folio:</span>
                <span className="bold">{folio}</span>
            </div>
            <div className="row small" style={{ marginTop: '2px' }}>
                <span>Fecha:</span>
                <span>{formatChileanDate(sale.createdAt)}</span>
            </div>
            {sale.customer && (
                <>
                    <div className="dash" />
                    <div className="row small">
                        <span>Cliente:</span>
                        <span className="bold">{sale.customer.name}</span>
                    </div>
                    {sale.customer.rut && (
                        <div className="row small">
                            <span>RUT:</span>
                            <span>{formatRut(sale.customer.rut)}</span>
                        </div>
                    )}
                </>
            )}

            <div className="dash" />

            {/* ── DETALLE ITEMS ── */}
            <div className="row bold small upper" style={{ borderBottom: '1px solid #000', paddingBottom: '2px', marginBottom: '3px' }}>
                <span style={{ flex: 2 }}>Descripción</span>
                <span style={{ textAlign: 'right', flex: 1 }}>Total</span>
            </div>

            {sale.items?.map((item, idx) => {
                const itemTotal = Number(item.quantity) * Number(item.price);
                const itemDiscount = Number(item.discountAmount) || 0;
                const finalTotal = itemTotal - itemDiscount;
                return (
                    <div key={idx} style={{ marginBottom: '4px' }}>
                        <div className="bold" style={{ fontSize: '11px' }}>{item.product.name}</div>
                        <div className="row small">
                            <span>{Number(item.quantity)} x {formatPrice(Number(item.price))}</span>
                            <span className="bold">{formatPrice(finalTotal)}</span>
                        </div>
                        {itemDiscount > 0 && (
                            <div className="row small" style={{ opacity: 0.7 }}>
                                <span>Dcto. ítem:</span>
                                <span>-{formatPrice(itemDiscount)}</span>
                            </div>
                        )}
                    </div>
                );
            })}

            <div className="solid" />

            {/* ── TOTALES ── */}
            {subtotalBruto !== sale.total && (
                <div className="row small">
                    <span>Subtotal:</span>
                    <span>{formatPrice(subtotalBruto)}</span>
                </div>
            )}
            {Number(sale.discountAmount) > 0 && (
                <div className="row small bold">
                    <span>Descuento:</span>
                    <span>-{formatPrice(Number(sale.discountAmount))}</span>
                </div>
            )}

            <div className="row small" style={{ marginTop: '2px' }}>
                <span>Neto:</span>
                <span>{formatPrice(neto)}</span>
            </div>
            <div className="row small">
                <span>IVA (19%):</span>
                <span>{formatPrice(iva)}</span>
            </div>

            <div className="double" />

            <div className="row bold" style={{ fontSize: '15px' }}>
                <span>TOTAL</span>
                <span>{formatPrice(sale.total)}</span>
            </div>

            <div className="dash" />

            {/* ── MEDIOS DE PAGO ── */}
            {sale.payments?.map((payment, idx) => (
                <div key={idx} className="row small bold">
                    <span>{getPaymentLabel(payment.paymentMethod)}:</span>
                    <span>{formatPrice(payment.amount)}</span>
                </div>
            ))}

            {/* Vuelto */}
            {(() => {
                const pagado = sale.payments?.reduce((s, p) => s + Number(p.amount), 0) ?? 0;
                const vuelto = pagado - sale.total;
                return vuelto > 0 ? (
                    <div className="row small bold" style={{ marginTop: '2px' }}>
                        <span>VUELTO:</span>
                        <span>{formatPrice(vuelto)}</span>
                    </div>
                ) : null;
            })()}

            <div className="dash" />

            {/* ── PIE ── */}
            <div className="tc" style={{ marginTop: '6px', fontSize: '10px' }}>
                <div>¡Gracias por su preferencia!</div>
                <div style={{ marginTop: '2px' }}>www.nexopos.cl</div>
                <div className="small" style={{ marginTop: '4px', opacity: 0.6 }}>
                    Documento generado por NexoPOS
                </div>
            </div>

            {/* Espacio para corte de papel */}
            <div style={{ height: '16px' }} />
        </div>
    );
};
