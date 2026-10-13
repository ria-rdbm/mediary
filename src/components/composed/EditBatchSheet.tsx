import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Input } from '@/components/ui/Input';
import { DatePickerField } from '@/components/ui/DateTimeFields';
import { PrimaryButton, TextButton } from '@/components/ui/Button';
import { typography, spacing } from '@/theme';
import { parseDateKey, todayDateKey } from '@/lib/dateTime';
import type { StockBatch } from '@/types/domain';

interface EditBatchSheetProps {
  batch: StockBatch | null;
  onClose: () => void;
  onSave: (details: { expiryDate: string | null; batchNumber: string | null; barcode: string | null }) => Promise<void>;
  onDiscard: () => void;
  saving?: boolean;
}

export function EditBatchSheet({ batch, onClose, onSave, onDiscard, saving }: EditBatchSheetProps) {
  // Keyed by batch id so the fields reset when a different batch is opened.
  return (
    <BottomSheet visible={!!batch} onClose={onClose} maxHeight="88%">
      {batch && <EditBatchForm key={batch.id} batch={batch} onSave={onSave} onDiscard={onDiscard} saving={saving} />}
    </BottomSheet>
  );
}

function EditBatchForm({
  batch,
  onSave,
  onDiscard,
  saving,
}: Pick<EditBatchSheetProps, 'onSave' | 'onDiscard' | 'saving'> & { batch: StockBatch }) {
  const [expiryDate, setExpiryDate] = useState<Date | null>(batch.expiryDate ? parseDateKey(batch.expiryDate) : null);
  const [batchNumber, setBatchNumber] = useState(batch.batchNumber ?? '');

  return (
    <View>
      <Text style={typography.sectionTitle}>
        Batch · {batch.quantity} {batch.stockUnit}
      </Text>
      <DatePickerField
            label="Expiry date (optional)"
            value={expiryDate ?? new Date()}
            onChange={setExpiryDate}
            placeholder={expiryDate ? undefined : 'Not set'}
          />
      {expiryDate && <TextButton label="Clear expiry date" onPress={() => setExpiryDate(null)} />}
      <Input
        label="Batch / Lot number (optional)"
        value={batchNumber}
        onChangeText={setBatchNumber}
        helperText="Found on the medication packaging."
      />
      <PrimaryButton
        label="Save"
        loading={saving}
        style={styles.save}
        onPress={() =>
          onSave({
            expiryDate: expiryDate ? todayDateKey(expiryDate) : null,
            batchNumber: batchNumber.trim() || null,
            barcode: batch.barcode,
          })
        }
      />
      <TextButton label="Discard remaining stock in this batch" tone="destructive" onPress={onDiscard} style={styles.discard} />
    </View>
  );
}

const styles = StyleSheet.create({
  save: { marginTop: spacing.md },
  discard: { alignSelf: 'center', marginTop: spacing.sm, marginBottom: spacing.sm },
});
