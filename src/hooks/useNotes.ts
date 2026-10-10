import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as notesService from '@/services/notes';
import { useAuth } from '@/context/AuthProvider';

export function useNotes() {
  return useQuery({ queryKey: ['notes'], queryFn: () => notesService.fetchNotes() });
}

export function useCreateNote() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      note,
      occurredAt,
      medicationId,
    }: {
      note: string;
      occurredAt: Date;
      medicationId?: string | null;
    }) => notesService.createNote(userId!, note, occurredAt, medicationId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notes'] });
      void queryClient.invalidateQueries({ queryKey: ['history'] });
    },
  });
}

export function useUpdateNote(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      note,
      occurredAt,
      medicationId,
    }: {
      note: string;
      occurredAt: Date;
      medicationId?: string | null;
    }) => notesService.updateNote(id, note, occurredAt, medicationId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notes'] });
      void queryClient.invalidateQueries({ queryKey: ['history'] });
    },
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notesService.deleteNote(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notes'] });
      void queryClient.invalidateQueries({ queryKey: ['history'] });
    },
  });
}
