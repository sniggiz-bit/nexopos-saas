import { SystemLogsService } from './system-logs.service';
export declare class SystemLogsController {
    private readonly systemLogsService;
    constructor(systemLogsService: SystemLogsService);
    findAll(query: any): Promise<({
        tenant: {
            name: string;
        } | null;
    } & {
        id: string;
        tenantId: string | null;
        createdAt: Date;
        level: string;
        message: string;
        context: import("@prisma/client/runtime/client").JsonValue | null;
    })[]>;
}
