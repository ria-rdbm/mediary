import { useQuery } from '@tanstack/react-query';
import * as historyService from '@/services/history';

export function useHistory(filter: historyService.HistoryFilter) {
  return useQuery({
    queryKey: ['history', filter],
    queryFn: () => historyService.fetchHistory(filter),
  });
}
