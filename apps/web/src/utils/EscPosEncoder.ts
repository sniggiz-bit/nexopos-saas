/**
 * Utilidad ligera para codificar comandos ESC/POS básicos.
 * Genera un buffer de bytes (Uint8Array) que puede enviarse a una impresora serial/USB.
 */
export class EscPosEncoder {
    private buffer: number[] = [];

    /** Inicializa la impresora (ESC @) */
    initialize() {
        this.buffer.push(0x1B, 0x40);
        return this;
    }

    /** Cambia el tamaño de texto. multiplier de 1 a 8. (GS !) */
    size(width: number, height: number) {
        const w = Math.min(Math.max(1, width), 8) - 1;
        const h = Math.min(Math.max(1, height), 8) - 1;
        const n = (w << 4) | h;
        this.buffer.push(0x1D, 0x21, n);
        return this;
    }

    /** Establece alineación: 0 = Izquierda, 1 = Centro, 2 = Derecha (ESC a) */
    align(align: 'left' | 'center' | 'right') {
        let n = 0;
        if (align === 'center') n = 1;
        else if (align === 'right') n = 2;
        this.buffer.push(0x1B, 0x61, n);
        return this;
    }

    /** Establece negrita (ESC E) */
    bold(enable: boolean) {
        this.buffer.push(0x1B, 0x45, enable ? 1 : 0);
        return this;
    }

    /** Avanza n líneas o 1 por defecto (LF) */
    newline(lines: number = 1) {
        for (let i = 0; i < lines; i++) {
            this.buffer.push(0x0A);
        }
        return this;
    }

    /** Escribe texto. Se asume codificación ASCII/ISO-8859-1 para caracteres básicos. */
    text(str: string) {
        // Soporte muy básico para reemplazar acentos comunes por caracteres sin acento para evitar errores
        // en impresoras sin páginas de códigos configuradas.
        const normalized = str
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .replace(/ñ/g, "n")
            .replace(/Ñ/g, "N");

        for (let i = 0; i < normalized.length; i++) {
            this.buffer.push(normalized.charCodeAt(i));
        }
        return this;
    }

    /** Escribe texto seguido de salto de línea */
    line(str: string) {
        this.text(str);
        this.newline();
        return this;
    }

    /** Corta el papel (GS V) */
    cut() {
        // Cut function B
        this.buffer.push(0x1D, 0x56, 0x42, 0x00);
        return this;
    }

    /** Abre el cajón de dinero (ESC p) */
    cashdraw() {
        this.buffer.push(0x1B, 0x70, 0x00, 0x19, 0xFA);
        return this;
    }

    /** Retorna el buffer final como Uint8Array */
    encode(): Uint8Array {
        return new Uint8Array(this.buffer);
    }
}
