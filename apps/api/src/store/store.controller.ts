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
import { Public } from '../auth/decorators/public.decorator';

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

  @Public()
  @Get(':slug/filters')
  async getFilters(@Param('slug') slug: string) {
    return this.storeService.findFiltersBySlug(slug);
  }

  @Public()
  @Get(':slug/products')
  async getProducts(
    @Param('slug') slug: string,
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
    @Query('brandId') brandId?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('sort') sort?: string,
  ) {
    return this.storeService.findProductsBySlug(slug, {
      search,
      categoryId,
      brandId,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      sort,
    });
  }

  @Public()
  @Get(':slug')
  async getStore(@Param('slug') slug: string) {
    return this.storeService.findBySlug(slug);
  }
}
