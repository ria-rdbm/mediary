import React, { useState } from 'react';
import { View, Text, Image, Pressable, StyleSheet, Platform } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { PrimaryButton, TextButton } from '@/components/ui/Button';
import { HeroHeader, HeroSheet } from '@/components/composed/HeroLayout';
import { colors, fonts, typography, spacing } from '@/theme';
import { purchaseLifetimeAccess, restorePurchases, hasLifetimeEntitlement } from '@/lib/revenuecat';
import { syncEntitlement } from '@/services/account';
import { useLifetimePrice } from '@/hooks/useLifetimePrice';
import { useEntitlement } from '@/context/EntitlementProvider';

const BENEFITS: { icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { icon: 'water-outline', label: 'Unlimited medications & treatments' },
  { icon: 'cube-outline', label: 'Stock tracking with batches & reminders' },
  { icon: 'calendar-outline', label: 'Full history, calendar & Summary' },
  { icon: 'star-outline', label: 'No ads, no subscription — pay once' },
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
    <Screen scroll padded={false} edges={['bottom']} tinted={false}>
      <HeroHeader style={styles.hero}>
        <View style={styles.topRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close"
            onPress={() => router.back()}
            style={styles.closeButton}
            hitSlop={6}
          >
            <Ionicons name="arrow-undo-outline" size={20} color={colors.textOnAccent} />
          </Pressable>
          <View style={styles.brandRow} accessible accessibilityLabel="Mediary">
            <Image source={require('../../assets/brand/mark-white.png')} style={styles.brandMark} />
            <Image source={require('../../assets/brand/wordmark-white.png')} style={styles.brandWordmark} />
          </View>
          <View style={styles.closeButtonSpacer} />
        </View>

        <Text style={styles.title}>Lifetime Access</Text>
        <Text style={styles.subtitle}>One payment. No subscription. No ads.</Text>

        <View style={styles.benefits}>
          {BENEFITS.map((benefit) => (
            <View key={benefit.label} style={styles.benefitRow}>
              <View style={styles.benefitIcon}>
                <Ionicons name={benefit.icon} size={15} color={colors.textOnAccent} />
              </View>
              <Text style={styles.benefitText}>{benefit.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.price}>{price}</Text>
          <View style={styles.priceTag}>
            <Text style={styles.priceTagLabel}>One-time purchase</Text>
          </View>
        </View>
      </HeroHeader>

      <HeroSheet style={styles.sheet}>
        {error && <Text style={styles.error}>{error}</Text>}
        <PrimaryButton label="Unlock Lifetime Access" onPress={handlePurchase} loading={purchasing} />
        <TextButton label="Restore Purchase" onPress={handleRestore} disabled={restoring} />
        <TextButton label="Not now" onPress={() => router.back()} style={styles.notNow} tone="muted" />
      </HeroSheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingBottom: 34 + spacing.xl,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.onAccentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonSpacer: {
    width: 40,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandMark: {
    width: 44,
    height: 22,
  },
  brandWordmark: {
    width: 80,
    height: 19,
  },
  title: {
    ...typography.display,
    color: colors.textOnAccent,
    marginTop: spacing.lg,
  },
  subtitle: {
    ...typography.bodySecondary,
    color: 'rgba(255,255,255,0.8)',
    marginTop: spacing.xxs,
  },
  benefits: {
    gap: spacing.xs,
    marginTop: spacing.lg,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 50,
    paddingHorizontal: spacing.sm,
    borderRadius: 16,
    backgroundColor: colors.onAccentSoft,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  benefitIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 19,
    color: colors.textOnAccent,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
  price: {
    ...typography.display,
    color: colors.textOnAccent,
  },
  priceTag: {
    height: 26,
    justifyContent: 'center',
    paddingHorizontal: 10,
    borderRadius: 13,
    backgroundColor: colors.onAccentSoft,
  },
  priceTagLabel: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.textOnAccent,
  },
  sheet: {
    paddingTop: spacing.lg,
    gap: spacing.xxs,
  },
  error: {
    ...typography.caption,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  notNow: {
    marginBottom: spacing.sm,
  },
});
