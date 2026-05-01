
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getShift, openShift, closeShift, getShiftLiveSummary, OpenShiftRequest, CloseShiftRequest } from '../api/shifts';

export const useCurrentShift = (branchId: string) => {
    return useQuery({
        queryKey: ['current-shift', branchId],
        queryFn: () => getShift(branchId),
        enabled: !!branchId,
        retry: false,
        staleTime: 0,
    });
};

export const useOpenShift = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: OpenShiftRequest) => openShift(data),
        onSuccess: (newShift, variables) => {
            // Set data immediately in cache — modal closes without waiting for a refetch
            queryClient.setQueryData(['current-shift', variables.branchId], newShift);
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

export const useShiftLiveSummary = (shiftId: string | null) => {
    return useQuery({
        queryKey: ['shift-live-summary', shiftId],
        queryFn: () => getShiftLiveSummary(shiftId!),
        enabled: !!shiftId,
        refetchInterval: 30 * 1000,
        staleTime: 0,
    });
};
