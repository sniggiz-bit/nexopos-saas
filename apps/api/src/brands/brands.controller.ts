import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { BrandsService } from './brands.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/user.decorator';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateBrandDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  tenantId: string;
}

export class UpdateBrandDto {
  @IsString()
  @IsOptional()
  name?: string;
}

export class BrandResponseDto {
  id: string;
  name: string;
  productCount?: number;
}

@Controller('brands')
@UseGuards(JwtAuthGuard)
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) { }

  @Get()
  async findAll(@CurrentUser() user: any): Promise<BrandResponseDto[]> {
    return this.brandsService.findAll(user.tenantId);
  }

  @Post()
  async create(
    @Body() createBrandDto: CreateBrandDto,
    @CurrentUser() user: any,
  ): Promise<BrandResponseDto> {
    createBrandDto.tenantId = user.tenantId;
    return this.brandsService.create(createBrandDto);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateBrandDto: UpdateBrandDto,
    @CurrentUser() user: any,
  ): Promise<BrandResponseDto> {
    return this.brandsService.update(id, user.tenantId, updateBrandDto);
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ): Promise<void> {
    return this.brandsService.remove(id, user.tenantId);
  }
}
