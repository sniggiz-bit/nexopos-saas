
import { api } from './client';

export interface Shift {
    id: string;
    branchId: string;
    openedByUserId: string;
    startTime: string;
    initialAmount: number;
    status: 'OPEN' | 'CLOSED';
    openedBy?: {
        name: string | null;
    };
}

export interface OpenShiftRequest {
    branchId: string;
    initialAmount: number;
    userId: string;
    tenantId: string;
}

export interface CloseShiftRequest {
    shiftId: string;
    userId: string;
    finalAmount: number;
}

export const getShift = async (branchId: string): Promise<Shift | null> => {
    const response = await api.get(`/shifts/current/${branchId}`);
    return response.data;
};

export const openShift = async (data: OpenShiftRequest): Promise<Shift> => {
    const response = await api.post('/shifts/open', data);
    return response.data;
};

export const closeShift = async (data: CloseShiftRequest): Promise<Shift> => {
    const response = await api.post('/shifts/close', data);
    return response.data;
};
