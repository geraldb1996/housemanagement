// Generated with `supabase gen types typescript`
// For now, a broad-strokes type stub to keep the app typed.
// Replace with real generated types once the Supabase project is connected.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      households: { Row: Household; Insert: HouseholdInsert; Update: HouseholdUpdate }
      household_members: { Row: HouseholdMember; Insert: HouseholdMemberInsert; Update: HouseholdMemberUpdate }
      profiles: { Row: Profile; Insert: ProfileInsert; Update: ProfileUpdate }
      accounts: { Row: Account; Insert: AccountInsert; Update: AccountUpdate }
      categories: { Row: Category; Insert: CategoryInsert; Update: CategoryUpdate }
      payment_cycles: { Row: PaymentCycle; Insert: PaymentCycleInsert; Update: PaymentCycleUpdate }
      people: { Row: Person; Insert: PersonInsert; Update: PersonUpdate }
      recurring_rules: { Row: RecurringRule; Insert: RecurringRuleInsert; Update: RecurringRuleUpdate }
      transactions: { Row: Transaction; Insert: TransactionInsert; Update: TransactionUpdate }
      transaction_splits: { Row: TransactionSplit; Insert: TransactionSplitInsert; Update: TransactionSplitUpdate }
      payment_obligations: { Row: PaymentObligation; Insert: PaymentObligationInsert; Update: PaymentObligationUpdate }
      obligation_payments: { Row: ObligationPayment; Insert: ObligationPaymentInsert; Update: ObligationPaymentUpdate }
      budgets: { Row: Budget; Insert: BudgetInsert; Update: BudgetUpdate }
      budget_lines: { Row: BudgetLine; Insert: BudgetLineInsert; Update: BudgetLineUpdate }
      monthly_closings: { Row: MonthlyClosing; Insert: MonthlyClosingInsert; Update: MonthlyClosingUpdate }
      shopping_categories: { Row: ShoppingCategory; Insert: ShoppingCategoryInsert; Update: ShoppingCategoryUpdate }
      products: { Row: Product; Insert: ProductInsert; Update: ProductUpdate }
      shopping_lists: { Row: ShoppingList; Insert: ShoppingListInsert; Update: ShoppingListUpdate }
      shopping_list_items: { Row: ShoppingListItem; Insert: ShoppingListItemInsert; Update: ShoppingListItemUpdate }
      subscription_services: { Row: SubscriptionService; Insert: SubscriptionServiceInsert; Update: SubscriptionServiceUpdate }
      subscriptions: { Row: Subscription; Insert: SubscriptionInsert; Update: SubscriptionUpdate }
      subscription_shared_users: { Row: SubscriptionSharedUser; Insert: SubscriptionSharedUserInsert; Update: SubscriptionSharedUserUpdate }
      games: { Row: Game; Insert: GameInsert; Update: GameUpdate }
      watchlist_items: { Row: WatchlistItem; Insert: WatchlistItemInsert; Update: WatchlistItemUpdate }
      document_folders: { Row: DocumentFolder; Insert: DocumentFolderInsert; Update: DocumentFolderUpdate }
      documents: { Row: Document; Insert: DocumentInsert; Update: DocumentUpdate }
      inventory_items: { Row: InventoryItem; Insert: InventoryItemInsert; Update: InventoryItemUpdate }
      inventory_maintenance: { Row: InventoryMaintenance; Insert: InventoryMaintenanceInsert; Update: InventoryMaintenanceUpdate }
      pets: { Row: Pet; Insert: PetInsert; Update: PetUpdate }
      pet_medical_records: { Row: PetMedicalRecord; Insert: PetMedicalRecordInsert; Update: PetMedicalRecordUpdate }
      pet_vaccinations: { Row: PetVaccination; Insert: PetVaccinationInsert; Update: PetVaccinationUpdate }
      vehicles: { Row: Vehicle; Insert: VehicleInsert; Update: VehicleUpdate }
      vehicle_service_records: { Row: VehicleServiceRecord; Insert: VehicleServiceRecordInsert; Update: VehicleServiceRecordUpdate }
      tags: { Row: Tag; Insert: TagInsert; Update: TagUpdate }
      taggings: { Row: Tagging; Insert: TaggingInsert; Update: TaggingUpdate }
      attachments: { Row: Attachment; Insert: AttachmentInsert; Update: AttachmentUpdate }
      reminders: { Row: Reminder; Insert: ReminderInsert; Update: ReminderUpdate }
      notifications: { Row: Notification; Insert: NotificationInsert; Update: NotificationUpdate }
      audit_log: { Row: AuditLog; Insert: AuditLogInsert; Update: AuditLogUpdate }
      app_settings: { Row: AppSettings; Insert: AppSettingsInsert; Update: AppSettingsUpdate }
    }
    Views: {
      v_net_worth: { Row: VNetWorth }
      v_monthly_by_category: { Row: VMonthlyByCategory }
      v_upcoming_reminders: { Row: VUpcomingReminder }
      v_renewals: { Row: VRenewal }
      v_open_obligations: { Row: VOpenObligation }
    }
    Functions: {
      is_household_member: { Args: { h_id: string }; Returns: boolean }
      household_role_of: { Args: { h_id: string }; Returns: string }
      is_household_admin: { Args: { h_id: string }; Returns: boolean }
      compute_account_balance: { Args: { acc: string }; Returns: number }
      compute_account_delta: { Args: { acc: string }; Returns: number }
    }
  }
}

