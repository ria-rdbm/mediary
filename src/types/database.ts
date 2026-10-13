/**
 * Hand-written mirror of the Supabase schema (supabase/migrations/*.sql).
 * Once a real project exists, regenerate with:
 *   npx supabase gen types typescript --project-id <ref> > src/types/database.ts
 * and re-apply the RPC function signatures below (the generator does not
 * infer function argument/return types as richly as this hand-written file).
 */

export type MedicationCategoryDb =
  | 'glp1'
  | 'insulin'
  | 'other_medication'
  | 'cosmetic_treatment'
  | 'other_health_injection';

export type MedicationStatusDb = 'active' | 'paused' | 'finished';
export type AmountUnitDb = 'mg' | 'mcg' | 'mL' | 'units' | 'Other';
export type StockUnitDb = 'pen' | 'vial' | 'shots' | 'units' | 'mL' | 'Other';
export type SeverityDb = 'mild' | 'moderate' | 'severe';
export type StockTransactionTypeDb = 'add' | 'deduct' | 'manual_adjustment' | 'reversal';
export type StockTransactionSourceDb = 'user' | 'system';
export type StoreDb = 'app_store' | 'play_store';

export type ProfileRow = {
  id: string;
  disclaimer_acknowledged_at: string | null;
  onboarding_completed_at: string | null;
  onboarding_categories: string[];
  full_name: string | null;
  gender: 'female' | 'male' | 'other' | 'prefer_not_to_say' | null;
  date_of_birth: string | null;
  weight_kg: number | null;
  nhi_number: string | null;
  preferred_provider_name: string | null;
  created_at: string;
  updated_at: string;
};

export type ProviderRow = {
  id: string;
  user_id: string;
  name: string;
  last_used_at: string;
  created_at: string;
  updated_at: string;
};

export type MedicationRow = {
  id: string;
  user_id: string;
  name: string;
  category: MedicationCategoryDb;
  status: MedicationStatusDb;
  finished_at: string | null;
  color: string | null;
  default_provider_id: string | null;
  default_amount: number | null;
  default_amount_unit: AmountUnitDb | null;
  default_amount_unit_custom: string | null;
  last_amount_unit: AmountUnitDb | null;
  last_amount_unit_custom: string | null;
  stock_unit: StockUnitDb | null;
  stock_unit_custom: string | null;
  auto_deduct_stock: boolean;
  stock_used_per_injection: number | null;
  low_stock_threshold: number | null;
  low_stock_notified_at: string | null;
  created_at: string;
  updated_at: string;
};

export type TreatmentRecordRow = {
  id: string;
  user_id: string;
  medication_id: string;
  taken: boolean;
  occurred_local: string;
  occurred_utc: string;
  utc_offset_minutes: number;
  amount: number | null;
  amount_unit: AmountUnitDb | null;
  amount_unit_custom: string | null;
  site: string | null;
  site_custom: string | null;
  treatment_area: string | null;
  notes: string | null;
  stock_used: number | null;
  stock_unit_at_time: StockUnitDb | null;
  created_at: string;
  updated_at: string;
};

export type StockBatchRow = {
  id: string;
  user_id: string;
  medication_id: string;
  quantity: number;
  initial_quantity: number;
  stock_unit: StockUnitDb;
  stock_unit_custom: string | null;
  expiry_date: string | null;
  batch_number: string | null;
  barcode: string | null;
  expiry_reminder_enabled: boolean;
  expiry_reminder_days_before: number | null;
  expiry_reminder_notification_id: string | null;
  created_at: string;
  updated_at: string;
};

export type StockTransactionRow = {
  id: string;
  user_id: string;
  medication_id: string;
  type: StockTransactionTypeDb;
  source: StockTransactionSourceDb;
  source_record_id: string | null;
  quantity: number;
  stock_unit: StockUnitDb;
  stock_unit_custom: string | null;
  reversed: boolean;
  note: string | null;
  created_at: string;
};

export type StockTransactionAllocationRow = {
  id: string;
  stock_transaction_id: string;
  stock_batch_id: string;
  quantity: number;
  created_at: string;
};

