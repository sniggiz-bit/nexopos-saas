import {
  Injectable,
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { formatRut } from '@nexopos/shared';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) { }

  async create(createCustomerDto: CreateCustomerDto) {
    try {
      return await this.prisma.customer.create({
        data: {
          ...createCustomerDto,
          rut: formatRut(createCustomerDto.rut),
        },
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        const target = error.meta?.target;
        const targetStr = Array.isArray(target)
          ? target.join(',')
          : String(target ?? '');
        if (targetStr.includes('rut')) {
          throw new ConflictException(
            'Ya existe un cliente con este RUT en el sistema.',
          );
        }
        if (targetStr.includes('email')) {
          throw new ConflictException(
            'Ya existe un cliente con este email en el sistema.',
          );
        }
        throw new ConflictException(
          'Ya existe un cliente con estos datos únicos.',
        );
      }
      if (error.code === 'P2003') {
        throw new BadRequestException(
          'Error de referencia: El tenant o algún dato relacionado no existe.',
        );
      }
      console.error('❌ CUSTOMER CREATION ERROR:', error);
      if (error instanceof Error) {
        console.error('Stack:', error.stack);
      }
      throw new InternalServerErrorException(
        'Error al crear el cliente. Por favor intente nuevamente.',
      );
    }
  }

  async findAll(tenantId: string) {
    return this.prisma.customer.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.customer.findUnique({
      where: { id },
      include: {
        _count: {
          select: { sales: true, quotes: true, credits: true },
        },
      },
    });
  }

  async update(id: string, updateCustomerDto: UpdateCustomerDto) {
    const data = { ...updateCustomerDto };
    if (data.rut) data.rut = formatRut(data.rut);

    try {
      return await this.prisma.customer.update({
        where: { id },
        data,
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        const target = error.meta?.target;
        const targetStr = Array.isArray(target)
          ? target.join(',')
          : String(target ?? '');
        if (targetStr.includes('rut')) {
          throw new ConflictException(
            'Ya existe un cliente con este RUT en el sistema.',
          );
        }
        throw new ConflictException(
          'Ya existe un cliente con estos datos únicos.',
        );
      }
      throw error;
    }
  }

  async remove(id: string) {
    return this.prisma.customer.delete({
      where: { id },
    });
  }
}