// ── Core ──
export interface Household { id: string; name: string; base_currency: string; timezone: string; created_at: string; updated_at: string }
export type HouseholdInsert = Omit<Household, "id" | "created_at" | "updated_at"> & { id?: string }
export type HouseholdUpdate = Partial<HouseholdInsert>

export interface HouseholdMember { id: string; household_id: string; user_id: string; role: "admin" | "member"; display_name: string | null; joined_at: string; created_at: string; updated_at: string }
export type HouseholdMemberInsert = Omit<HouseholdMember, "id" | "created_at" | "updated_at"> & { id?: string }
export type HouseholdMemberUpdate = Partial<HouseholdMemberInsert>

export interface Profile { id: string; email: string | null; full_name: string | null; avatar_url: string | null; default_household_id: string | null; preferences: Json; created_at: string; updated_at: string }
export type ProfileInsert = Omit<Profile, "id" | "created_at" | "updated_at"> & { id?: string }
export type ProfileUpdate = Partial<ProfileInsert>

// ── Finance ──
export interface Account { id: string; household_id: string; name: string; account_type: "cash" | "bank" | "savings" | "credit_card"; institution: string | null; opening_balance: number; current_balance: number; currency: string; color: string | null; is_archived: boolean; include_in_net_worth: boolean; created_at: string; updated_at: string; created_by: string | null; updated_by: string | null }
export type AccountInsert = Omit<Account, "id" | "created_at" | "updated_at"> & { id?: string }
export type AccountUpdate = Partial<AccountInsert>

export interface Category { id: string; household_id: string; parent_id: string | null; name: string; kind: "income" | "expense" | "transfer"; icon: string | null; color: string | null; sort_order: number; is_archived: boolean; created_at: string; updated_at: string; created_by: string | null; updated_by: string | null }
export type CategoryInsert = Omit<Category, "id" | "created_at" | "updated_at"> & { id?: string }
export type CategoryUpdate = Partial<CategoryInsert>

export interface PaymentCycle { id: string; household_id: string; name: string; cycle_type: string; config: Json; active: boolean; created_at: string; updated_at: string; created_by: string | null; updated_by: string | null }
export type PaymentCycleInsert = Omit<PaymentCycle, "id" | "created_at" | "updated_at"> & { id?: string }
export type PaymentCycleUpdate = Partial<PaymentCycleInsert>

