import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { colors } from '@/theme';

const SWATCH = 32;
const RING = 3;

/** The curated medication palette; the chosen colour gets a ring of itself. */
export function ColorSwatchPicker({ value, onChange }: { value: string | null; onChange: (color: string) => void }) {
  return (
    <View style={styles.row}>
      {colors.medicationPalette.map((paletteColor) => {
        const selected = value === paletteColor;
        return (
          <Pressable
            key={paletteColor}
            accessibilityRole="button"
            accessibilityLabel={`Colour ${paletteColor}`}
            accessibilityState={{ selected }}
            onPress={() => onChange(paletteColor)}
            hitSlop={4}
            style={[styles.ring, selected && { borderColor: paletteColor }]}
          >
            <View style={[styles.swatch, { backgroundColor: paletteColor }]} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  ring: {
    width: SWATCH + RING * 4,
    height: SWATCH + RING * 4,
    borderRadius: (SWATCH + RING * 4) / 2,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatch: {
    width: SWATCH,
    height: SWATCH,
    borderRadius: SWATCH / 2,
  },
});
