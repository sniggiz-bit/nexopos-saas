import { api } from './client';

export interface PublicPlan {
    id: string;
    name: string;
    description: string | null;
    price: number;
    features: string[] | null;
    maxUsers: number;
    maxProducts: number;
    isRecommended: boolean;
}

export const getPublicPlans = async (): Promise<PublicPlan[]> => {
    const response = await api.get('/plans/public');
    return response.data;
};