export interface Person { id: string; household_id: string; name: string; relationship: string | null; color: string | null; notes: string | null; is_archived: boolean; created_at: string; updated_at: string; created_by: string | null; updated_by: string | null }
export type PersonInsert = Omit<Person, "id" | "created_at" | "updated_at"> & { id?: string }
export type PersonUpdate = Partial<PersonInsert>

export interface RecurringRule { id: string; household_id: string; account_id: string; category_id: string | null; type: "income" | "expense" | "transfer"; amount: number; frequency: string; interval: number; day_of_month: number | null; next_run: string; active: boolean; created_at: string; updated_at: string; created_by: string | null; updated_by: string | null }
export type RecurringRuleInsert = Omit<RecurringRule, "id" | "created_at" | "updated_at"> & { id?: string }
export type RecurringRuleUpdate = Partial<RecurringRuleInsert>

export interface Transaction { id: string; household_id: string; account_id: string; category_id: string | null; type: "income" | "expense" | "transfer"; amount: number; transfer_direction: "in" | "out" | null; currency: string; date: string; payment_cycle_id: string | null; paid: boolean; paid_at: string | null; transfer_pair_id: string | null; person_id: string | null; description: string | null; notes: string | null; recurring_rule_id: string | null; deleted_at: string | null; created_at: string; updated_at: string; created_by: string | null; updated_by: string | null; category?: Category | null; account?: Account | null; person?: Person | null; payment_cycle?: PaymentCycle | null }
export type TransactionInsert = Omit<Transaction, "id" | "created_at" | "updated_at" | "account" | "category" | "person" | "payment_cycle"> & { id?: string }
export type TransactionUpdate = Partial<TransactionInsert>

export interface TransactionSplit { id: string; transaction_id: string; category_id: string; amount: number; note: string | null; category?: Category | null }
export type TransactionSplitInsert = Omit<TransactionSplit, "id" | "category"> & { id?: string }
export type TransactionSplitUpdate = Partial<TransactionSplitInsert>

export interface PaymentObligation { id: string; household_id: string; direction: "owed_to_us" | "owed_by_us"; person_id: string; description: string; total_amount: number; paid_amount: number; status: "open" | "partially_paid" | "settled" | "cancelled"; due_date: string | null; payment_cycle_id: string | null; source_transaction_id: string | null; settled_at: string | null; deleted_at: string | null; created_at: string; updated_at: string; created_by: string | null; updated_by: string | null; person?: Person | null }
export type PaymentObligationInsert = Omit<PaymentObligation, "id" | "created_at" | "updated_at" | "person"> & { id?: string }
export type PaymentObligationUpdate = Partial<PaymentObligationInsert>

export interface ObligationPayment { id: string; obligation_id: string; amount: number; paid_date: string; transaction_id: string | null; notes: string | null; created_at: string; updated_at: string; created_by: string | null; updated_by: string | null }
export type ObligationPaymentInsert = Omit<ObligationPayment, "id" | "created_at" | "updated_at"> & { id?: string }
export type ObligationPaymentUpdate = Partial<ObligationPaymentInsert>

export interface Budget { id: string; household_id: string; name: string; period_month: string; scope: "household" | "account" | "person"; scope_account_id: string | null; scope_person_id: string | null; recurrence: string | null; recurrence_start: string | null; is_general: boolean; total_amount: number | null; created_at: string; updated_at: string; created_by: string | null; updated_by: string | null }
export type BudgetInsert = Omit<Budget, "id" | "created_at" | "updated_at"> & { id?: string }
export type BudgetUpdate = Partial<BudgetInsert>

export interface BudgetLine { id: string; budget_id: string; category_id: string; planned_amount: number; created_at: string; updated_at: string; created_by: string | null; updated_by: string | null; category?: Category | null }
export type BudgetLineInsert = Omit<BudgetLine, "id" | "created_at" | "updated_at" | "category"> & { id?: string }
export type BudgetLineUpdate = Partial<BudgetLineInsert>

