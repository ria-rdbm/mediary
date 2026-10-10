import type { MedicationCategory, MedicationStatus } from '@/constants/categories';
import type { DoseUnit, StockUnit, InjectionSite } from '@/constants/units';
import type { SeverityLevel } from '@/constants/symptoms';

export interface Medication {
  id: string;
  name: string;
  category: MedicationCategory;
  status: MedicationStatus;
  finishedAt: string | null;
  color: string | null;
  defaultProviderId: string | null;
  defaultAmount: number | null;
  defaultAmountUnit: DoseUnit | null;
  defaultAmountUnitCustom: string | null;
  lastAmountUnit: DoseUnit | null;
  lastAmountUnitCustom: string | null;
  stockUnit: StockUnit | null;
  stockUnitCustom: string | null;
  autoDeductStock: boolean;
  stockUsedPerInjection: number | null;
  lowStockThreshold: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface MedicationWithStock extends Medication {
  totalStock: number;
  activeBatchCount: number;
  nearestExpiry: string | null;
}

export interface TreatmentRecord {
  id: string;
  medicationId: string;
  taken: boolean;
  occurredLocal: string;
  occurredUtc: string;
  utcOffsetMinutes: number;
  amount: number | null;
  amountUnit: DoseUnit | null;
  amountUnitCustom: string | null;
  site: InjectionSite | null;
  siteCustom: string | null;
  treatmentArea: string | null;
  notes: string | null;
  stockUsed: number | null;
  stockUnitAtTime: StockUnit | null;
  createdAt: string;
  updatedAt: string;
}

export interface StockBatch {
  id: string;
  medicationId: string;
  quantity: number;
  initialQuantity: number;
  stockUnit: StockUnit;
  stockUnitCustom: string | null;
  expiryDate: string | null;
  batchNumber: string | null;
  barcode: string | null;
  expiryReminderEnabled: boolean;
  expiryReminderDaysBefore: number | null;
  createdAt: string;
}

export interface StockTransaction {
  id: string;
  medicationId: string;
  type: 'add' | 'deduct' | 'manual_adjustment' | 'reversal';
  source: 'user' | 'system';
  sourceRecordId: string | null;
  quantity: number;
  stockUnit: StockUnit;
  stockUnitCustom: string | null;
  reversed: boolean;
  note: string | null;
  createdAt: string;
}

export interface MedicationReminder {
  id: string;
  medicationId: string;
  reminderDate: string;
  reminderTime: string;
  isActive: boolean;
  notificationId: string | null;
}

export interface Symptom {
  id: string;
  medicationId: string | null;
  name: string;
  severity: SeverityLevel;
  startLocal: string;
  endLocal: string | null;
  isOngoing: boolean;
  notes: string | null;
}

export interface WeightRecord {
  id: string;
  weightKg: number;
  recordedLocal: string;
  note: string | null;
}

export interface Note {
  id: string;
  medicationId: string | null;
  note: string;
  occurredLocal: string;
}

export interface Provider {
  id: string;
  name: string;
  lastUsedAt: string;
}

export interface Appointment {
  id: string;
  medicationId: string | null;
  providerId: string | null;
  providerNameSnapshot: string | null;
  visitLocal: string;
  providerInstructions: string | null;
  myNotes: string | null;
  treatmentChanges: string | null;
  nextAppointmentLocal: string | null;
}

export interface ProviderQuestion {
  id: string;
  appointmentId: string;
  question: string;
  isChecked: boolean;
  position: number;
}

export interface Entitlement {
  trialStartedAt: string | null;
  trialLengthDays: number;
  lifetimePurchasedAt: string | null;
}

export type HistoryRecordType =
  | 'treatment'
  | 'symptom'
  | 'weight'
  | 'note'
  | 'appointment'
  | 'stock';

export interface HistoryItem {
  id: string;
  type: HistoryRecordType;
  occurredLocal: string;
  medicationId: string | null;
  title: string;
  subtitle: string | null;
}
