import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface CreateDteConfigDto {
  tenantId: string;
  liorenToken?: string;
  liorenLogo?: string;
  dteResolution?: string;
  resolutionDate?: Date;
}

interface UpdateDteConfigDto {
  liorenToken?: string;
  liorenLogo?: string;
  dteResolution?: string;
  resolutionDate?: Date;
}

interface DteConfigResponseDto {
  id: string;
  tenantId: string;
  liorenToken?: string;
  liorenLogo?: string;
  dteResolution?: string;
  resolutionDate?: Date;
}

@Injectable()
export class DteConfigService {
  constructor(private prisma: PrismaService) {}

  async findByTenant(tenantId: string): Promise<DteConfigResponseDto | null> {
    const config = await this.prisma.dteConfig.findUnique({
      where: { tenantId },
    });

    if (!config) {
      return null;
    }

    return {
      id: config.id,
      tenantId: config.tenantId,
      liorenToken: config.liorenToken || undefined,
      liorenLogo: config.liorenLogo || undefined,
      dteResolution: config.dteResolution || undefined,
      resolutionDate: config.resolutionDate || undefined,
    };
  }

  async upsert(
    createDteConfigDto: CreateDteConfigDto,
  ): Promise<DteConfigResponseDto> {
    const config = await this.prisma.dteConfig.upsert({
      where: { tenantId: createDteConfigDto.tenantId },
      update: {
        liorenToken: createDteConfigDto.liorenToken,
        liorenLogo: createDteConfigDto.liorenLogo,
        dteResolution: createDteConfigDto.dteResolution,
        resolutionDate: createDteConfigDto.resolutionDate,
      },
      create: createDteConfigDto,
    });

    return {
      id: config.id,
      tenantId: config.tenantId,
      liorenToken: config.liorenToken || undefined,
      liorenLogo: config.liorenLogo || undefined,
      dteResolution: config.dteResolution || undefined,
      resolutionDate: config.resolutionDate || undefined,
    };
  }

  async update(
    id: string,
    updateDteConfigDto: UpdateDteConfigDto,
  ): Promise<DteConfigResponseDto> {
    const config = await this.prisma.dteConfig.update({
      where: { id },
      data: updateDteConfigDto,
    });

    return {
      id: config.id,
      tenantId: config.tenantId,
      liorenToken: config.liorenToken || undefined,
      liorenLogo: config.liorenLogo || undefined,
      dteResolution: config.dteResolution || undefined,
      resolutionDate: config.resolutionDate || undefined,
    };
  }
}