export interface MonthlyClosing { id: string; household_id: string; period_month: string; closed_at: string; closed_by: string | null; notes: string | null }
export type MonthlyClosingInsert = Omit<MonthlyClosing, "id"> & { id?: string }
export type MonthlyClosingUpdate = Partial<MonthlyClosingInsert>

// ── Shopping ──
export interface ShoppingCategory { id: string; household_id: string; name: string; icon: string | null; sort_order: number; created_at: string; updated_at: string; created_by: string | null; updated_by: string | null }
export type ShoppingCategoryInsert = Omit<ShoppingCategory, "id" | "created_at" | "updated_at"> & { id?: string }
export type ShoppingCategoryUpdate = Partial<ShoppingCategoryInsert>

export interface Product { id: string; household_id: string; name: string; default_unit: string | null; default_category_id: string | null; last_price: number | null; barcode: string | null; favorite: boolean; created_at: string; updated_at: string; created_by: string | null; updated_by: string | null }
export type ProductInsert = Omit<Product, "id" | "created_at" | "updated_at"> & { id?: string }
export type ProductUpdate = Partial<ProductInsert>

export interface ShoppingList { id: string; household_id: string; name: string; kind: "grocery" | "custom"; status: "open" | "shopping" | "completed" | "cancelled"; due_date: string | null; store: string | null; actual_cost: number | null; created_at: string; updated_at: string; created_by: string | null; updated_by: string | null }
export type ShoppingListInsert = Omit<ShoppingList, "id" | "created_at" | "updated_at"> & { id?: string }
export type ShoppingListUpdate = Partial<ShoppingListInsert>

export interface ShoppingListItem { id: string; list_id: string; product_id: string | null; name: string; quantity: number; unit: string | null; category_id: string | null; estimated_price: number | null; purchased: boolean; purchased_at: string | null; sort_order: number; created_at: string; updated_at: string; created_by: string | null; updated_by: string | null }
export type ShoppingListItemInsert = Omit<ShoppingListItem, "id" | "created_at" | "updated_at"> & { id?: string }
export type ShoppingListItemUpdate = Partial<ShoppingListItemInsert>

// ── Entertainment ──
export interface SubscriptionService { id: string; name: string; icon_url: string | null; default_url: string | null }
export type SubscriptionServiceInsert = Omit<SubscriptionService, "id"> & { id?: string }
export type SubscriptionServiceUpdate = Partial<SubscriptionServiceInsert>

export interface Subscription { id: string; household_id: string; service_id: string | null; name: string; kind: string; monthly_price: number; price: number; billing_cycle: "weekly" | "monthly" | "quarterly" | "yearly"; currency: string; renewal_date: string | null; account_id: string | null; payment_cycle_id: string | null; username: string | null; password_encrypted: string | null; pin_encrypted: string | null; notes: string | null; status: "active" | "paused" | "cancelled"; auto_renew: boolean; created_at: string; updated_at: string; created_by: string | null; updated_by: string | null }
export type SubscriptionInsert = Omit<Subscription, "id" | "created_at" | "updated_at"> & { id?: string }
export type SubscriptionUpdate = Partial<SubscriptionInsert>

export interface SubscriptionSharedUser { id: string; subscription_id: string; name: string | null; is_household_member: boolean; user_id: string | null }
export type SubscriptionSharedUserInsert = Omit<SubscriptionSharedUser, "id"> & { id?: string }
export type SubscriptionSharedUserUpdate = Partial<SubscriptionSharedUserInsert>

export interface Game { id: string; household_id: string; title: string; platform: string | null; status: "owned" | "wishlist" | "playing" | "finished"; purchase_date: string | null; purchase_price: number | null; cover_url: string | null; created_at: string; updated_at: string; created_by: string | null; updated_by: string | null }
export type GameInsert = Omit<Game, "id" | "created_at" | "updated_at"> & { id?: string }
export type GameUpdate = Partial<GameInsert>

