import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    create(createUserDto: CreateUserDto): Promise<{
        id: string;
        email: string;
        name: string | null;
        password: string | null;
        role: import("@prisma/client").$Enums.UserRole;
        tenantId: string;
        branchId: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findAll(tenantId: string, role?: string): import("@prisma/client").Prisma.PrismaPromise<({
        branch: {
            id: string;
            name: string;
            tenantId: string;
        } | null;
    } & {
        id: string;
        email: string;
        name: string | null;
        password: string | null;
        role: import("@prisma/client").$Enums.UserRole;
        tenantId: string;
        branchId: string | null;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    findOne(id: string): import("@prisma/client").Prisma.Prisma__UserClient<({
        branch: {
            id: string;
            name: string;
            tenantId: string;
        } | null;
        shiftsOpened: {
            id: string;
            branchId: string;
            createdAt: Date;
            updatedAt: Date;
            status: string;
            openedById: string;
            closedById: string | null;
            startTime: Date;
            endTime: Date | null;
            initialAmount: import("@prisma/client-runtime-utils").Decimal;
            finalAmount: import("@prisma/client-runtime-utils").Decimal | null;
            expectedAmount: import("@prisma/client-runtime-utils").Decimal | null;
            difference: import("@prisma/client-runtime-utils").Decimal | null;
            metadata: import("@prisma/client/runtime/client").JsonValue | null;
        }[];
    } & {
        id: string;
        email: string;
        name: string | null;
        password: string | null;
        role: import("@prisma/client").$Enums.UserRole;
        tenantId: string;
        branchId: string | null;
        createdAt: Date;
        updatedAt: Date;
    }) | null, null, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    update(id: string, updateUserDto: UpdateUserDto): import("@prisma/client").Prisma.Prisma__UserClient<{
        id: string;
        email: string;
        name: string | null;
        password: string | null;
        role: import("@prisma/client").$Enums.UserRole;
        tenantId: string;
        branchId: string | null;
        createdAt: Date;
        updatedAt: Date;
    }, never, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    remove(id: string): import("@prisma/client").Prisma.Prisma__UserClient<{
        id: string;
        email: string;
        name: string | null;
        password: string | null;
        role: import("@prisma/client").$Enums.UserRole;
        tenantId: string;
        branchId: string | null;
        createdAt: Date;
        updatedAt: Date;
    }, never, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
}
