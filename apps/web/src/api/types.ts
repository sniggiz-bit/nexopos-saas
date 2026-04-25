import { Product, Customer, MovementType } from '@nexopos/shared';
export { Product, Customer, MovementType };

export interface ProductsResponse {
    data: Product[];
    total: number;
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