export type MedicationReminderRow = {
  id: string;
  user_id: string;
  medication_id: string;
  reminder_date: string;
  reminder_time: string;
  is_active: boolean;
  notification_id: string | null;
  created_at: string;
  updated_at: string;
};

export type SymptomRow = {
  id: string;
  user_id: string;
  medication_id: string | null;
  name: string;
  severity: SeverityDb;
  start_local: string;
  start_utc: string;
  utc_offset_minutes: number;
  end_local: string | null;
  end_utc: string | null;
  is_ongoing: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type WeightRecordRow = {
  id: string;
  user_id: string;
  weight_kg: number;
  recorded_local: string;
  recorded_utc: string;
  utc_offset_minutes: number;
  note: string | null;
  created_at: string;
  updated_at: string;
};

export type NoteRow = {
  id: string;
  user_id: string;
  medication_id: string | null;
  note: string;
  occurred_local: string;
  occurred_utc: string;
  utc_offset_minutes: number;
  created_at: string;
  updated_at: string;
};

export type AppointmentRow = {
  id: string;
  user_id: string;
  medication_id: string | null;
  provider_id: string | null;
  provider_name_snapshot: string | null;
  visit_local: string;
  visit_utc: string;
  utc_offset_minutes: number;
  provider_instructions: string | null;
  my_notes: string | null;
  treatment_changes: string | null;
  next_appointment_local: string | null;
  created_at: string;
  updated_at: string;
};

export type ProviderQuestionRow = {
  id: string;
  user_id: string;
  appointment_id: string;
  question: string;
  is_checked: boolean;
  position: number;
  created_at: string;
  updated_at: string;
};

export type AppointmentReminderRow = {
  id: string;
  user_id: string;
  appointment_id: string;
  minutes_before: number | null;
  custom_local: string | null;
  notification_id: string | null;
  created_at: string;
};

export type EntitlementRow = {
  user_id: string;
  trial_started_at: string | null;
  trial_length_days: number;
  lifetime_purchased_at: string | null;
  revenuecat_app_user_id: string | null;
  store: StoreDb | null;
  last_verified_at: string | null;
  created_at: string;
  updated_at: string;
};

export type MedicationStockTotalRow = {
  medication_id: string;
  user_id: string;
  total_quantity: number;
  active_batch_count: number;
  nearest_expiry: string | null;
};

type TableDef<Row, Insert, Update> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      profiles: TableDef<ProfileRow, never, Partial<Omit<ProfileRow, 'id'>>>;
      providers: TableDef<
        ProviderRow,
        Pick<ProviderRow, 'user_id' | 'name'> & Partial<ProviderRow>,
        Partial<ProviderRow>
      >;
      medications: TableDef<
        MedicationRow,
        Pick<MedicationRow, 'user_id' | 'name' | 'category'> & Partial<MedicationRow>,
        Partial<MedicationRow>
      >;
      treatment_records: TableDef<TreatmentRecordRow, never, never>; // written via RPCs only
      // quantity/initial_quantity/stock_unit are written via RPCs only; the
      // expiry-reminder fields are plain client updates (section 38).
      stock_batches: TableDef<
        StockBatchRow,
        never,
        Partial<
          Pick<
            StockBatchRow,
            | 'expiry_date'
            | 'batch_number'
            | 'barcode'
            | 'expiry_reminder_enabled'
            | 'expiry_reminder_days_before'
            | 'expiry_reminder_notification_id'
          >
        >
      >;
      stock_transactions: TableDef<StockTransactionRow, never, never>; // written via RPCs only
      stock_transaction_allocations: TableDef<StockTransactionAllocationRow, never, never>;
      medication_reminders: TableDef<
        MedicationReminderRow,
        Pick<MedicationReminderRow, 'user_id' | 'medication_id' | 'reminder_date' | 'reminder_time'> &
          Partial<MedicationReminderRow>,
        Partial<MedicationReminderRow>
      >;
      symptoms: TableDef<
        SymptomRow,
        Pick<SymptomRow, 'user_id' | 'name' | 'severity' | 'start_local' | 'start_utc' | 'utc_offset_minutes'> &
          Partial<SymptomRow>,
        Partial<SymptomRow>
      >;
      weight_records: TableDef<
        WeightRecordRow,
        Pick<WeightRecordRow, 'user_id' | 'weight_kg' | 'recorded_local' | 'recorded_utc' | 'utc_offset_minutes'> &
          Partial<WeightRecordRow>,
        Partial<WeightRecordRow>
      >;
      notes: TableDef<
        NoteRow,
        Pick<NoteRow, 'user_id' | 'note' | 'occurred_local' | 'occurred_utc' | 'utc_offset_minutes'> &
          Partial<NoteRow>,
        Partial<NoteRow>
      >;
      appointments: TableDef<
        AppointmentRow,
        Pick<AppointmentRow, 'user_id' | 'visit_local' | 'visit_utc' | 'utc_offset_minutes'> &
          Partial<AppointmentRow>,
        Partial<AppointmentRow>
      >;
      provider_questions: TableDef<
        ProviderQuestionRow,
        Pick<ProviderQuestionRow, 'user_id' | 'appointment_id' | 'question'> & Partial<ProviderQuestionRow>,
        Partial<ProviderQuestionRow>
      >;
      appointment_reminders: TableDef<
        AppointmentReminderRow,
        Pick<AppointmentReminderRow, 'user_id' | 'appointment_id'> & Partial<AppointmentReminderRow>,
        never
      >;
      entitlements: TableDef<EntitlementRow, never, never>; // written via RPC/Edge Functions only
    };
    Views: {
      medication_stock_totals: { Row: MedicationStockTotalRow; Relationships: [] };
    };
    Functions: {
      start_trial: { Args: Record<string, never>; Returns: EntitlementRow };
      log_treatment_record: {
        Args: {
          p_medication_id: string;
          p_taken: boolean;
          p_occurred_local: string;
          p_occurred_utc: string;
          p_utc_offset_minutes: number;
          p_amount?: number | null;
          p_amount_unit?: string | null;
          p_amount_unit_custom?: string | null;
          p_site?: string | null;
          p_site_custom?: string | null;
          p_treatment_area?: string | null;
          p_notes?: string | null;
          p_stock_used?: number | null;
        };
        Returns: {
          record: TreatmentRecordRow;
          stock_deducted: number;
          stock_shortfall: number;
          cancelled_reminder_notification_id: string | null;
        };
      };
      update_treatment_record: {
        Args: {
          p_record_id: string;
          p_medication_id: string;
          p_taken: boolean;
          p_occurred_local: string;
          p_occurred_utc: string;
          p_utc_offset_minutes: number;
          p_amount?: number | null;
          p_amount_unit?: string | null;
          p_amount_unit_custom?: string | null;
          p_site?: string | null;
          p_site_custom?: string | null;
          p_treatment_area?: string | null;
          p_notes?: string | null;
          p_stock_used?: number | null;
        };
        Returns: { record: TreatmentRecordRow; stock_deducted: number; stock_shortfall: number };
      };
      delete_treatment_record: { Args: { p_record_id: string }; Returns: void };
      record_stock_usage: {
        Args: { p_record_id: string; p_stock_used: number; p_remember_default?: boolean };
        Returns: { stock_deducted: number; stock_shortfall: number };
      };
      add_stock_batch: {
        Args: {
          p_medication_id: string;
          p_quantity: number;
          p_stock_unit: string;
          p_stock_unit_custom?: string | null;
          p_expiry_date?: string | null;
          p_batch_number?: string | null;
          p_barcode?: string | null;
        };
        Returns: StockBatchRow;
      };
      manual_stock_adjustment: {
        Args: { p_medication_id: string; p_actual_stock: number };
        Returns: { diff: number };
      };
      delete_stock_transaction: { Args: { p_transaction_id: string }; Returns: void };
      discard_stock_batch: { Args: { p_batch_id: string }; Returns: number };
    };
  };
};
