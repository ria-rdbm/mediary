import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DatePickerField } from '@/components/ui/DateTimeFields';
import { PrimaryButton, TextButton } from '@/components/ui/Button';
import { BarcodeScannerModal } from '@/components/composed/BarcodeScannerModal';
import { colors, typography, spacing } from '@/theme';
import { todayDateKey } from '@/lib/dateTime';
import { STOCK_UNITS } from '@/constants/units';
import type { StockUnit } from '@/constants/units';

interface AddStockSheetProps {
  visible: boolean;
  onClose: () => void;
  lockedUnit: StockUnit | null;
  onSubmit: (input: {
    quantity: number;
    stockUnit: StockUnit;
    expiryDate: string | null;
    batchNumber: string | null;
    barcode: string | null;
  }) => Promise<void>;
  submitting?: boolean;
}

export function AddStockSheet({ visible, onClose, lockedUnit, onSubmit, submitting }: AddStockSheetProps) {
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState<StockUnit | null>(lockedUnit);
  const [showDetails, setShowDetails] = useState(false);
  const [expiryDate, setExpiryDate] = useState<Date | null>(null);
  const [batchNumber, setBatchNumber] = useState('');
  const [barcode, setBarcode] = useState('');
  const [scannerVisible, setScannerVisible] = useState(false);

  const reset = () => {
    setQuantity('');
    setUnit(lockedUnit);
    setShowDetails(false);
    setExpiryDate(null);
    setBatchNumber('');
    setBarcode('');
  };

  const handleSubmit = async () => {
    const effectiveUnit = lockedUnit ?? unit;
    if (!quantity || !effectiveUnit) return;
    await onSubmit({
      quantity: Number(quantity),
      stockUnit: effectiveUnit,
      expiryDate: expiryDate ? todayDateKey(expiryDate) : null,
      batchNumber: batchNumber || null,
      barcode: barcode || null,
    });
    reset();
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} maxHeight="88%">
      <Text style={typography.sectionTitle}>Add stock</Text>

      <View style={styles.row}>
        <Input
          label="Quantity"
          value={quantity}
          onChangeText={setQuantity}
          keyboardType="decimal-pad"
          placeholder="0"
          containerStyle={styles.quantityInput}
          autoFocus
        />
        {lockedUnit ? (
          <View style={styles.lockedUnit}>
            <Text style={typography.bodySecondary}>Unit</Text>
            <Text style={typography.body}>{lockedUnit}</Text>
          </View>
        ) : (
          <Select
            label="Unit"
            value={unit}
            options={STOCK_UNITS.map((u) => ({ value: u, label: u }))}
            onChange={setUnit}
            containerStyle={styles.unitSelect}
          />
        )}
      </View>

      <TextButton
        label={showDetails ? 'Hide details' : 'Add expiry, batch number, or barcode'}
        onPress={() => setShowDetails((v) => !v)}
      />

      {showDetails && (
        <View style={styles.details}>
          <DatePickerField
            label="Expiry date (optional)"
            value={expiryDate ?? new Date()}
            onChange={setExpiryDate}
            placeholder={expiryDate ? undefined : 'Not set'}
          />
          <Input
            label="Batch / Lot number (optional)"
            placeholder="Found on the medication packaging"
            helperText="Found on the medication packaging. Leave blank if you're not sure."
            value={batchNumber}
            onChangeText={setBatchNumber}
          />
          <Input
            label="Barcode (optional)"
            value={barcode}
            onChangeText={setBarcode}
            rightAccessory={
              <Pressable onPress={() => setScannerVisible(true)} hitSlop={8}>
                <Ionicons name="barcode-outline" size={22} color={colors.accentStrong} />
              </Pressable>
            }
          />
        </View>
      )}

      <PrimaryButton
        label="Add Stock"
        onPress={handleSubmit}
        disabled={!quantity || !(lockedUnit ?? unit)}
        loading={submitting}
        style={styles.submitButton}
      />

      <BarcodeScannerModal visible={scannerVisible} onClose={() => setScannerVisible(false)} onScanned={setBarcode} />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  quantityInput: { flex: 1 },
  unitSelect: { width: 120 },
  lockedUnit: {
    width: 100,
    justifyContent: 'center',
  },
  details: {
    marginTop: spacing.sm,
  },
  submitButton: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
});
