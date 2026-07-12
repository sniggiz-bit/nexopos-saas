/**
 * Utilidades de impresión para NexoPOS (Fallback Iframe).
 *
 * El sistema principal usa Web Serial API directamente en el frontend.
 * Estas utilidades son para el modo de diálogo del navegador (fallback).
 */

/**
 * Imprime HTML a través de un iframe oculto.
 * Siempre muestra el diálogo de impresión del navegador/SO.
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
