import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as profileService from '@/services/profile';
import type { ProfileDetailsInput } from '@/services/profile';
import { useAuth } from '@/context/AuthProvider';

export function useProfile() {
  const { userId } = useAuth();
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: profileService.fetchProfile,
    enabled: !!userId,
  });
}

export function useAcknowledgeDisclaimer() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => profileService.acknowledgeDisclaimer(userId!),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['profile'] }),
  });
}

export function useCompleteOnboarding() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (categories: string[]) => profileService.completeOnboarding(userId!, categories),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['profile'] }),
  });
}

export function useUpdateProfileDetails() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (details: ProfileDetailsInput) => profileService.updateProfileDetails(userId!, details),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['profile'] }),
  });
}
