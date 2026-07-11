// @ts-nocheck — DB types are a stub; will resolve when supabase gen types runs
"use server"

import { revalidatePath } from "next/cache"
import { createServerSupabase } from "@/lib/supabase/server"
import { requireHousehold } from "@/lib/auth"
import {
  transactionSchema,
  accountSchema,
  categorySchema,
  personSchema,
  obligationSchema,
  obligationPaymentSchema,
  batchPaymentSchema,
  budgetSchema,
  budgetLineSchema,
  type TransactionForm,
  type AccountForm,
  type CategoryForm,
  type PersonForm,
  type ObligationForm,
  type ObligationPaymentForm,
  type BatchPaymentForm,
  type BudgetForm,
  type BudgetLineForm,
} from "./schemas"

// ── Transactions ──

export async function createTransaction(data: TransactionForm) {
  const { householdId } = await requireHousehold()
  const parsed = transactionSchema.parse(data)
  const supabase = await createServerSupabase()

  if (parsed.type === "transfer" && parsed.destination_account_id && parsed.destination_account_id !== parsed.account_id) {
    const destAmount = parsed.exchange_rate
      ? Math.round(parsed.amount * parsed.exchange_rate * 100) / 100
      : parsed.amount

    // Insert OUT transaction first
    const { data: outTx, error: outErr } = await supabase
      .from("transactions")
      .insert({
        household_id: householdId,
        account_id: parsed.account_id,
        category_id: parsed.category_id,
        type: "transfer",
        amount: parsed.amount,
        transfer_direction: "out",
        currency: parsed.currency ?? "NIO",
        date: parsed.date,
        payment_cycle_id: parsed.payment_cycle_id,
        paid: parsed.paid,
        paid_at: parsed.paid ? new Date().toISOString() : null,
        person_id: parsed.person_id,
        description: parsed.description,
        notes: parsed.notes,
      })
      .select("id")
      .single()

    if (outErr || !outTx) throw new Error(outErr?.message ?? "Failed to create OUT transfer")

    // Insert IN transaction with pair link
    const { data: inTx, error: inErr } = await supabase
      .from("transactions")
      .insert({
        household_id: householdId,
        account_id: parsed.destination_account_id,
        category_id: parsed.category_id,
        type: "transfer",
        amount: destAmount,
        transfer_direction: "in",
        currency: parsed.currency ?? "NIO",
        transfer_pair_id: outTx.id,
        date: parsed.date,
        payment_cycle_id: parsed.payment_cycle_id,
        paid: parsed.paid,
        paid_at: parsed.paid ? new Date().toISOString() : null,
        person_id: parsed.person_id,
        description: parsed.description,
        notes: parsed.exchange_rate ? `Tasa: ${parsed.exchange_rate} | ${parsed.notes ?? ""}` : parsed.notes,
      })
      .select("id")
      .single()

    if (inErr || !inTx) throw new Error(inErr?.message ?? "Failed to create IN transfer")

    // Link OUT back to IN
    await supabase.from("transactions").update({ transfer_pair_id: inTx.id }).eq("id", outTx.id)
  } else {
    const { destination_account_id: _dest, exchange_rate: _rate, ...rest } = parsed
    const { error } = await supabase.from("transactions").insert({
      ...rest,
      currency: rest.currency ?? "NIO",
      household_id: householdId,
      paid_at: parsed.paid ? new Date().toISOString() : null,
    })

    if (error) throw new Error(error.message)
  }

  revalidatePath("/finance")
  revalidatePath("/finance/transactions")
  revalidatePath("/")
}

export async function updateTransaction(id: string, data: Partial<TransactionForm>) {
  await requireHousehold()
  const supabase = await createServerSupabase()

  const { destination_account_id: _dest, exchange_rate: _rate, ...rest } = data
  const update: Record<string, unknown> = { ...rest }
  if (data.paid !== undefined) {
    update.paid_at = data.paid ? new Date().toISOString() : null
  }

  const { error } = await supabase.from("transactions").update(update).eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath("/finance")
  revalidatePath("/finance/transactions")
  revalidatePath("/")
}

export async function deleteTransaction(id: string) {
  try {
    await requireHousehold()
    const supabase = await createServerSupabase()
    const { error } = await supabase.from("transactions").update({ deleted_at: new Date().toISOString() }).eq("id", id)
    if (error) return { success: false as const, error: error.message }
    revalidatePath("/finance")
    revalidatePath("/finance/transactions")
    revalidatePath("/")
    return { success: true as const }
  } catch (e) {
    if (
      e instanceof Error &&
      "digest" in e &&
      typeof (e as Error & { digest: string }).digest === "string" &&
      (e as Error & { digest: string }).digest.startsWith("NEXT_REDIRECT")
    ) {
      throw e
    }
    return { success: false as const, error: e instanceof Error ? e.message : "Error desconocido" }
  }
}

