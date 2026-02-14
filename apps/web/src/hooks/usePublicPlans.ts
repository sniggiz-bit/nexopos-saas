import { useQuery } from '@tanstack/react-query';
import { getPublicPlans, type PublicPlan } from '../api/plans';

/**
 * Hook to fetch public subscription plans
 */
export function usePublicPlans() {
    return useQuery<PublicPlan[], Error>({
        queryKey: ['public-plans'],
        queryFn: getPublicPlans,
        staleTime: 1000 * 60 * 30, // 30 minutes, plans don't change often
        refetchOnWindowFocus: false,
    });
}
