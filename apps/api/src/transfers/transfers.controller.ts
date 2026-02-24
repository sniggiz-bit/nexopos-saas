import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { TransfersService } from './transfers.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('transfers')
@UseGuards(JwtAuthGuard)
export class TransfersController {
  constructor(private readonly transfersService: TransfersService) {}

  @Post()
  create(
    @Body()
    createTransferDto: {
      originBranchId: string;
      destBranchId: string;
      items: any[];
      note?: string;
    },
    @Request() req,
  ) {
    return this.transfersService.create({
      ...createTransferDto,
      userId: req.user.id,
    });
  }
}