// ── Accounts ──

export async function createAccount(data: AccountForm) {
  const { householdId } = await requireHousehold()
  const parsed = accountSchema.parse(data)
  const supabase = await createServerSupabase()

  const { error } = await supabase.from("accounts").insert({
    ...parsed,
    household_id: householdId,
  })

  if (error) throw new Error(error.message)
  revalidatePath("/finance")
  revalidatePath("/finance/accounts")
}

export async function updateAccount(id: string, data: Partial<AccountForm>) {
  await requireHousehold()
  const supabase = await createServerSupabase()
  const { error } = await supabase.from("accounts").update(data).eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath("/finance")
  revalidatePath("/finance/accounts")
}

export async function archiveAccount(id: string) {
  await requireHousehold()
  const supabase = await createServerSupabase()
  const { error } = await supabase.from("accounts").update({ is_archived: true }).eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath("/finance")
  revalidatePath("/finance/accounts")
}

export async function correctAccountBalance(accountId: string, newBalance: number, createCorrectionTx: boolean) {
  const { householdId } = await requireHousehold()
  const supabase = await createServerSupabase()

  const { data: account, error: fetchErr } = await supabase
    .from("accounts")
    .select("*")
    .eq("id", accountId)
    .single()

  if (fetchErr || !account) throw new Error(fetchErr?.message ?? "Cuenta no encontrada")

  const currentBalance = Number(account.current_balance ?? account.opening_balance)

  if (createCorrectionTx) {
    const diff = newBalance - currentBalance
    if (Math.abs(diff) < 0.01) {
      revalidatePath("/finance")
      revalidatePath("/finance/accounts")
      return
    }

    const type = diff > 0 ? "income" : "expense"
    const amount = Math.abs(diff)

    const { error: txErr } = await supabase.from("transactions").insert({
      household_id: householdId,
      account_id: accountId,
      type,
      amount: Math.round(amount * 100) / 100,
      currency: account.currency ?? "NIO",
      date: new Date().toISOString().split("T")[0],
      paid: true,
      paid_at: new Date().toISOString(),
      description: "Corrección de balance",
      notes: `Balance ajustado de ${currentBalance} → ${newBalance}`,
    })

    if (txErr) throw new Error(txErr.message)
  } else {
    const { data: txSum } = await supabase
      .from("transactions")
      .select("amount, type")
      .eq("account_id", accountId)
      .eq("paid", true)
      .is("deleted_at", null)

    const signedSum = (txSum ?? []).reduce((sum: number, tx: any) => {
      const amt = Number(tx.amount)
      if (tx.type === "income") return sum + amt
      if (tx.type === "expense") return sum - amt
      if (tx.type === "transfer" && (tx as any).transfer_direction === "in") return sum + amt
      if (tx.type === "transfer" && (tx as any).transfer_direction === "out") return sum - amt
      return sum
    }, 0)

    const newOpeningBalance = Math.round((newBalance - signedSum) * 100) / 100

    const { error: updateErr } = await supabase
      .from("accounts")
      .update({ opening_balance: newOpeningBalance })
      .eq("id", accountId)

    if (updateErr) throw new Error(updateErr.message)
  }

  revalidatePath("/finance")
  revalidatePath("/finance/accounts")
  revalidatePath("/finance/transactions")
  revalidatePath("/")
}

// ── Categories ──

export async function createCategory(data: CategoryForm) {
  const { householdId } = await requireHousehold()
  const parsed = categorySchema.parse(data)
  const supabase = await createServerSupabase()

  const { error } = await supabase.from("categories").insert({
    ...parsed,
    household_id: householdId,
  })

  if (error) throw new Error(error.message)
  revalidatePath("/settings/categories")
}

// ── People ──

export async function createPerson(data: PersonForm) {
  const { householdId } = await requireHousehold()
  const parsed = personSchema.parse(data)
  const supabase = await createServerSupabase()

  const { error } = await supabase.from("people").insert({
    ...parsed,
    household_id: householdId,
  })

  if (error) throw new Error(error.message)
  revalidatePath("/finance/people")
}

// ── Obligations ──

