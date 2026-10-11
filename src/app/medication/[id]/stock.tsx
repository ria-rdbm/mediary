import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
import {
  useStockBatches,
  useAddStockBatch,
  useManualStockAdjustment,
  useUpdateBatchDetails,
  useDiscardStockBatch,
} from '@/hooks/useStock';
import { EditBatchSheet } from '@/components/composed/EditBatchSheet';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import type { StockBatch } from '@/types/domain';
import { useWriteGuard } from '@/hooks/useWriteGuard';
import { formatLocalDate } from '@/lib/dateTime';

export default function MedicationStockScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: medication, isLoading } = useMedication(id);
  const { data: batches, isLoading: batchesLoading } = useStockBatches(id);
  const addBatch = useAddStockBatch(id);
  const manualAdjust = useManualStockAdjustment(id);
  const { guard } = useWriteGuard();

  const [addVisible, setAddVisible] = useState(false);
  const [adjustVisible, setAdjustVisible] = useState(false);
  const [showBatches, setShowBatches] = useState(true);
  const [editingBatch, setEditingBatch] = useState<StockBatch | null>(null);
  const [discardTarget, setDiscardTarget] = useState<StockBatch | null>(null);
  const updateBatch = useUpdateBatchDetails(id);
  const discardBatch = useDiscardStockBatch(id);

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

      {medication.lowStockThreshold == null && (
        <Pressable onPress={() => router.push(`/medication/${id}/edit`)} accessibilityRole="button">
          <Text style={styles.thresholdHint}>
            Get a heads-up before you run out — set a low stock threshold in Edit Medication.
          </Text>
        </Pressable>
      )}

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
        ) : batchesLoading ? (
          <LoadingState />
        ) : activeBatches.length === 0 ? (
          <EmptyState icon="cube-outline" title="No stock yet" message="Add stock to get started." />
        ) : (
          activeBatches.map((batch) => (
            <Pressable
              key={batch.id}
              accessibilityRole="button"
              onPress={() => {
                if (guard()) setEditingBatch(batch);
              }}
              style={styles.batchRow}
            >
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
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Pressable>
          ))
        )}
      </Section>

      <EditBatchSheet
        batch={editingBatch}
        onClose={() => setEditingBatch(null)}
        saving={updateBatch.isPending}
        onSave={async (details) => {
          if (!editingBatch) return;
          try {
            await updateBatch.mutateAsync({ batchId: editingBatch.id, ...details });
            setEditingBatch(null);
          } catch {
            Alert.alert('Could not save', 'Please try again.');
          }
        }}
        onDiscard={() => {
          // Close the edit sheet first: iOS can't stack two modals reliably.
          setDiscardTarget(editingBatch);
          setEditingBatch(null);
        }}
      />

      <ConfirmationDialog
        visible={!!discardTarget}
        title="Discard this batch?"
        message="The remaining stock in this batch is removed. You can undo it by deleting the entry in stock history."
        confirmLabel="Discard"
        destructive
        onCancel={() => setDiscardTarget(null)}
        onConfirm={async () => {
          const target = discardTarget;
          setDiscardTarget(null);
          if (!target) return;
          try {
            await discardBatch.mutateAsync(target.id);
          } catch (err: unknown) {
            Alert.alert('Could not discard', (err as Error)?.message ?? 'Please try again.');
          }
        }}
      />

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
  thresholdHint: {
    ...typography.caption,
    color: colors.accentStrong,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  batchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
});
