"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const shared_1 = require("@nexopos/shared");
let CustomersService = class CustomersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createCustomerDto) {
        try {
            return await this.prisma.customer.create({
                data: {
                    ...createCustomerDto,
                    rut: (0, shared_1.formatRut)(createCustomerDto.rut),
                },
            });
        }
        catch (error) {
            if (error.code === 'P2002') {
                const target = error.meta?.target;
                const targetStr = Array.isArray(target)
                    ? target.join(',')
                    : String(target ?? '');
                if (targetStr.includes('rut')) {
                    throw new common_1.ConflictException('Ya existe un cliente con este RUT en el sistema.');
                }
                if (targetStr.includes('email')) {
                    throw new common_1.ConflictException('Ya existe un cliente con este email en el sistema.');
                }
                throw new common_1.ConflictException('Ya existe un cliente con estos datos únicos.');
            }
            if (error.code === 'P2003') {
                throw new common_1.BadRequestException('Error de referencia: El tenant o algún dato relacionado no existe.');
            }
            console.error('❌ CUSTOMER CREATION ERROR:', error);
            if (error instanceof Error) {
                console.error('Stack:', error.stack);
            }
            throw new common_1.InternalServerErrorException('Error al crear el cliente. Por favor intente nuevamente.');
        }
    }
    async findAll(tenantId) {
        return this.prisma.customer.findMany({
            where: { tenantId },
            orderBy: { name: 'asc' },
        });
    }
    async findOne(id) {
        return this.prisma.customer.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { sales: true, quotes: true, credits: true },
                },
            },
        });
    }
    async update(id, updateCustomerDto) {
        const data = { ...updateCustomerDto };
        if (data.rut)
            data.rut = (0, shared_1.formatRut)(data.rut);
        try {
            return await this.prisma.customer.update({
                where: { id },
                data,
            });
        }
        catch (error) {
            if (error.code === 'P2002') {
                const target = error.meta?.target;
                const targetStr = Array.isArray(target)
                    ? target.join(',')
                    : String(target ?? '');
                if (targetStr.includes('rut')) {
                    throw new common_1.ConflictException('Ya existe un cliente con este RUT en el sistema.');
                }
                throw new common_1.ConflictException('Ya existe un cliente con estos datos únicos.');
            }
            throw error;
        }
    }
    async remove(id) {
        return this.prisma.customer.delete({
            where: { id },
        });
    }
};
exports.CustomersService = CustomersService;
exports.CustomersService = CustomersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CustomersService);
//# sourceMappingURL=customers.service.js.map