export async function createObligation(data: ObligationForm) {
  const { householdId } = await requireHousehold()
  const parsed = obligationSchema.parse(data)
  const supabase = await createServerSupabase()

  const { error } = await supabase.from("payment_obligations").insert({
    ...parsed,
    household_id: householdId,
    status: "open",
  })

  if (error) throw new Error(error.message)
  revalidatePath("/finance/obligations")
  revalidatePath("/")
}

export async function addObligationPayment(data: ObligationPaymentForm) {
  await requireHousehold()
  const parsed = obligationPaymentSchema.parse(data)
  const supabase = await createServerSupabase()

  const { error } = await supabase.from("obligation_payments").insert(parsed)
  if (error) throw new Error(error.message)

  const { data: ob } = await supabase
    .from("payment_obligations")
    .select("total_amount, paid_amount")
    .eq("id", parsed.obligation_id)
    .single()

  if (ob) {
    const newPaid = Number(ob.paid_amount) + parsed.amount
    const newStatus = newPaid >= Number(ob.total_amount) ? "settled" : "partially_paid"
    await supabase
      .from("payment_obligations")
      .update({
        paid_amount: newPaid,
        status: newStatus,
        ...(newStatus === "settled" ? { settled_at: new Date().toISOString() } : {}),
      })
      .eq("id", parsed.obligation_id)
  }

  revalidatePath("/finance/obligations")
  revalidatePath("/")
}

export async function createObligationPaymentWithTransaction(data: {
  obligation_id: string
  amount: number
  paid_date: string
  account_id: string
  currency?: string
}) {
  const { householdId } = await requireHousehold()
  const supabase = await createServerSupabase()

  const { data: obligation, error: fetchErr } = await supabase
    .from("payment_obligations")
    .select("*")
    .eq("id", data.obligation_id)
    .single()

  if (fetchErr || !obligation) throw new Error(fetchErr?.message ?? "Obligación no encontrada")

  const txType = obligation.direction === "owed_to_us" ? "income" : "expense"

  const { data: tx, error: txErr } = await supabase
    .from("transactions")
    .insert({
      household_id: householdId,
      account_id: data.account_id,
      type: txType,
      amount: data.amount,
      currency: data.currency ?? "NIO",
      date: data.paid_date,
      paid: true,
      paid_at: new Date().toISOString(),
      person_id: obligation.person_id,
      description: obligation.description ? `Abono: ${obligation.description}` : "Abono de obligación",
    })
    .select("id")
    .single()

  if (txErr || !tx) throw new Error(txErr?.message ?? "Failed to create transaction")

  const { error: payErr } = await supabase
    .from("obligation_payments")
    .insert({
      obligation_id: data.obligation_id,
      amount: data.amount,
      paid_date: data.paid_date,
      transaction_id: tx.id,
    })

  if (payErr) throw new Error(payErr.message)

  const newPaid = Number(obligation.paid_amount) + data.amount
  const newStatus = newPaid >= Number(obligation.total_amount) ? "settled" : "partially_paid"
  await supabase
    .from("payment_obligations")
    .update({
      paid_amount: newPaid,
      status: newStatus,
      ...(newStatus === "settled" ? { settled_at: new Date().toISOString() } : {}),
    })
    .eq("id", data.obligation_id)

  revalidatePath("/finance")
  revalidatePath("/finance/transactions")
  revalidatePath("/finance/obligations")
  revalidatePath("/")
}

