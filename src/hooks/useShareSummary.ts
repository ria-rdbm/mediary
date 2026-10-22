import { useQuery } from '@tanstack/react-query';
import * as shareSummaryService from '@/services/shareSummary';

export function useShareSummary(startDateKey: string, endDateKey: string) {
  return useQuery({
    queryKey: ['share-summary', startDateKey, endDateKey],
    queryFn: () => shareSummaryService.fetchShareSummary(startDateKey, endDateKey),
    enabled: !!startDateKey && !!endDateKey,
  });
}
