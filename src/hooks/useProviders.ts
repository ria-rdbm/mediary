import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as providersService from '@/services/providers';
import { useAuth } from '@/context/AuthProvider';

export function useProviders() {
  return useQuery({ queryKey: ['providers'], queryFn: () => providersService.fetchProviders() });
}

export function useCreateProvider() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => providersService.createProvider(userId!, name),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['providers'] }),
  });
}

export function useUpdateProvider() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => providersService.updateProvider(id, name),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['providers'] }),
  });
}

export function useDeleteProvider() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => providersService.deleteProvider(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['providers'] }),
  });
}