export async function applyBatchPayment(data: BatchPaymentForm) {
  const { householdId } = await requireHousehold()
  const parsed = batchPaymentSchema.parse(data)
  const supabase = await createServerSupabase()

  const { data: obligations, error: fetchErr } = await supabase
    .from("payment_obligations")
    .select("*")
    .eq("household_id", householdId)
    .eq("person_id", parsed.person_id)
    .eq("due_date", parsed.paid_date)
    .in("status", ["open", "partially_paid"])
    .is("deleted_at", null)
    .order("created_at", { ascending: true })

  if (fetchErr) throw new Error(fetchErr.message)
  if (!obligations || obligations.length === 0) {
    throw new Error("No hay obligaciones pendientes para esta persona en esta fecha")
  }

  const direction = obligations[0].direction

  let transactionId: string | null = null
  if (parsed.account_id) {
    const txType = direction === "owed_to_us" ? "income" : "expense"
    const { data: tx, error: txErr } = await supabase
      .from("transactions")
      .insert({
        household_id: householdId,
        account_id: parsed.account_id,
        type: txType,
        amount: parsed.total_amount,
        currency: parsed.currency ?? "NIO",
        date: parsed.paid_date,
        paid: true,
        paid_at: new Date().toISOString(),
        person_id: parsed.person_id,
        description: `Abono: ${obligations.length} obligación${obligations.length !== 1 ? "es" : ""}`,
      })
      .select("id")
      .single()

    if (txErr || !tx) throw new Error(txErr?.message ?? "Error creando transacción")
    transactionId = tx.id
  }

  let remaining = parsed.total_amount
  const allocations: { obligation_id: string; description: string; allocated: number; settled: boolean }[] = []

  for (const obl of obligations) {
    if (remaining <= 0.005) break

    const oblRemaining = Number(obl.total_amount) - Number(obl.paid_amount)
    const allocation = Math.round(Math.min(oblRemaining, remaining) * 100) / 100

    const newPaid = Number(obl.paid_amount) + allocation
    const isSettled = newPaid >= Number(obl.total_amount) - 0.001

    const { error: updErr } = await supabase
      .from("payment_obligations")
      .update({
        paid_amount: newPaid,
        status: isSettled ? "settled" : "partially_paid",
        ...(isSettled ? { settled_at: new Date().toISOString() } : {}),
      })
      .eq("id", obl.id)

    if (updErr) throw new Error(updErr.message)

    const { error: payErr } = await supabase
      .from("obligation_payments")
      .insert({
        obligation_id: obl.id,
        amount: allocation,
        paid_date: parsed.paid_date,
        transaction_id: transactionId,
      })

    if (payErr) throw new Error(payErr.message)

    allocations.push({
      obligation_id: obl.id,
      description: obl.description,
      allocated: allocation,
      settled: isSettled,
    })

    remaining = Math.round((remaining - allocation) * 100) / 100
  }

  revalidatePath("/finance")
  revalidatePath("/finance/transactions")
  revalidatePath("/finance/obligations")
  revalidatePath("/")

  return {
    total_applied: Math.round((parsed.total_amount - remaining) * 100) / 100,
    remaining_unapplied: remaining,
    allocations,
    transactionId,
  }
}

// ── Budgets ──

export async function createBudget(data: BudgetForm, lines: BudgetLineForm[]) {
  const { householdId } = await requireHousehold()
  const parsed = budgetSchema.parse(data)
  const supabase = await createServerSupabase()

  const { data: budget, error } = await supabase
    .from("budgets")
    .insert({ ...parsed, household_id: householdId })
    .select("id")
    .single()

  if (error || !budget) throw new Error(error?.message || "Failed to create budget")

  if (!parsed.is_general && lines.length > 0) {
    const budgetLines = lines.map((l) => ({
      ...budgetLineSchema.parse({ ...l, budget_id: (budget as any).id }),
      budget_id: (budget as any).id,
    }))
    const { error: lineError } = await supabase.from("budget_lines").insert(budgetLines)
    if (lineError) throw new Error(lineError.message)
  }

  revalidatePath("/finance/budgets")
}

// ── Seed ──

export async function seedNewHousehold(householdId: string) {
  const supabase = await createServerSupabase()

  const expenses = [
    { name: "Comida", icon: "Utensils" },
    { name: "Transporte", icon: "Car" },
    { name: "Servicios", icon: "Zap" },
    { name: "Salud", icon: "Heart" },
    { name: "Entretenimiento", icon: "Gamepad2" },
    { name: "Ropa", icon: "Shirt" },
    { name: "Educación", icon: "BookOpen" },
    { name: "Hogar", icon: "House" },
    { name: "Otros", icon: "Ellipsis" },
  ]
  const incomes = [
    { name: "Salario", icon: "Briefcase" },
    { name: "Freelance", icon: "Laptop" },
    { name: "Inversiones", icon: "TrendingUp" },
    { name: "Otros ingresos", icon: "Plus" },
  ]

  const categories = [
    ...expenses.map((c) => ({ household_id: householdId, name: c.name, kind: "expense", icon: c.icon })),
    ...incomes.map((c) => ({ household_id: householdId, name: c.name, kind: "income", icon: c.icon })),
  ]

  await supabase.from("categories").insert(categories)

  await supabase.from("payment_cycles").insert([
    { household_id: householdId, name: "Quincena 15", cycle_type: "fixed_dates", config: { days: [15] }, active: true },
    { household_id: householdId, name: "Quincena 30", cycle_type: "fixed_dates", config: { days: [28] }, active: true },
  ])

  await supabase.from("accounts").insert({
    household_id: householdId,
    name: "Efectivo",
    account_type: "cash",
    opening_balance: 0,
    currency: "NIO",
  })
}
