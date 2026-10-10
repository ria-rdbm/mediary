import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { IconButton } from '@/components/ui/Button';
import { LoadingState, EmptyState } from '@/components/ui/States';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { colors, typography, spacing } from '@/theme';
import { useStockTransactions, useDeleteStockTransaction } from '@/hooks/useStock';
import { useWriteGuard } from '@/hooks/useWriteGuard';
import { formatLocalDate, formatLocalTime, captureLocalDateTime } from '@/lib/dateTime';
import type { StockTransaction } from '@/types/domain';

const TYPE_LABELS: Record<StockTransaction['type'], string> = {
  add: 'Stock added',
  deduct: 'Used',
  manual_adjustment: 'Manual adjustment',
  reversal: 'Reversal',
};

const TYPE_ICONS: Record<StockTransaction['type'], keyof typeof Ionicons.glyphMap> = {
  add: 'add-circle-outline',
  deduct: 'remove-circle-outline',
  manual_adjustment: 'build-outline',
  reversal: 'return-up-back-outline',
};

export default function StockHistoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: transactions, isLoading } = useStockTransactions(id);
  const deleteTransaction = useDeleteStockTransaction(id);
  const { guard } = useWriteGuard();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  return (
    <Screen scroll>
      <Header title="Stock History" />
      {isLoading ? (
        <LoadingState />
      ) : !transactions?.length ? (
        <EmptyState icon="cube-outline" title="No stock activity yet" />
      ) : (
        transactions.map((tx) => {
          const canDelete = tx.source === 'user' && !tx.reversed;
          const local = captureLocalDateTime(new Date(tx.createdAt)).local;
          return (
            <View key={tx.id} style={styles.row}>
              <Ionicons name={TYPE_ICONS[tx.type]} size={18} color={colors.textMuted} style={styles.icon} />
              <View style={styles.text}>
                <Text style={typography.body}>
                  {TYPE_LABELS[tx.type]} {tx.quantity > 0 ? '+' : ''}
                  {tx.quantity} {tx.stockUnit}
                  {tx.reversed ? ' (reversed)' : ''}
                </Text>
                <Text style={typography.caption}>
                  {formatLocalDate(local)} · {formatLocalTime(local)}
                </Text>
              </View>
              {canDelete && (
                <IconButton
                  icon="trash-outline"
                  tone="destructive"
                  accessibilityLabel="Delete"
                  onPress={() => {
                    if (guard()) setPendingDeleteId(tx.id);
                  }}
                />
              )}
            </View>
          );
        })
      )}

      <ConfirmationDialog
        visible={!!pendingDeleteId}
        title="Delete this entry?"
        message="This action cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          if (pendingDeleteId) await deleteTransaction.mutateAsync(pendingDeleteId);
          setPendingDeleteId(null);
        }}
        onCancel={() => setPendingDeleteId(null)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    gap: spacing.sm,
  },
  icon: { width: 20 },
  text: { flex: 1 },
});
