import type {
  MedicationRow,
  TreatmentRecordRow,
  StockBatchRow,
  StockTransactionRow,
  MedicationReminderRow,
  SymptomRow,
  WeightRecordRow,
  NoteRow,
  ProviderRow,
  AppointmentRow,
  ProviderQuestionRow,
  MedicationStockTotalRow,
} from '@/types/database';
import type {
  Medication,
  MedicationWithStock,
  TreatmentRecord,
  StockBatch,
  StockTransaction,
  MedicationReminder,
  Symptom,
  WeightRecord,
  Note,
  Provider,
  Appointment,
  ProviderQuestion,
} from '@/types/domain';

export function mapMedication(row: MedicationRow): Medication {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    status: row.status,
    finishedAt: row.finished_at,
    color: row.color,
    defaultProviderId: row.default_provider_id,
    defaultAmount: row.default_amount,
    defaultAmountUnit: row.default_amount_unit,
    defaultAmountUnitCustom: row.default_amount_unit_custom,
    lastAmountUnit: row.last_amount_unit,
    lastAmountUnitCustom: row.last_amount_unit_custom,
    stockUnit: row.stock_unit,
    stockUnitCustom: row.stock_unit_custom,
    autoDeductStock: row.auto_deduct_stock,
    stockUsedPerInjection: row.stock_used_per_injection,
    lowStockThreshold: row.low_stock_threshold,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapMedicationWithStock(
  row: MedicationRow,
  stock?: MedicationStockTotalRow | null,
): MedicationWithStock {
  return {
    ...mapMedication(row),
    totalStock: stock?.total_quantity ?? 0,
    activeBatchCount: stock?.active_batch_count ?? 0,
    nearestExpiry: stock?.nearest_expiry ?? null,
  };
}

export function mapTreatmentRecord(row: TreatmentRecordRow): TreatmentRecord {
  return {
    id: row.id,
    medicationId: row.medication_id,
    taken: row.taken,
    occurredLocal: row.occurred_local,
    occurredUtc: row.occurred_utc,
    utcOffsetMinutes: row.utc_offset_minutes,
    amount: row.amount,
    amountUnit: row.amount_unit,
    amountUnitCustom: row.amount_unit_custom,
    site: row.site as TreatmentRecord['site'],
    siteCustom: row.site_custom,
    treatmentArea: row.treatment_area,
    notes: row.notes,
    stockUsed: row.stock_used,
    stockUnitAtTime: row.stock_unit_at_time,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapStockBatch(row: StockBatchRow): StockBatch {
  return {
    id: row.id,
    medicationId: row.medication_id,
    quantity: row.quantity,
    initialQuantity: row.initial_quantity,
    stockUnit: row.stock_unit,
    stockUnitCustom: row.stock_unit_custom,
    expiryDate: row.expiry_date,
    batchNumber: row.batch_number,
    barcode: row.barcode,
    expiryReminderEnabled: row.expiry_reminder_enabled,
    expiryReminderDaysBefore: row.expiry_reminder_days_before,
    createdAt: row.created_at,
  };
}

export function mapStockTransaction(row: StockTransactionRow): StockTransaction {
  return {
    id: row.id,
    medicationId: row.medication_id,
    type: row.type,
    source: row.source,
    sourceRecordId: row.source_record_id,
    quantity: row.quantity,
    stockUnit: row.stock_unit,
    stockUnitCustom: row.stock_unit_custom,
    reversed: row.reversed,
    note: row.note,
    createdAt: row.created_at,
  };
}

export function mapMedicationReminder(row: MedicationReminderRow): MedicationReminder {
  return {
    id: row.id,
    medicationId: row.medication_id,
    reminderDate: row.reminder_date,
    reminderTime: row.reminder_time,
    isActive: row.is_active,
    notificationId: row.notification_id,
  };
}

export function mapSymptom(row: SymptomRow): Symptom {
  return {
    id: row.id,
    medicationId: row.medication_id,
    name: row.name,
    severity: row.severity,
    startLocal: row.start_local,
    endLocal: row.end_local,
    isOngoing: row.is_ongoing,
    notes: row.notes,
  };
}

export function mapWeightRecord(row: WeightRecordRow): WeightRecord {
  return {
    id: row.id,
    weightKg: row.weight_kg,
    recordedLocal: row.recorded_local,
    note: row.note,
  };
}

export function mapNote(row: NoteRow): Note {
  return {
    id: row.id,
    medicationId: row.medication_id,
    note: row.note,
    occurredLocal: row.occurred_local,
  };
}

export function mapProvider(row: ProviderRow): Provider {
  return { id: row.id, name: row.name, lastUsedAt: row.last_used_at };
}

export function mapAppointment(row: AppointmentRow): Appointment {
  return {
    id: row.id,
    medicationId: row.medication_id,
    providerId: row.provider_id,
    providerNameSnapshot: row.provider_name_snapshot,
    visitLocal: row.visit_local,
    providerInstructions: row.provider_instructions,
    myNotes: row.my_notes,
    treatmentChanges: row.treatment_changes,
    nextAppointmentLocal: row.next_appointment_local,
  };
}

export function mapProviderQuestion(row: ProviderQuestionRow): ProviderQuestion {
  return {
    id: row.id,
    appointmentId: row.appointment_id,
    question: row.question,
    isChecked: row.is_checked,
    position: row.position,
  };
}
