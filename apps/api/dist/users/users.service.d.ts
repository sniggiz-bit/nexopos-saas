import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    create(createUserDto: CreateUserDto): Promise<{
        name: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        branchId: string | null;
        email: string;
        password: string | null;
        role: import("@prisma/client").$Enums.UserRole;
    }>;
    findAll(tenantId: string, role?: string): import("@prisma/client").Prisma.PrismaPromise<({
        branch: {
            name: string;
            id: string;
            address: string | null;
            createdAt: Date;
            updatedAt: Date;
            isMain: boolean;
            tenantId: string;
        } | null;
    } & {
        name: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        branchId: string | null;
        email: string;
        password: string | null;
        role: import("@prisma/client").$Enums.UserRole;
    })[]>;
    findOne(id: string): import("@prisma/client").Prisma.Prisma__UserClient<({
        branch: {
            name: string;
            id: string;
            address: string | null;
            createdAt: Date;
            updatedAt: Date;
            isMain: boolean;
            tenantId: string;
        } | null;
        shiftsOpened: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: string;
            branchId: string;
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
        name: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        branchId: string | null;
        email: string;
        password: string | null;
        role: import("@prisma/client").$Enums.UserRole;
    }) | null, null, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    update(id: string, updateUserDto: UpdateUserDto): import("@prisma/client").Prisma.Prisma__UserClient<{
        name: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        branchId: string | null;
        email: string;
        password: string | null;
        role: import("@prisma/client").$Enums.UserRole;
    }, never, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    remove(id: string): import("@prisma/client").Prisma.Prisma__UserClient<{
        name: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        branchId: string | null;
        email: string;
        password: string | null;
        role: import("@prisma/client").$Enums.UserRole;
    }, never, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
}
