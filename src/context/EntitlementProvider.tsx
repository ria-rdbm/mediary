import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchEntitlement } from '@/services/entitlements';
import { computeEntitlementState, type EntitlementState } from '@/lib/entitlement';
import { useAuth } from './AuthProvider';

const NOW_REFRESH_INTERVAL_MS = 60 * 60 * 1000;

interface EntitlementContextValue extends EntitlementState {
  isLoading: boolean;
  refetch: () => void;
}

const EntitlementContext = createContext<EntitlementContextValue | null>(null);

export function EntitlementProvider({ children }: { children: React.ReactNode }) {
  const { status, userId } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['entitlement', userId],
    queryFn: fetchEntitlement,
    enabled: status === 'signed_in',
  });

  // Rendering must stay a pure function of state, so "now" is sampled into
  // state (refreshed hourly) rather than calling Date.now() during render.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), NOW_REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  const value = useMemo<EntitlementContextValue>(
    () => ({
      ...computeEntitlementState(data, now),
      isLoading,
      refetch: () => {
        void queryClient.invalidateQueries({ queryKey: ['entitlement', userId] });
      },
    }),
    [data, isLoading, now, queryClient, userId],
  );

  return <EntitlementContext.Provider value={value}>{children}</EntitlementContext.Provider>;
}

export function useEntitlement(): EntitlementContextValue {
  const ctx = useContext(EntitlementContext);
  if (!ctx) throw new Error('useEntitlement must be used within EntitlementProvider');
  return ctx;
}
