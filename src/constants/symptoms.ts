export const DEFAULT_SYMPTOMS = [
  'Nausea',
  'Vomiting',
  'Constipation',
  'Diarrhoea',
  'Headache',
  'Fatigue',
  'Injection-site discomfort',
  'Other',
] as const;
export type DefaultSymptom = (typeof DEFAULT_SYMPTOMS)[number];

export const SEVERITY_LEVELS = ['mild', 'moderate', 'severe'] as const;
export type SeverityLevel = (typeof SEVERITY_LEVELS)[number];

export const SEVERITY_LABELS: Record<SeverityLevel, string> = {
  mild: 'Mild',
  moderate: 'Moderate',
  severe: 'Severe',
};

export const APPOINTMENT_REMINDER_PRESETS = [
  { label: '1 day before', minutesBefore: 60 * 24 },
  { label: '2 hours before', minutesBefore: 120 },
  { label: '1 hour before', minutesBefore: 60 },
  { label: 'Custom', minutesBefore: null },
] as const;
