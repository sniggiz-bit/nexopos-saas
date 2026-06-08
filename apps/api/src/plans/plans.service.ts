import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Plan } from '@prisma/client';

@Injectable()
export class PlansService {
  constructor(private prisma: PrismaService) {}

  async create(data: any): Promise<Plan> {
    const { id: _id, createdAt: _ca, updatedAt: _ua, tenants: _t, moduleCodes, ...createData } = data;
    
    let planModulesConfig: any = undefined;
    if (moduleCodes && Array.isArray(moduleCodes)) {
      const modules = await this.prisma.module.findMany({
        where: { code: { in: moduleCodes } },
        select: { id: true }
      });
      planModulesConfig = {
        create: modules.map((m: any) => ({ moduleId: m.id }))
      };
    }

    return this.prisma.plan.create({ 
      data: {
        ...createData,
        ...(planModulesConfig ? { planModules: planModulesConfig } : {})
      },
      include: { planModules: { include: { module: true } } }
    });
  }

  async findAll(): Promise<Plan[]> {
    return this.prisma.plan.findMany({
      include: { planModules: { include: { module: true } } }
    });
  }

  async findOne(id: string): Promise<Plan | null> {
    return this.prisma.plan.findUnique({ 
      where: { id },
      include: { planModules: { include: { module: true } } }
    });
  }

  async update(id: string, data: any): Promise<Plan> {
    const { id: _id, createdAt: _ca, updatedAt: _ua, tenants: _t, moduleCodes, ...updateData } = data;
    
    if (moduleCodes && Array.isArray(moduleCodes)) {
      // Delete existing planModules
      await this.prisma.planModule.deleteMany({ where: { planId: id } });
      
      const modules = await this.prisma.module.findMany({
        where: { code: { in: moduleCodes } },
        select: { id: true }
      });
      
      return this.prisma.plan.update({
        where: { id },
        data: {
          ...updateData,
          planModules: {
            create: modules.map(m => ({ moduleId: m.id }))
          }
        },
        include: { planModules: { include: { module: true } } }
      });
    }

    return this.prisma.plan.update({ 
      where: { id }, 
      data: updateData,
      include: { planModules: { include: { module: true } } }
    });
  }

  async remove(id: string): Promise<Plan> {
    return this.prisma.plan.delete({ where: { id } });
  }

  async findPublic(): Promise<Plan[]> {
    return this.prisma.plan.findMany({
      where: { isVisible: true },
      orderBy: { price: 'asc' },
      include: { planModules: { include: { module: true } } }
    });
  }
}
