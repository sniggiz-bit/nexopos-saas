import { useEffect, useRef } from 'react';

interface UseBarcodeScannerOptions {
    onScan: (barcode: string) => void;
    enabled?: boolean;
    minChars?: number;
    timeout?: number;
    suffix?: string;
}

/**
 * Custom hook to listen for barcode scanner input (keyboard events).
 * Scanners usually send characters very fast followed by an Enter key.
 */
export function useBarcodeScanner({
    onScan,
    enabled = true,
    minChars = 2,
    timeout = 50, // Reduced for faster hardware scanners
    suffix = 'Enter',
}: UseBarcodeScannerOptions) {
    const bufferRef = useRef<string>('');
    const lastKeyTimeRef = useRef<number>(0);

    useEffect(() => {
        if (!enabled) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            // Ignore if user is typing in an input or textarea
            const target = event.target as HTMLElement;
            if (
                target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.isContentEditable
            ) {
                return;
            }

            const currentTime = Date.now();
            const diff = currentTime - lastKeyTimeRef.current;
            lastKeyTimeRef.current = currentTime;

            // If typing is too slow, it's likely manual typing, reset buffer
            if (diff > timeout && bufferRef.current.length > 0) {
                bufferRef.current = '';
            }

            // If suffix is pressed, trigger scan if buffer meets requirements
            if (event.key === suffix) {
                if (bufferRef.current.length >= minChars) {
                    onScan(bufferRef.current);
                }
                bufferRef.current = '';
                return;
            }

            // Add alphanumeric characters to buffer
            if (event.key.length === 1) {
                bufferRef.current += event.key;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onScan, enabled, minChars, timeout, suffix]);
}
