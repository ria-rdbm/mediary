import { computeEntitlementState } from '@/lib/entitlement';
import type { Entitlement } from '@/types/domain';

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 9, 7, 12, 0, 0);

function trial(startedDaysAgo: number, lengthDays = 30): Entitlement {
  return {
    trialStartedAt: new Date(NOW - startedDaysAgo * DAY).toISOString(),
    trialLengthDays: lengthDays,
    lifetimePurchasedAt: null,
  };
}

describe('computeEntitlementState', () => {
  it('treats a user with no entitlement row yet as neither active nor read-only', () => {
    const state = computeEntitlementState(null, NOW);
    expect(state.isTrialActive).toBe(false);
    expect(state.isReadOnly).toBe(false);
    expect(state.isLifetime).toBe(false);
  });

  it('is active on day 1 of a 30-day trial', () => {
    const state = computeEntitlementState(trial(0), NOW);
    expect(state.isTrialActive).toBe(true);
    expect(state.trialDaysLeft).toBe(30);
    expect(state.isReadOnly).toBe(false);
  });

  it('shows the countdown only in the final 7 days (section 66)', () => {
    expect(computeEntitlementState(trial(22), NOW).showTrialCountdown).toBe(false); // 8 days left
    expect(computeEntitlementState(trial(23), NOW).showTrialCountdown).toBe(true); // 7 days left
    expect(computeEntitlementState(trial(29), NOW).showTrialCountdown).toBe(true); // 1 day left
  });

  it('becomes read-only the moment the trial lapses without a purchase (section 69)', () => {
    const lastDay = computeEntitlementState(trial(29), NOW);
    expect(lastDay.isTrialActive).toBe(true);
    expect(lastDay.isReadOnly).toBe(false);

    const dayAfter = computeEntitlementState(trial(30), NOW);
    expect(dayAfter.isTrialActive).toBe(false);
    expect(dayAfter.trialDaysLeft).toBe(0);
    expect(dayAfter.isReadOnly).toBe(true);
  });

  it('never goes read-only once Lifetime Access is purchased, even post-trial', () => {
    const entitlement: Entitlement = { ...trial(90), lifetimePurchasedAt: new Date(NOW).toISOString() };
    const state = computeEntitlementState(entitlement, NOW);
    expect(state.isLifetime).toBe(true);
    expect(state.isReadOnly).toBe(false);
    expect(state.showTrialCountdown).toBe(false);
  });

  it('a lifetime purchase made mid-trial also suppresses the countdown', () => {
    const entitlement: Entitlement = { ...trial(25), lifetimePurchasedAt: new Date(NOW).toISOString() };
    const state = computeEntitlementState(entitlement, NOW);
    expect(state.isReadOnly).toBe(false);
    expect(state.showTrialCountdown).toBe(false);
  });
});
