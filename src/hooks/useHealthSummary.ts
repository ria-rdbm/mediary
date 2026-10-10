import { useQuery } from '@tanstack/react-query';
import * as healthSummaryService from '@/services/healthSummary';

export function useHealthSummary(
  medicationIds: string[],
  startDateKey: string,
  endDateKey: string,
  includeWeight: boolean,
) {
  return useQuery({
    queryKey: ['health-summary', medicationIds, startDateKey, endDateKey, includeWeight],
    queryFn: () => healthSummaryService.fetchHealthSummary(medicationIds, startDateKey, endDateKey, includeWeight),
    enabled: medicationIds.length > 0,
  });
}
