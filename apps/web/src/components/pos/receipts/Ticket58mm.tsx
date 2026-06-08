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

interface Ticket58mmProps {
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

export const Ticket58mm: React.FC<Ticket58mmProps> = ({
    sale,
    tenantName,
    branchName,
    branchAddress,
    tenant,
}) => {
    // Si la DB tiene rut/giro, usar esa data. Si no, usar fallback simple.
    const displayName = tenant?.name || tenantName || 'NEXOPOS';
    const dteType = sale.dteType; // 33, 39, 52, 61
    const isDte = !!sale.dteFolio;
    const hasRealPdf = sale.dtePdfUrl && !sale.dtePdfUrl.includes('ejemplo-mock');
    const folio = sale.dteFolio ? String(sale.dteFolio) : sale.id.slice(-6).toUpperCase();

    let docTitle = 'Comprobante de Venta';
    if (isDte) {
        if (dteType === 39) docTitle = 'Boleta Electrónica';
        else if (dteType === 33) docTitle = 'Factura Electrónica';
        else if (dteType === 52) docTitle = 'Guía de Despacho Electrónica';
        else if (dteType === 61) docTitle = 'Nota de Crédito Electrónica';
    }

    const dteConfig = (tenant as any)?.dteConfig;
    const resolutionNum = dteConfig?.dteResolution || '80';
    const resolutionDateRaw = dteConfig?.resolutionDate;
    const resolutionDateStr = resolutionDateRaw 
        ? new Date(resolutionDateRaw).toLocaleDateString('es-CL') 
        : '22-08-2014';

    return (
        <div className="ticket-58mm">
            <style>{`
                @media print {
                    @page { margin: 0; size: 58mm auto; }
                    body { margin: 0; padding: 0; }
                    .no-print { display: none; }
                }
                .ticket-58mm {
                    width: 58mm;
                    padding: 2px;
                    font-family: 'Courier New', Courier, monospace;
                    font-size: 10px;
                    line-height: 1.1;
                    color: #000;
                    background-color: #fff;
                    box-sizing: border-box;
                }
                .ticket-58mm * { box-sizing: border-box; }
                .tc { text-align: center; }
                .tr { text-align: right; }
                .tl { text-align: left; }
                .bold { font-weight: 700; }
                .small { font-size: 9px; }
                .dash { border-top: 1px dashed #000; margin: 4px 0; }
                .solid { border-top: 1px solid #000; margin: 4px 0; }
                .double { border-top: 3px double #000; margin: 4px 0; }
                .row { display: flex; justify-content: space-between; align-items: baseline; }
                .upper { text-transform: uppercase; }
            `}</style>

            {/* ── ENCABEZADO EMISOR ── */}
            <div className="tc" style={{ marginBottom: '4px' }}>
                {displayName && (
                    <div className="bold upper" style={{ fontSize: '13px', letterSpacing: '0.2px', lineHeight: '1.2' }}>
                        {displayName}
                    </div>
                )}
                {tenant?.rut && (
                    <div className="bold small" style={{ marginTop: '2px' }}>RUT: {formatRut(tenant.rut)}</div>
                )}
                {tenant?.giro && (
                    <div className="small upper" style={{ fontSize: '8px' }}>{tenant.giro}</div>
                )}
                {(branchAddress || tenant?.address) && (
                    <div className="small" style={{ fontSize: '8px' }}>{branchAddress || tenant?.address}</div>
                )}
                {branchName && (
                    <div className="small bold" style={{ fontSize: '8px' }}>Suc: {branchName}</div>
                )}
                {tenant?.phone && (
                    <div className="small" style={{ fontSize: '8px' }}>Tel: {tenant.phone}</div>
                )}
            </div>

            <div className="double" />

            {/* ── TIPO DOCUMENTO ── */}
            <div className="tc bold upper" style={{ fontSize: '11px', margin: '3px 0 1px' }}>
                {docTitle}
            </div>
            {!isDte && (
                <div className="tc" style={{ fontSize: '8px', marginBottom: '2px' }}>
                    (No es documento oficial)
                </div>
            )}

            <div className="dash" />

            {/* ── FOLIO Y FECHA ── */}
            <div className="row small">
                <span>Folio:</span>
                <span className="bold">{folio}</span>
            </div>
            {isDte && (
                <div className="tc small" style={{ fontSize: '8px', marginTop: '2px', fontStyle: 'italic', color: '#333' }}>
                    Resolución SII N° {resolutionNum} del {resolutionDateStr}
                </div>
            )}
            <div className="row small" style={{ marginTop: '2px' }}>
                <span>Fecha:</span>
                <span>{formatChileanDate(sale.createdAt)}</span>
            </div>
            {sale.customer && (
                <div className="small" style={{ marginTop: '2px', lineHeight: '1.2' }}>
                    <div><span className="bold">Cliente:</span> {sale.customer.name.substring(0, 22)}</div>
                    {sale.customer.rut && <div><span className="bold">RUT:</span> {formatRut(sale.customer.rut)}</div>}
                </div>
            )}
            <div className="row small" style={{ marginTop: '2px' }}>
                <span>Cajero:</span>
                <span>{sale.user?.name || 'Vendedor'}</span>
            </div>

            <div className="dash" />

            {/* ── ÍTEMS DE VENTA ── */}
            <div className="row bold small" style={{ marginBottom: '2px' }}>
                <span style={{ width: '60%' }}>CANT X ARTÍCULO</span>
                <span style={{ width: '40%' }} className="tr">TOTAL</span>
            </div>

            <div className="items small">
                {sale.items?.map((item, idx) => (
                    <div key={idx} style={{ marginBottom: '3px' }}>
                        <div style={{ lineHeight: '1' }}>{item.product?.name?.substring(0, 26)}</div>
                        <div className="row" style={{ marginTop: '1px' }}>
                            <span style={{ color: '#444' }}>
                                {item.quantity} x {formatPrice(item.price)}
                            </span>
                            <span className="bold">
                                {formatPrice(item.quantity * item.price)}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="dash" />

            {/* ── TOTALES ── */}
            <div className="totals" style={{ paddingLeft: '20px' }}>
                {sale.discountAmount ? (
                    <div className="row small">
                        <span>DCTO:</span>
                        <span>-{formatPrice(sale.discountAmount)}</span>
                    </div>
                ) : null}

                <div className="row bold" style={{ fontSize: '13px', marginTop: '2px' }}>
                    <span>TOTAL:</span>
                    <span>{formatPrice(sale.total)}</span>
                </div>
            </div>

            <div className="solid" />

            {/* ── PAGOS ── */}
            <div className="small">
                {sale.payments?.map((payment, idx) => (
                    <div key={idx} className="row">
                        <span>PAGO {getPaymentLabel(payment.paymentMethod)}</span>
                        <span>{formatPrice(payment.amount)}</span>
                    </div>
                ))}
            </div>

            {isDte && sale.dtePdfUrl && (
                <>
                    <div className="dash" />
                    <div className="tc" style={{ margin: '6px 0' }}>
                        <p className="bold" style={{ fontSize: '8px', marginBottom: '2px' }}>
                            DOCTO OFICIAL SII
                        </p>
                        <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(sale.dtePdfUrl)}`} 
                            alt="QR DTE" 
                            style={{ width: '110px', height: '110px', margin: '0 auto', display: 'block' }} 
                        />
                        <p className="small" style={{ fontSize: '7px', marginTop: '2px', opacity: 0.8, lineHeight: '1.2' }}>
                            {hasRealPdf 
                                ? 'Escanee para descargar PDF oficial' 
                                : 'MOCK DTE — Ejemplo PDF'}
                        </p>
                    </div>
                </>
            )}

            <div className="double" />

            <div className="tc small" style={{ marginTop: '6px' }}>
                <p style={{ margin: '0 0 2px', fontWeight: 'bold' }}>¡GRACIAS POR SU COMPRA!</p>
                <p style={{ margin: '0', fontSize: '8px' }}>www.nexopos.cl</p>
            </div>
            
            <div style={{ height: '5px' }}></div>
        </div>
    );
};