export interface WatchlistItem { id: string; household_id: string; title: string; kind: string; status: "pending" | "watching" | "watched"; rating: number | null; notes: string | null; poster_url: string | null; created_at: string; updated_at: string; created_by: string | null; updated_by: string | null }
export type WatchlistItemInsert = Omit<WatchlistItem, "id" | "created_at" | "updated_at"> & { id?: string }
export type WatchlistItemUpdate = Partial<WatchlistItemInsert>

// ── Documents ──
export interface DocumentFolder { id: string; household_id: string; parent_id: string | null; name: string; icon: string | null; sort_order: number; created_at: string; updated_at: string; created_by: string | null; updated_by: string | null }
export type DocumentFolderInsert = Omit<DocumentFolder, "id" | "created_at" | "updated_at"> & { id?: string }
export type DocumentFolderUpdate = Partial<DocumentFolderInsert>

export interface Document { id: string; household_id: string; folder_id: string | null; name: string; kind: "bill" | "warranty" | "contract" | "important" | "other"; storage_path: string; mime_type: string | null; size_bytes: number | null; entity_type: string | null; entity_id: string | null; expires_at: string | null; deleted_at: string | null; created_at: string; updated_at: string; created_by: string | null; updated_by: string | null }
export type DocumentInsert = Omit<Document, "id" | "created_at" | "updated_at"> & { id?: string }
export type DocumentUpdate = Partial<DocumentInsert>

// ── Home Inventory ──
export interface InventoryItem { id: string; household_id: string; name: string; category: string | null; location: string | null; brand: string | null; model: string | null; serial: string | null; purchase_date: string | null; purchase_price: number | null; estimated_value: number | null; warranty_expires_at: string | null; notes: string | null; deleted_at: string | null; created_at: string; updated_at: string; created_by: string | null; updated_by: string | null }
export type InventoryItemInsert = Omit<InventoryItem, "id" | "created_at" | "updated_at"> & { id?: string }
export type InventoryItemUpdate = Partial<InventoryItemInsert>

export interface InventoryMaintenance { id: string; inventory_item_id: string; performed_at: string; description: string; cost: number | null; provider: string | null; created_at: string; updated_at: string; created_by: string | null; updated_by: string | null }
export type InventoryMaintenanceInsert = Omit<InventoryMaintenance, "id" | "created_at" | "updated_at"> & { id?: string }
export type InventoryMaintenanceUpdate = Partial<InventoryMaintenanceInsert>

// ── Pets ──
export interface Pet {
  id: string
  household_id: string
  name: string
  species: string
  breed: string
  color: string
  birth_date: string | null
  weight_kg: number | null
  microchip_id: string
  vet_name: string
  vet_phone: string
  notes: string
  photo_url: string
  deleted_at: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
}
export type PetInsert = Omit<Pet, "id" | "created_at" | "updated_at"> & { id?: string }
export type PetUpdate = Partial<PetInsert>

export interface PetMedicalRecord {
  id: string
  pet_id: string
  date: string
  description: string
  vet_name: string
  cost: number | null
  notes: string
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
}
export type PetMedicalRecordInsert = Omit<PetMedicalRecord, "id" | "created_at" | "updated_at"> & { id?: string }
export type PetMedicalRecordUpdate = Partial<PetMedicalRecordInsert>

export interface PetVaccination {
  id: string
  pet_id: string
  vaccine_name: string
  date_administered: string
  next_due_date: string | null
  vet_name: string
  batch_number: string
  notes: string
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
}
export type PetVaccinationInsert = Omit<PetVaccination, "id" | "created_at" | "updated_at"> & { id?: string }
export type PetVaccinationUpdate = Partial<PetVaccinationInsert>

