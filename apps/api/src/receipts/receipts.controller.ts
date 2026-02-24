import { Controller, Get, Param, Res, NotFoundException } from '@nestjs/common';
import type { Response } from 'express';
import { InternalReceiptService } from '../dte/internal-receipt.service';
import * as fs from 'fs';

@Controller('receipts')
export class ReceiptsController {
  constructor(private readonly receiptService: InternalReceiptService) { }

  /**
   * Get a receipt PDF by sale ID
   * @param saleId ID of the sale
   * @param res Express response object
   */
  @Get(':saleId')
  getReceipt(@Param('saleId') saleId: string, @Res() res: Response) {
    const filepath = this.receiptService.getReceiptPath(saleId);

    if (!filepath || !fs.existsSync(filepath)) {
      throw new NotFoundException(`Receipt not found for sale ${saleId}`);
    }

    // Set headers for PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="receipt-${saleId}.pdf"`,
    );

    // Stream the file
    const fileStream = fs.createReadStream(filepath);
    fileStream.pipe(res);
  }
}
