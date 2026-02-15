// Product types
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
    isActive: boolean;
    stock: number; // Calculated from inventory
    category?: {
        id: string;
        name: string;
    };
    brand?: {
        id: string;
        name: string;
    };
    tenantId: string;
    createdAt: string;
    updatedAt: string;
    inventoryLevels?: {
        branchId: string;
        branchName: string;
        quantity: number;
    }[];
}

export interface ProductsResponse {
    data: Product[];
    total: number;
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

export interface QuoteItem {
    id: string;
    productId: string;
    quantity: number;
    price: number;
    product?: Product;
}

export interface Quote {
    id: string;
    total: number;
    status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED';
    createdAt: string;
    expiryDate?: string;
    customer?: Customer;
    items: QuoteItem[];
}

export interface CreditPayment {
    id: string;
    amount: number;
    paymentMethod: string;
    createdAt: string;
}

export interface Credit {
    id: string;
    totalAmount: number;
    balance: number;
    status: 'OPEN' | 'PAID';
    createdAt: string;
    customer?: Customer;
    sale?: any;
    payments: CreditPayment[];
}

export type MovementType = 'SALE' | 'PURCHASE' | 'ADJUSTMENT' | 'RETURN' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'INITIAL';

export interface StockMovement {
    id: string;
    productId: string;
    branchId: string;
    quantity: number;
    type: MovementType;
    reference?: string;
    balance: number;
    createdAt: string;
    user?: {
        name: string | null;
    };
}
