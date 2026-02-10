import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { BrandsService } from './brands.service';

export class CreateBrandDto {
    name: string;
    tenantId: string;
}

export class UpdateBrandDto {
    name?: string;
}

export class BrandResponseDto {
    id: string;
    name: string;
    productCount?: number;
}

@Controller('brands')
export class BrandsController {
    constructor(private readonly brandsService: BrandsService) { }

    @Get()
    async findAll(
        @Query('tenantId') tenantId: string = 'tenant-1',
    ): Promise<BrandResponseDto[]> {
        return this.brandsService.findAll(tenantId);
    }

    @Post()
    async create(@Body() createBrandDto: CreateBrandDto): Promise<BrandResponseDto> {
        return this.brandsService.create(createBrandDto);
    }

    @Patch(':id')
    async update(
        @Param('id') id: string,
        @Body() updateBrandDto: UpdateBrandDto,
    ): Promise<BrandResponseDto> {
        return this.brandsService.update(id, updateBrandDto);
    }

    @Delete(':id')
    async remove(@Param('id') id: string): Promise<void> {
        return this.brandsService.remove(id);
    }
}
