export interface Tenant {
    id: string;
    name: string;
    slug: string;
    phone?: string | null;
    rut?: string | null;
    giro?: string | null;
    address?: string | null;
    status: string; // Linking with TenantStatus enum if preferred
    createdAt: string | Date;
    updatedAt: string | Date;
}

export interface User {
    id: string;
    email: string;
    name?: string | null;
    role: string; // Linking with UserRole enum
    tenantId?: string | null;
}

export interface PriceTier {
    id?: string;
    productId?: string;
    minQuantity: number;
    unitPrice: number;
}


export interface Product {
    id: string;
    name: string;
    sku?: string;
    barcode?: string;
    price: number;
    costPrice: number;
    minStock: number;
    unitType: 'UNIT' | 'WEIGHT';
    image?: string;
    galleryImages?: string[];
    isActive: boolean;
    isPublic?: boolean;
    stock: number;
    category?: {
        id: string;
        name: string;
    };
    brand?: {
        id: string;
        name: string;
    };
    tenantId: string;
    createdAt?: string;
    updatedAt?: string;
    inventoryLevels?: {
        branchId: string;
        branchName: string;
        quantity: number;
    }[];
    priceTiers?: PriceTier[];
}

export interface Customer {
    id: string;
    name: string;
    rut: string;
    giro?: string;
    address?: string;
    comuna?: string;
    email?: string;
    phone?: string;
    tenantId: string;
}
