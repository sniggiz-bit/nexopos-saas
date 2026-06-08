/**
 * Utilidades de impresión para NexoPOS.
 *
 * Soporta dos modos:
 *  1. **QZ Tray** (silencioso): envía HTML directamente a la impresora física
 *     sin mostrar ningún diálogo del SO. Requiere que QZ Tray esté instalado
 *     y ejecutándose en el PC del cajero (wss://localhost:8282).
 *  2. **Iframe fallback**: inyecta HTML en un iframe oculto y llama a
 *     `window.print()`, mostrando el diálogo estándar del navegador.
 */

declare global {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    interface Window { qz?: any; }
}

// ─────────────────────────────────────────────────────────────────────────────
// QZ Tray — impresión silenciosa
// ─────────────────────────────────────────────────────────────────────────────

/** Devuelve true si QZ Tray está cargado y su WebSocket activo */
export function isQzConnected(): boolean {
    return !!(window.qz && window.qz.websocket?.isActive?.());
}

/**
 * Imprime HTML directamente a una impresora física usando QZ Tray.
 * No muestra ningún diálogo del SO.
 *
 * @param html       - Contenido HTML del ticket
 * @param printer    - Nombre exacto de la impresora (obtenido de useQzTray)
 * @param pageSize   - '80mm' | '58mm' | 'A4'
 */
export async function printWithQz(
    html: string,
    printer: string,
    pageSize: '80mm' | '58mm' | 'A4' = '80mm',
): Promise<void> {
    const qz = window.qz;
    if (!qz || !qz.websocket?.isActive?.()) {
        throw new Error('QZ Tray no está conectado');
    }

    const widthMm = pageSize === '58mm' ? 58 : pageSize === '80mm' ? 80 : null;
    const sizeDecl = widthMm ? `${widthMm}mm auto` : 'A4';

    const wrappedHtml = `<!DOCTYPE html><html>
<head>
  <meta charset="utf-8">
  <style>
    @media print {
      @page { size: ${sizeDecl}; margin: 0; }
      body  { margin: 0; padding: 0; background: #fff; color: #000; }
    }
    body { background: #fff; color: #000; }
  </style>
</head>
<body>${html}</body>
</html>`;

    const config = qz.configs.create(printer, {
        units: 'mm',
        ...(widthMm ? { size: { width: widthMm, height: null } } : {}),
        colorType: 'blackwhite',
        copies: 1,
        margins: { top: 0, right: 0, bottom: 0, left: 0 },
    });

    await qz.print(config, [{ type: 'pixel', format: 'html', flavor: 'plain', data: wrappedHtml }]);
}

// ─────────────────────────────────────────────────────────────────────────────
// Iframe fallback — abre diálogo del navegador
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Imprime HTML a través de un iframe oculto.
 * Siempre muestra el diálogo de impresión del navegador/SO.
 * Se usa como fallback cuando QZ Tray no está disponible.
 */
export async function printThroughIframe(html: string): Promise<void> {
    return new Promise((resolve) => {
        // Eliminar iframe anterior si existe
        const existing = document.getElementById('print-iframe');
        if (existing) document.body.removeChild(existing);

        const iframe = document.createElement('iframe');
        iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:none;';
        iframe.id = 'print-iframe';

        let printed = false;

        const doPrint = () => {
            if (printed) return;
            printed = true;
            if (iframe.contentWindow) {
                iframe.contentWindow.focus();
                iframe.contentWindow.print();
            }
            setTimeout(() => {
                const el = document.getElementById('print-iframe');
                if (el) document.body.removeChild(el);
                resolve();
            }, 1500);
        };

        iframe.onload = () => setTimeout(doPrint, 80);
        document.body.appendChild(iframe);

        const doc = iframe.contentWindow?.document ?? iframe.contentDocument;
        if (!doc) { resolve(); return; }

        // Copiar hojas de estilo del host para herencias de Tailwind
        const hostStyles = Array.from(
            document.querySelectorAll<HTMLElement>('link[rel="stylesheet"], style'),
        ).map(el => el.outerHTML).join('\n');

        const finalHtml = html.includes('</head>')
            ? html.replace('</head>', `${hostStyles}</head>`)
            : `<!DOCTYPE html><html><head><meta charset="utf-8">${hostStyles}
               <style>body{margin:0;padding:0;background:#fff;color:#000;}</style>
               </head><body>${html}</body></html>`;

        doc.open();
        doc.write(finalHtml);
        doc.close();

        // Fallback si onload no dispara
        setTimeout(doPrint, 1200);
    });
}
