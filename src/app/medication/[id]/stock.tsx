import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { PrimaryButton, SecondaryButton, TextButton } from '@/components/ui/Button';
import { LoadingState, EmptyState } from '@/components/ui/States';
import { AddStockSheet } from '@/components/composed/AddStockSheet';
import { ManualAdjustmentSheet } from '@/components/composed/ManualAdjustmentSheet';
import { colors, typography, spacing } from '@/theme';
import { useMedication } from '@/hooks/useMedications';
import { useStockBatches, useAddStockBatch, useManualStockAdjustment } from '@/hooks/useStock';
import { useWriteGuard } from '@/hooks/useWriteGuard';
import { formatLocalDate } from '@/lib/dateTime';

export default function MedicationStockScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: medication, isLoading } = useMedication(id);
  const { data: batches } = useStockBatches(id);
  const addBatch = useAddStockBatch(id);
  const manualAdjust = useManualStockAdjustment(id);
  const { guard } = useWriteGuard();

  const [addVisible, setAddVisible] = useState(false);
  const [adjustVisible, setAdjustVisible] = useState(false);
  const [showBatches, setShowBatches] = useState(true);

  if (isLoading || !medication) {
    return (
      <Screen>
        <Header title="Stock" />
        <LoadingState />
      </Screen>
    );
  }

  const activeBatches = (batches ?? []).filter((b) => b.quantity > 0);

  return (
    <Screen scroll>
      <Header title="Stock" />

      <Card style={styles.totalCard}>
        <Text style={typography.caption}>Total stock</Text>
        <Text style={typography.display}>
          {medication.totalStock} {medication.stockUnit ?? ''}
        </Text>
      </Card>

      <View style={styles.actionsRow}>
        <PrimaryButton
          label="Add Stock"
          onPress={() => {
            if (guard()) setAddVisible(true);
          }}
          style={styles.actionButton}
        />
        <SecondaryButton
          label="Adjust"
          onPress={() => {
            if (guard()) setAdjustVisible(true);
          }}
          style={styles.actionButton}
        />
      </View>

      <Section title="Batches" action={<TextButton label={showBatches ? 'Hide' : 'View'} onPress={() => setShowBatches((v) => !v)} />}>
        {!showBatches ? (
          <Text style={typography.bodySecondary}>
            {activeBatches.length} active batch{activeBatches.length === 1 ? '' : 'es'}
          </Text>
        ) : activeBatches.length === 0 ? (
          <EmptyState icon="cube-outline" title="No stock yet" message="Add stock to get started." />
        ) : (
          activeBatches.map((batch) => (
            <View key={batch.id} style={styles.batchRow}>
              <View>
                <Text style={typography.body}>
                  {batch.quantity} {batch.stockUnit}
                </Text>
                <Text style={typography.caption}>
                  {[
                    batch.expiryDate ? `Expires ${formatLocalDate(`${batch.expiryDate}T00:00:00`)}` : null,
                    batch.batchNumber ? `Lot ${batch.batchNumber}` : null,
                  ]
                    .filter(Boolean)
                    .join(' · ') || 'No expiry or lot recorded'}
                </Text>
              </View>
            </View>
          ))
        )}
      </Section>

      <TextButton label="View stock history" onPress={() => router.push(`/medication/${id}/stock-history`)} />

      <AddStockSheet
        visible={addVisible}
        onClose={() => setAddVisible(false)}
        lockedUnit={medication.totalStock > 0 ? medication.stockUnit : null}
        submitting={addBatch.isPending}
        onSubmit={async (input) => {
          try {
            await addBatch.mutateAsync(input);
            setAddVisible(false);
          } catch (err: unknown) {
            Alert.alert('Could not add stock', (err as Error)?.message ?? 'Please try again.');
          }
        }}
      />

      <ManualAdjustmentSheet
        visible={adjustVisible}
        onClose={() => setAdjustVisible(false)}
        recordedStock={medication.totalStock}
        stockUnit={medication.stockUnit ?? ''}
        submitting={manualAdjust.isPending}
        onSubmit={async (actual) => {
          await manualAdjust.mutateAsync(actual);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  totalCard: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
  batchRow: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
});
