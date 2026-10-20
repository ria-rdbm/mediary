export type Gender = 'female' | 'male' | 'other' | 'prefer_not_to_say';

export const GENDER_LABELS: Record<Gender, string> = {
  female: 'Female',
  male: 'Male',
  other: 'Other',
  prefer_not_to_say: 'Prefer not to say',
};

export const ALL_GENDERS: Gender[] = ['female', 'male', 'other', 'prefer_not_to_say'];

// NZ NHI number: 3 letters followed by either 4 digits (legacy format) or
// 2 digits + 2 letters (post-2022 format). Loose on purpose — this only
// catches obvious typos, not a full checksum validation.
const NHI_PATTERN = /^[A-Za-z]{3}[0-9]{2}[A-Za-z0-9]{2}$/;

export function isValidNhiNumber(value: string): boolean {
  return NHI_PATTERN.test(value.trim());
}
