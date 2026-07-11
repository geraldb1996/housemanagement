import { z } from "zod"

export const accountSchema = z.object({
  name: z.string().min(1, "Requerido"),
  account_type: z.enum(["cash", "bank", "savings", "credit_card"]),
  institution: z.string().optional().nullish(),
  opening_balance: z.number().min(0),
  currency: z.string().default("USD"),
  color: z.string().optional().nullish(),
  is_archived: z.boolean().default(false),
  include_in_net_worth: z.boolean().default(true),
})

export const categorySchema = z.object({
  name: z.string().min(1, "Requerido"),
  parent_id: z.string().uuid().optional().nullish(),
  kind: z.enum(["income", "expense", "transfer"]),
  icon: z.string().optional().nullish(),
  color: z.string().optional().nullish(),
  sort_order: z.number().int().default(0),
})

export const paymentCycleSchema = z.object({
  name: z.string().min(1, "Requerido"),
  cycle_type: z.enum(["fixed_dates", "monthly", "interval"]),
  config: z.record(z.string(), z.unknown()).default({}),
  active: z.boolean().default(true),
})

export const personSchema = z.object({
  name: z.string().min(1, "Requerido"),
  relationship: z.string().optional().nullish(),
  color: z.string().optional().nullish(),
  notes: z.string().optional().nullish(),
})

export const transactionSchema = z.object({
  account_id: z.string().uuid(),
  category_id: z.string().uuid().optional().nullish(),
  type: z.enum(["income", "expense", "transfer"]),
  amount: z.number().positive("Debe ser mayor a 0"),
  transfer_direction: z.enum(["in", "out"]).optional().nullish(),
  destination_account_id: z.string().uuid().optional().nullish(),
  exchange_rate: z.number().positive().optional().nullish(),
  currency: z.string().optional().nullish(),
  date: z.string(),
  payment_cycle_id: z.string().uuid().optional().nullish(),
  paid: z.boolean().default(false),
  person_id: z.string().uuid().optional().nullish(),
  description: z.string().optional().nullish(),
  notes: z.string().optional().nullish(),
})

export const obligationSchema = z.object({
  direction: z.enum(["owed_to_us", "owed_by_us"]),
  person_id: z.string().uuid(),
  description: z.string().min(1, "Requerido"),
  total_amount: z.number().positive(),
  due_date: z.string().optional().nullish(),
  payment_cycle_id: z.string().uuid().optional().nullish(),
  source_transaction_id: z.string().uuid().optional().nullish(),
})

export const obligationPaymentSchema = z.object({
  obligation_id: z.string().uuid(),
  amount: z.number().positive(),
  paid_date: z.string(),
  transaction_id: z.string().uuid().optional().nullish(),
  notes: z.string().optional().nullish(),
})

export const batchPaymentSchema = z.object({
  person_id: z.string().uuid(),
  paid_date: z.string(),
  total_amount: z.number().positive(),
  account_id: z.string().uuid().optional().nullish(),
  currency: z.string().optional(),
})

export const budgetSchema = z.object({
  name: z.string().min(1, "Requerido"),
  period_month: z.string(),
  scope: z.enum(["household", "account", "person"]).default("household"),
  scope_account_id: z.string().uuid().optional().nullish(),
  scope_person_id: z.string().uuid().optional().nullish(),
  recurrence: z.enum(["biweekly", "monthly"]).optional().nullish(),
  recurrence_start: z.string().optional().nullish(),
  is_general: z.boolean().default(false),
  total_amount: z.number().positive().optional().nullish(),
})

export const budgetLineSchema = z.object({
  budget_id: z.string().uuid(),
  category_id: z.string().uuid(),
  planned_amount: z.number().min(0),
})

export type AccountForm = z.infer<typeof accountSchema>
export type CategoryForm = z.infer<typeof categorySchema>
export type PersonForm = z.infer<typeof personSchema>
export type TransactionForm = z.infer<typeof transactionSchema>
export type ObligationForm = z.infer<typeof obligationSchema>
export type ObligationPaymentForm = z.infer<typeof obligationPaymentSchema>
export type BatchPaymentForm = z.infer<typeof batchPaymentSchema>
export type BudgetForm = z.infer<typeof budgetSchema>
export type BudgetLineForm = z.infer<typeof budgetLineSchema>
