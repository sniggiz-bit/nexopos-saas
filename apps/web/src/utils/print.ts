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

        doc.open();
        doc.write(html);
        doc.close();

        // Small delay to ensure styles and images are loaded
        iframe.onload = () => {
            setTimeout(() => {
                if (iframe.contentWindow) {
                    iframe.contentWindow.focus();
                    iframe.contentWindow.print();
                }

                // Clean up after print dialog is closed (or after a reasonable time)
                setTimeout(() => {
                    document.body.removeChild(iframe);
                    resolve();
                }, 1000);
            }, 500);
        };

        // If onload doesn't fire for some reason (no images/links)
        setTimeout(() => {
            if (document.getElementById('print-iframe')) {
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
            }
        }, 2000);
    });
}
