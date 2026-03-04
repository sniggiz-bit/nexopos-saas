import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    UseGuards,
    Request,
    Query,
    BadRequestException,
} from '@nestjs/common';
import { PurchasesService } from './purchases.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('purchases')
@UseGuards(JwtAuthGuard)
export class PurchasesController {
    constructor(private readonly purchasesService: PurchasesService) { }

    private getTenantId(req: any): string {
        const tenantId = req.user?.tenantId;
        if (!tenantId) throw new BadRequestException('tenantId not found in token');
        return tenantId;
    }

    @Get()
    findAll(@Request() req, @Query('branchId') branchId?: string) {
        return this.purchasesService.findAll(this.getTenantId(req), branchId);
    }

    @Get(':id')
    findOne(@Param('id') id: string, @Request() req) {
        return this.purchasesService.findOne(id, this.getTenantId(req));
    }

    @Post()
    create(
        @Body()
        body: {
            supplierId?: string;
            branchId: string;
            notes?: string;
            items: {
                productId: string;
                quantity: number;
                costPrice: number;
            }[];
        },
        @Request() req,
    ) {
        return this.purchasesService.create(body, this.getTenantId(req));
    }
}
