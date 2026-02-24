import {
  Controller,
  Get,
  Param,
  Query,
  Patch,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { StoreService } from './store.service';

@Controller('store')
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  @Get('settings')
  @UseGuards(JwtAuthGuard)
  async getSettings(@Request() req: any) {
    return this.storeService.getSettings(req.user.tenantId);
  }

  @Patch('settings')
  @UseGuards(JwtAuthGuard)
  async updateSettings(@Body() body: any, @Request() req: any) {
    return this.storeService.updateStoreSettings(req.user.tenantId, body);
  }

  @Get(':slug')
  async getStore(@Param('slug') slug: string) {
    return this.storeService.findBySlug(slug);
  }

  @Get(':slug/products')
  async getProducts(
    @Param('slug') slug: string,
    @Query('search') search?: string,
  ) {
    return this.storeService.findProductsBySlug(slug, search);
  }
}
