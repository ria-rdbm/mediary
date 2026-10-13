import { useQuery } from '@tanstack/react-query';
import { fetchLifetimePrice, LIFETIME_FALLBACK_PRICE } from '@/lib/revenuecat';

/** Store-localised Lifetime Access price, falling back to the default. */
export function useLifetimePrice(): string {
  const { data } = useQuery({
    queryKey: ['lifetime-price'],
    queryFn: fetchLifetimePrice,
    staleTime: 60 * 60 * 1000,
  });
  return data ?? LIFETIME_FALLBACK_PRICE;
}