// ── Vehicles ──
export interface Vehicle {
  id: string
  household_id: string
  name: string
  brand: string
  model: string
  year: number | null
  plate: string
  vin: string
  color: string
  fuel_type: string
  insurance_company: string
  insurance_policy: string
  insurance_expires_at: string | null
  purchase_date: string | null
  purchase_price: number | null
  notes: string
  photo_url: string
  deleted_at: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
}
export type VehicleInsert = Omit<Vehicle, "id" | "created_at" | "updated_at"> & { id?: string }
export type VehicleUpdate = Partial<VehicleInsert>

export interface VehicleServiceRecord {
  id: string
  vehicle_id: string
  date: string
  description: string
  mileage: number | null
  cost: number | null
  provider: string
  notes: string
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
}
export type VehicleServiceRecordInsert = Omit<VehicleServiceRecord, "id" | "created_at" | "updated_at"> & { id?: string }
export type VehicleServiceRecordUpdate = Partial<VehicleServiceRecordInsert>

// ── Cross-cutting ──
export interface Tag { id: string; household_id: string; name: string; slug: string; color: string | null; created_at: string; updated_at: string; created_by: string | null; updated_by: string | null }
export type TagInsert = Omit<Tag, "id" | "created_at" | "updated_at"> & { id?: string }
export type TagUpdate = Partial<TagInsert>

export interface Tagging { id: string; tag_id: string; entity_type: string; entity_id: string }
export type TaggingInsert = Omit<Tagging, "id"> & { id?: string }
export type TaggingUpdate = Partial<TaggingInsert>

export interface Attachment { id: string; household_id: string; entity_type: string; entity_id: string; storage_path: string; mime_type: string | null; size_bytes: number | null; kind: string; created_at: string; created_by: string | null }
export type AttachmentInsert = Omit<Attachment, "id" | "created_at"> & { id?: string }
export type AttachmentUpdate = Partial<AttachmentInsert>

export interface Reminder { id: string; household_id: string; title: string; entity_type: string | null; entity_id: string | null; due_at: string; recurrence: "none" | "daily" | "weekly" | "monthly" | "yearly"; status: "pending" | "done" | "snoozed"; snoozed_until: string | null; created_at: string; updated_at: string; created_by: string | null; updated_by: string | null }
export type ReminderInsert = Omit<Reminder, "id" | "created_at" | "updated_at"> & { id?: string }
export type ReminderUpdate = Partial<ReminderInsert>

export interface Notification { id: string; household_id: string; user_id: string; title: string; body: string | null; kind: string; link: string | null; read_at: string | null; created_at: string }
export type NotificationInsert = Omit<Notification, "id" | "created_at"> & { id?: string }
export type NotificationUpdate = Partial<NotificationInsert>

export interface AuditLog { id: number; household_id: string | null; user_id: string | null; action: string; entity_type: string | null; entity_id: string | null; changes: Json | null; created_at: string }
export type AuditLogInsert = Omit<AuditLog, "id" | "created_at">
export type AuditLogUpdate = Partial<AuditLogInsert>

export interface AppSettings { id: string; household_id: string; preferences: Json; updated_at: string }
export type AppSettingsInsert = Omit<AppSettings, "id" | "updated_at"> & { id?: string }
export type AppSettingsUpdate = Partial<AppSettingsInsert>

// ── Views ──
export interface VNetWorth { household_id: string; net_worth: number }
export interface VMonthlyByCategory { household_id: string; month: string; category_id: string; total: number }
export interface VUpcomingReminder { id: string; household_id: string; title: string; entity_type: string | null; entity_id: string | null; due_at: string; recurrence: string; status: string; snoozed_until: string | null; created_at: string; updated_at: string; created_by: string | null; updated_by: string | null }
export interface VRenewal { id: string; household_id: string; name: string; renewal_date: string; status: string; monthly_price: number }
export interface VOpenObligation { household_id: string; direction: string; count: number; outstanding: number }
