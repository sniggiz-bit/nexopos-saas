/**
 * Utility for printing HTML content through a hidden iframe.
 * This allows for silent printing (or triggered print dialog) without
 * redirecting the main window.
 */
export async function printThroughIframe(html: string): Promise<void> {
    return new Promise((resolve) => {
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = 'none';
        iframe.id = 'print-iframe';

        document.body.appendChild(iframe);

        const doc = iframe.contentWindow?.document || iframe.contentDocument;
        if (!doc) {
            console.error('Could not access iframe document');
            resolve();
            return;
        }

        let printed = false;

        const doPrint = () => {
            if (printed) return;
            printed = true;
            if (iframe.contentWindow) {
                iframe.contentWindow.focus();
                iframe.contentWindow.print();
            }
            setTimeout(() => {
                if (document.getElementById('print-iframe')) {
                    document.body.removeChild(iframe);
                }
                resolve();
            }, 1000);
        };

        doc.open();
        doc.write(html);
        doc.close();

        iframe.onload = () => setTimeout(doPrint, 300);

        // Fallback if onload never fires
        setTimeout(doPrint, 1500);
    });
}
