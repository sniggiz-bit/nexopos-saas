import { TransfersService } from './transfers.service';
export declare class TransfersController {
    private readonly transfersService;
    constructor(transfersService: TransfersService);
    create(createTransferDto: {
        originBranchId: string;
        destBranchId: string;
        items: any[];
        note?: string;
    }, req: any): Promise<any>;
}
