import { MovementType } from '@prisma/client';
export declare class CreateMovementDto {
    productId: string;
    branchId: string;
    quantity: number;
    type: MovementType;
    reference?: string;
    userId?: string;
}
