import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Announcement } from '@prisma/client';

@Injectable()
export class AnnouncementsService {
  constructor(private prisma: PrismaService) {}

  async create(data: any): Promise<Announcement> {
    return this.prisma.announcement.create({ data });
  }

  async findAll(): Promise<Announcement[]> {
    return this.prisma.announcement.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findActive(): Promise<Announcement[]> {
    return this.prisma.announcement.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, data: any): Promise<Announcement> {
    return this.prisma.announcement.update({ where: { id }, data });
  }

  async remove(id: string): Promise<Announcement> {
    return this.prisma.announcement.delete({ where: { id } });
  }
}
