import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) { }

  async create(createUserDto: CreateUserDto) {
    const { email, password, role, branchId, tenantId, name } = createUserDto;

    const existingUser = await this.prisma.user.findFirst({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    // Hashing password for secure local Auth usage
    const saltRounds = 10;
    const hashedPassword = password ? await bcrypt.hash(password, saltRounds) : null;

    return this.prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: (role as UserRole) || 'MANAGER',
        branchId,
        tenantId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        branchId: true,
        tenantId: true,
        createdAt: true,
        updatedAt: true,
        // password is deliberately excluded from response
      }
    });
  }

  findAll(tenantId: string, role?: UserRole) {
    return this.prisma.user.findMany({
      where: {
        tenantId,
        role,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        tenantId: true,
        branchId: true,
        branch: {
          select: { id: true, name: true }
        }
      },
    });
  }

  findOne(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        tenantId: true,
        branchId: true,
        branch: {
          select: { id: true, name: true }
        },
        shiftsOpened: {
          where: { status: 'OPEN' },
        },
      },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const data = { ...updateUserDto };

    // Hash new password if provided
    if (data.password) {
      const saltRounds = 10;
      data.password = await bcrypt.hash(data.password, saltRounds);
    }

    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  remove(id: string) {
    return this.prisma.user.delete({
      where: { id },
    });
  }
}
