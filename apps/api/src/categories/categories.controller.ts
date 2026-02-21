import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateCategoryDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    tenantId: string;
}

export class UpdateCategoryDto {
    @IsString()
    @IsNotEmpty()
    @IsOptional()
    name?: string;
}

export class CategoryResponseDto {
    id: string;
    name: string;
    productCount?: number;
}

@Controller('categories')
export class CategoriesController {
    constructor(private readonly categoriesService: CategoriesService) { }

    @Get()
    async findAll(
        @Query('tenantId') tenantId: string = 'tenant-1',
    ): Promise<CategoryResponseDto[]> {
        return this.categoriesService.findAll(tenantId);
    }

    @Post()
    async create(@Body() createCategoryDto: CreateCategoryDto): Promise<CategoryResponseDto> {
        return this.categoriesService.create(createCategoryDto);
    }

    @Patch(':id')
    async update(
        @Param('id') id: string,
        @Body() updateCategoryDto: UpdateCategoryDto,
    ): Promise<CategoryResponseDto> {
        return this.categoriesService.update(id, updateCategoryDto);
    }

    @Delete(':id')
    async remove(@Param('id') id: string): Promise<void> {
        return this.categoriesService.remove(id);
    }
}
