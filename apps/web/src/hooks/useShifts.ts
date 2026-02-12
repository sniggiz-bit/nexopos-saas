
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getShift, openShift, closeShift, OpenShiftRequest, CloseShiftRequest } from '../api/shifts';

export const useCurrentShift = (branchId: string) => {
    return useQuery({
        queryKey: ['current-shift', branchId],
        queryFn: () => getShift(branchId),
        retry: false,
    });
};

export const useOpenShift = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: OpenShiftRequest) => openShift(data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['current-shift', variables.branchId] });
        },
    });
};

export const useCloseShift = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CloseShiftRequest) => closeShift(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['current-shift'] });
        },
    });
};
