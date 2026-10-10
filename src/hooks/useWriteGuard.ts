import { useCallback } from 'react';
import { router } from 'expo-router';
import { useEntitlement } from '@/context/EntitlementProvider';

/**
 * Gate for any write action (sections 69-70): once the trial has ended and
 * Lifetime Access hasn't been purchased, the app stays fully readable but
 * every write action routes to the paywall instead. Call `guard()` at the
 * top of a save/create/delete handler; it returns false (and navigates) if
 * the action should not proceed.
 */
export function useWriteGuard() {
  const { isReadOnly } = useEntitlement();

  const guard = useCallback((): boolean => {
    if (isReadOnly) {
      router.push('/paywall');
      return false;
    }
    return true;
  }, [isReadOnly]);

  return { guard, isReadOnly };
}
