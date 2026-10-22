import React, { useRef, useState } from 'react';
import { View, Text, Alert, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { Card } from '@/components/ui/Card';
import { Toggle } from '@/components/ui/Toggle';
import { PrimaryButton } from '@/components/ui/Button';
import { LoadingState, ErrorState } from '@/components/ui/States';
import { SummaryShareCard } from '@/components/composed/SummaryShareCard';
import { colors, typography, spacing } from '@/theme';
import { useShareSummary } from '@/hooks/useShareSummary';

export default function SharePreviewScreen() {
  const { start, end, label } = useLocalSearchParams<{ start: string; end: string; label?: string }>();
  const { data, isLoading, isError, refetch } = useShareSummary(start, end);
  const [includeWeight, setIncludeWeight] = useState(true);
  const [includeSymptoms, setIncludeSymptoms] = useState(true);
  const [busy, setBusy] = useState(false);
  const cardRef = useRef<View>(null);

  const handleShare = async () => {
    setBusy(true);
    try {
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert('Sharing unavailable', 'This device cannot share images.');
        return;
      }
      const uri = await captureRef(cardRef, { format: 'png', quality: 1, result: 'tmpfile' });
      await Sharing.shareAsync(uri, { mimeType: 'image/png', UTI: 'public.png', dialogTitle: 'Share summary' });
    } catch (err) {
      console.warn('Image share failed', err);
      Alert.alert('Could not share', 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen scroll>
      <Header title="Share image" />
      {isLoading ? (
        <LoadingState />
      ) : isError || !data ? (
        <ErrorState onRetry={refetch} />
      ) : (
        <>
          <SummaryShareCard
            ref={cardRef}
            data={data}
            periodLabel={label ?? 'Summary'}
            startDateKey={start}
            endDateKey={end}
            includeWeight={includeWeight}
            includeSymptoms={includeSymptoms}
          />

          <Card style={styles.options} padded={false}>
            <View style={styles.option}>
              <Toggle label="Include weight" value={includeWeight} onValueChange={setIncludeWeight} />
            </View>
            <View style={[styles.option, styles.optionDivider]}>
              <Toggle label="Include symptoms" value={includeSymptoms} onValueChange={setIncludeSymptoms} />
            </View>
          </Card>
          <Text style={styles.hint}>Only what is on the card is shared. Stock changes are never included.</Text>

          <PrimaryButton
            label="Share image"
            icon="share-outline"
            onPress={handleShare}
            loading={busy}
            style={styles.button}
          />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  options: {
    marginTop: spacing.md,
  },
  option: {
    paddingHorizontal: spacing.md,
  },
  optionDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.dividerSoft,
  },
  hint: {
    ...typography.caption,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  button: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
});
