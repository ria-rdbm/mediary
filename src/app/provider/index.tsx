import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { Input } from '@/components/ui/Input';
import { IconButton, PrimaryButton } from '@/components/ui/Button';
import { EmptyState, LoadingState } from '@/components/ui/States';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { colors, typography, spacing } from '@/theme';
import { useProviders, useCreateProvider, useUpdateProvider, useDeleteProvider } from '@/hooks/useProviders';
import { useWriteGuard } from '@/hooks/useWriteGuard';
import type { Provider } from '@/types/domain';

export default function ProvidersScreen() {
  const { data: providers, isLoading } = useProviders();
  const createProvider = useCreateProvider();
  const updateProvider = useUpdateProvider();
  const deleteProvider = useDeleteProvider();
  const { guard } = useWriteGuard();

  const [editing, setEditing] = useState<Provider | 'new' | null>(null);
  const [name, setName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Provider | null>(null);

  const openNew = () => {
    setName('');
    setEditing('new');
  };

  const openEdit = (provider: Provider) => {
    setName(provider.name);
    setEditing(provider);
  };

  const handleSave = async () => {
    if (!guard() || !name.trim()) return;
    if (editing === 'new') {
      await createProvider.mutateAsync(name);
    } else if (editing) {
      await updateProvider.mutateAsync({ id: editing.id, name });
    }
    setEditing(null);
  };

  return (
    <Screen scroll>
      <Header title="Providers & Clinics" rightLabel="Add" onRightPress={openNew} />

      {isLoading ? (
        <LoadingState />
      ) : !providers?.length ? (
        <EmptyState icon="people-outline" title="No providers yet" message="Add a provider or clinic to reuse it in appointments." actionLabel="Add provider" onAction={openNew} />
      ) : (
        providers.map((provider) => (
          <View key={provider.id} style={styles.row}>
            <Text style={typography.body}>{provider.name}</Text>
            <View style={styles.rowActions}>
              <IconButton icon="pencil-outline" accessibilityLabel="Edit" onPress={() => openEdit(provider)} />
              <IconButton icon="trash-outline" tone="destructive" accessibilityLabel="Delete" onPress={() => setDeleteTarget(provider)} />
            </View>
          </View>
        ))
      )}

      <BottomSheet visible={!!editing} onClose={() => setEditing(null)} maxHeight="45%">
        <Text style={typography.sectionTitle}>{editing === 'new' ? 'Add provider' : 'Edit provider'}</Text>
        <Input label="Name" placeholder="e.g. Dr. Smith — Auckland Clinic" value={name} onChangeText={setName} autoFocus containerStyle={{ marginTop: spacing.sm }} />
        <PrimaryButton label="Save" onPress={handleSave} disabled={!name.trim()} style={{ marginTop: spacing.sm, marginBottom: spacing.sm }} />
      </BottomSheet>

      <ConfirmationDialog
        visible={!!deleteTarget}
        title="Delete this provider?"
        message="Past appointments will keep their recorded provider name."
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          if (deleteTarget) await deleteProvider.mutateAsync(deleteTarget.id);
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  rowActions: {
    flexDirection: 'row',
  },
});
