import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { PrimaryButton, TextButton } from '@/components/ui/Button';
import { colors, typography, spacing, radius } from '@/theme';
import { purchaseLifetimeAccess, restorePurchases, hasLifetimeEntitlement } from '@/lib/revenuecat';
import { syncEntitlement } from '@/services/account';
import { useLifetimePrice } from '@/hooks/useLifetimePrice';
import { useEntitlement } from '@/context/EntitlementProvider';

const BENEFITS = [
  'Unlimited medications & treatments',
  'Stock tracking with batches & reminders',
  'Full history, calendar & Health Summary',
  'No ads, no subscription — pay once',
];

export default function PaywallScreen() {
  const { refetch } = useEntitlement();
  const price = useLifetimePrice();
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const afterEntitlementChange = async () => {
    try {
      await syncEntitlement(Platform.OS === 'android' ? 'android' : 'ios');
    } catch (err) {
      console.warn('sync-entitlement failed (webhook will catch up)', err);
    }
    refetch();
  };

  const handlePurchase = async () => {
    setError(null);
    setPurchasing(true);
    try {
      const info = await purchaseLifetimeAccess();
      if (hasLifetimeEntitlement(info)) {
        await afterEntitlementChange();
        router.back();
      }
    } catch (err: unknown) {
      if (!(err as { userCancelled?: boolean })?.userCancelled) {
        setError('Purchase failed. Please try again.');
      }
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setError(null);
    setRestoring(true);
    try {
      const info = await restorePurchases();
      if (hasLifetimeEntitlement(info)) {
        await afterEntitlementChange();
        router.back();
      } else {
        setError('No previous purchase was found for this account.');
      }
    } catch {
      setError('Restore failed. Please try again.');
    } finally {
      setRestoring(false);
    }
  };

  return (
    <Screen>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Ionicons name="leaf" size={26} color={colors.accentStrong} />
        </View>
        <Text style={typography.screenTitle}>Lifetime Access</Text>
        <Text style={[typography.bodySecondary, styles.subtitle]}>
          One payment. No subscription. No ads.
        </Text>

        <View style={styles.benefits}>
          {BENEFITS.map((benefit) => (
            <View key={benefit} style={styles.benefitRow}>
              <Ionicons name="checkmark-circle" size={18} color={colors.accent} />
              <Text style={[typography.body, styles.benefitText]}>{benefit}</Text>
            </View>
          ))}
        </View>

        <View style={styles.priceCard}>
          <Text style={typography.display}>{price}</Text>
          <Text style={typography.caption}>One-time purchase</Text>
        </View>

        {error && <Text style={styles.error}>{error}</Text>}
      </View>

      <View style={styles.actions}>
        <PrimaryButton label="Unlock Lifetime Access" onPress={handlePurchase} loading={purchasing} />
        <TextButton label="Restore Purchase" onPress={handleRestore} disabled={restoring} />
        <TextButton label="Not now" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    alignItems: 'center',
    paddingTop: spacing.xl,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  subtitle: {
    marginTop: spacing.xxs,
    marginBottom: spacing.lg,
  },
  benefits: {
    width: '100%',
    gap: spacing.sm,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  benefitText: {
    flex: 1,
  },
  priceCard: {
    marginTop: spacing.xl,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  error: {
    ...typography.caption,
    color: colors.error,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  actions: {
    gap: spacing.xs,
    paddingBottom: spacing.md,
  },
});
