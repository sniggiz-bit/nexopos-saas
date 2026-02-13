import { PrismaService } from '../prisma/prisma.service';
import { Announcement } from '@prisma/client';
export declare class AnnouncementsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(data: any): Promise<Announcement>;
    findAll(): Promise<Announcement[]>;
    findActive(): Promise<Announcement[]>;
    update(id: string, data: any): Promise<Announcement>;
    remove(id: string): Promise<Announcement>;
}
