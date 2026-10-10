export const DOSE_UNITS = ['mg', 'mcg', 'mL', 'units', 'Other'] as const;
export type DoseUnit = (typeof DOSE_UNITS)[number];

export const STOCK_UNITS = ['pen', 'vial', 'shots', 'units', 'mL', 'Other'] as const;
export type StockUnit = (typeof STOCK_UNITS)[number];

export const INJECTION_SITES = [
  'Abdomen Left',
  'Abdomen Right',
  'Thigh Left',
  'Thigh Right',
  'Upper Arm Left',
  'Upper Arm Right',
  'Other',
] as const;
export type InjectionSite = (typeof INJECTION_SITES)[number];

