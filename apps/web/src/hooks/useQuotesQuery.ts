
import { useQuery } from '@tanstack/react-query';
import { getQuotes } from '../api/quotes';
import { useAuth } from '@/context/AuthContext';

export function useQuotes() {
    const { user } = useAuth();
    const tenantId = user?.tenantId;

    return useQuery({
        queryKey: ['quotes', tenantId],
        queryFn: () => getQuotes(tenantId),
        enabled: !!tenantId,
    });
}
