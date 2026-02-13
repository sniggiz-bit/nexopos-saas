import { AnnouncementsService } from './announcements.service';
export declare class AnnouncementsController {
    private readonly announcementsService;
    constructor(announcementsService: AnnouncementsService);
    create(createAnnouncementDto: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        type: string;
        title: string;
        content: string;
    }>;
    findAll(): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        type: string;
        title: string;
        content: string;
    }[]>;
    findActive(): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        type: string;
        title: string;
        content: string;
    }[]>;
    update(id: string, updateAnnouncementDto: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        type: string;
        title: string;
        content: string;
    }>;
    remove(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        type: string;
        title: string;
        content: string;
    }>;
}
