import { Response } from 'express';
import { InternalReceiptService } from '../dte/internal-receipt.service';
export declare class ReceiptsController {
    private readonly receiptService;
    constructor(receiptService: InternalReceiptService);
    getReceipt(saleId: string, res: Response): Promise<void>;
}
