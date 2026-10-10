import type { Entitlement } from '@/types/domain';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export interface EntitlementState {
  isLifetime: boolean;
  isTrialActive: boolean;
  trialDaysLeft: number | null;
  showTrialCountdown: boolean;
  /** True once the trial has ended and Lifetime Access has not been purchased. */
  isReadOnly: boolean;
}

/**
 * Pure derivation of trial/Lifetime Access state (sections 65-71). Kept
 * separate from EntitlementProvider so it can be unit tested without
 * mounting React or faking the clock through a component tree.
 */
export function computeEntitlementState(entitlement: Entitlement | null | undefined, now: number): EntitlementState {
  const isLifetime = Boolean(entitlement?.lifetimePurchasedAt);
  let trialDaysLeft: number | null = null;
  let isTrialActive = false;

  if (entitlement?.trialStartedAt) {
    const startedAt = new Date(entitlement.trialStartedAt).getTime();
    const elapsedDays = Math.floor((now - startedAt) / MS_PER_DAY);
    trialDaysLeft = Math.max(entitlement.trialLengthDays - elapsedDays, 0);
    isTrialActive = trialDaysLeft > 0;
  }

  return {
    isLifetime,
    isTrialActive,
    trialDaysLeft,
    showTrialCountdown: !isLifetime && isTrialActive && trialDaysLeft !== null && trialDaysLeft <= 7,
    // Lifetime access always wins, even if somehow still inside the trial
    // window — and a trial that never started is "loading", not read-only.
    isReadOnly: !isLifetime && !isTrialActive && entitlement?.trialStartedAt != null,
  };
}
