import { Injectable } from '@nestjs/common';

@Injectable()
export class DteService {
    /**
     * Simulates DTE emission.
     * Waits 1 second and returns success with a mock folio.
     */
    async emitDte(payload: any): Promise<{ success: boolean; folio: number }> {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({ success: true, folio: 12345 });
            }, 1000);
        });
    }
}
