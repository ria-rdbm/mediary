import React, { useState } from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing, radius } from '@/theme';
import { PrimaryButton } from '@/components/ui/Button';

interface BarcodeScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onScanned: (value: string) => void;
}

export function BarcodeScannerModal({ visible, onClose, onScanned }: BarcodeScannerModalProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const insets = useSafeAreaInsets();

  if (!visible) return null;

  const handleScan = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    onScanned(data);
    onClose();
    setTimeout(() => setScanned(false), 500);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        {permission?.granted ? (
          <CameraView
            style={styles.camera}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'qr', 'datamatrix'] }}
            onBarcodeScanned={handleScan}
          />
        ) : (
          <View style={styles.permissionContainer}>
            <Ionicons name="camera-outline" size={32} color={colors.textMuted} />
            <Text style={[typography.body, styles.permissionText]}>
              Mediary needs camera access to scan a barcode.
            </Text>
            <PrimaryButton label="Allow Camera" onPress={requestPermission} style={{ marginTop: spacing.md }} />
          </View>
        )}
        <Pressable style={[styles.closeButton, { top: insets.top + spacing.sm }]} onPress={onClose}>
          <Ionicons name="close" size={22} color={colors.textOnAccent} />
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.background,
  },
  permissionText: {
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  closeButton: {
    position: 'absolute',
    right: spacing.md,
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
