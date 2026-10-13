import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { PrimaryButton } from '@/components/ui/Button';
import { colors, typography, spacing } from '@/theme';
import { useAcknowledgeDisclaimer } from '@/hooks/useProfile';

export default function WelcomeScreen() {
  const acknowledge = useAcknowledgeDisclaimer();

  const handleContinue = async () => {
    await acknowledge.mutateAsync();
    router.push('/(onboarding)/profile');
  };

  return (
    <Screen>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Ionicons name="shield-checkmark-outline" size={28} color={colors.accentStrong} />
        </View>
        <Text style={typography.screenTitle}>A few things first</Text>
        <Text style={[typography.body, styles.body]}>
          Mediary helps you record and organise your treatment information. It does not provide medical advice,
          diagnosis, or treatment recommendations. Always follow the instructions provided by your healthcare
          professional.
        </Text>
      </View>
      <PrimaryButton label="Continue" onPress={handleContinue} loading={acknowledge.isPending} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  body: {
    marginTop: spacing.md,
    color: colors.textSecondary,
  },
});
