// @ts-nocheck — DB types are a stub; will resolve when supabase gen types runs
"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { queryKeys as qk } from "@/lib/query-keys"
import type {
  Account,
  Transaction,
  Category,
  PaymentCycle,
  Person,
  PaymentObligation,
  ObligationPayment,
  Budget,
  BudgetLine,
} from "@/types/db"
import {
  createTransaction,
  updateTransaction,
  deleteTransaction,
  createAccount,
  updateAccount,
  correctAccountBalance,
  createObligation,
  addObligationPayment,
  createObligationPaymentWithTransaction,
  applyBatchPayment,
  createPerson,
  createBudget,
} from "./actions"
import { toast } from "sonner"

// ── Accounts ──

export function useAccounts(householdId: string | null) {
  return useQuery({
    queryKey: qk.accounts.all(householdId ?? ""),
    queryFn: async () => {
      if (!householdId) return [] as Account[]
      const supabase = createClient()
      const { data, error } = await supabase
        .from("accounts")
        .select("*")
        .eq("household_id", householdId)
        .order("name")
      if (error) throw error
      return data as Account[]
    },
    enabled: !!householdId,
  })
}

export function useCreateAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createAccount,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["accounts"] })
      toast.success("Cuenta creada")
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useUpdateAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateAccount>[1] }) =>
      updateAccount(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["accounts"] })
      toast.success("Cuenta actualizada")
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useCorrectAccountBalance() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ accountId, newBalance, createCorrectionTx }: { accountId: string; newBalance: number; createCorrectionTx: boolean }) =>
      correctAccountBalance(accountId, newBalance, createCorrectionTx),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["accounts"] })
      qc.invalidateQueries({ queryKey: ["transactions"] })
      qc.invalidateQueries({ queryKey: ["dashboard"] })
      const msg = vars.createCorrectionTx
        ? "Balance corregido con transacción"
        : "Balance corregido directamente"
      toast.success(msg)
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

// ── Transactions ──

export function useTransactions(householdId: string | null, filters?: { type?: string; paid?: string; search?: string; account_id?: string; category_id?: string }) {
  return useQuery({
    queryKey: qk.transactions.list(householdId ?? "", filters ?? {}),
    queryFn: async () => {
      const supabase = createClient()
      let query = supabase
        .from("transactions")
        .select("*, category:categories(name), account:accounts(name), person:people(name)")
        .eq("household_id", householdId)
        .is("deleted_at", null)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(100)

      if (filters?.type && filters.type !== "all") {
        query = query.eq("type", filters.type)
      }
      if (filters?.paid === "paid") {
        query = query.eq("paid", true)
      } else if (filters?.paid === "pending") {
        query = query.eq("paid", false)
      }
      if (filters?.search) {
        query = query.ilike("description", `%${filters.search}%`)
      }
      if (filters?.account_id) {
        query = query.eq("account_id", filters.account_id)
      }
      if (filters?.category_id) {
        query = query.eq("category_id", filters.category_id)
      }

      const { data, error } = await query
      if (error) throw error
      return (data as Transaction[]).map(tx => ({
        ...tx,
        category_name: (tx as any).category?.name ?? null,
        account_name: (tx as any).account?.name ?? null,
        person_name: (tx as any).person?.name ?? null,
      }))
    },
    enabled: !!householdId,
  })
}

export function useCreateTransaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createTransaction,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] })
      qc.invalidateQueries({ queryKey: ["accounts"] })
      qc.invalidateQueries({ queryKey: ["dashboard"] })
      toast.success("Transacción creada")
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useUpdateTransaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateTransaction>[1] }) =>
      updateTransaction(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] })
      qc.invalidateQueries({ queryKey: ["accounts"] })
      qc.invalidateQueries({ queryKey: ["dashboard"] })
      toast.success("Transacción actualizada")
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useDeleteTransaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteTransaction,
    onSuccess: (result) => {
      if (result.success) {
        qc.invalidateQueries({ queryKey: ["transactions"] })
        qc.invalidateQueries({ queryKey: ["accounts"] })
        qc.invalidateQueries({ queryKey: ["dashboard"] })
        toast.success("Transacción eliminada")
      } else {
        toast.error(result.error || "Error al eliminar")
      }
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

// ── Categories ──

export function useCategories(householdId: string | null) {
  return useQuery({
    queryKey: qk.categories.all(householdId ?? ""),
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("household_id", householdId)
        .eq("is_archived", false)
        .order("sort_order")
      if (error) throw error
      return data as Category[]
    },
    enabled: !!householdId,
  })
}

// ── Payment Cycles ──

export function usePaymentCycles(householdId: string | null) {
  return useQuery({
    queryKey: qk.paymentCycles.all(householdId ?? ""),
    queryFn: async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from("payment_cycles")
        .select("*")
        .eq("household_id", householdId)
        .eq("active", true)
      return data as PaymentCycle[]
    },
    enabled: !!householdId,
  })
}

// ── People ──

export function usePeople(householdId: string | null) {
  return useQuery({
    queryKey: qk.people.all(householdId ?? ""),
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("people")
        .select("*")
        .eq("household_id", householdId)
        .eq("is_archived", false)
        .order("name")
      if (error) throw error
      return data as Person[]
    },
    enabled: !!householdId,
  })
}

export function useCreatePerson() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createPerson,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["people"] })
      toast.success("Persona agregada")
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

// ── Obligations ──

export function useObligations(householdId: string | null) {
  return useQuery({
    queryKey: qk.paymentObligations.all(householdId ?? ""),
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("payment_obligations")
        .select("*, person:people(name)")
        .eq("household_id", householdId)
        .is("deleted_at", null)
        .order("due_date", { ascending: true })
      if (error) throw error
      return (data as any[]).map((o) => ({
        ...o,
        person_name: o.person?.name ?? null,
      })) as (PaymentObligation & { person_name: string | null })[]
    },
    enabled: !!householdId,
  })
}

export function useCreateObligation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createObligation,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["obligations"] })
      qc.invalidateQueries({ queryKey: ["dashboard"] })
      toast.success("Obligación creada")
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useAddObligationPayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: addObligationPayment,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["obligations"] })
      toast.success("Abono registrado")
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useCreateObligationPaymentWithTransaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createObligationPaymentWithTransaction,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["obligations"] })
      qc.invalidateQueries({ queryKey: ["transactions"] })
      qc.invalidateQueries({ queryKey: ["accounts"] })
      qc.invalidateQueries({ queryKey: ["dashboard"] })
      toast.success("Transacción y abono creados")
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useApplyBatchPayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: applyBatchPayment,
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["obligations"] })
      qc.invalidateQueries({ queryKey: ["transactions"] })
      qc.invalidateQueries({ queryKey: ["accounts"] })
      qc.invalidateQueries({ queryKey: ["dashboard"] })
      const settled = result.allocations.filter((a) => a.settled).length
      const partial = result.allocations.filter((a) => !a.settled).length
      const parts: string[] = []
      if (settled) parts.push(`${settled} liquidada${settled !== 1 ? "s" : ""}`)
      if (partial) parts.push(`${partial} parcial${partial !== 1 ? "es" : ""}`)
      toast.success(`Abono de ${result.total_applied.toFixed(2)} aplicado (${parts.join(", ")})`)
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

// ── Budgets ──

export function useBudgets(householdId: string | null) {
  return useQuery({
    queryKey: qk.budgets.all(householdId ?? ""),
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("budgets")
        .select("*, budget_lines(*, category:categories(name))")
        .eq("household_id", householdId)
        .order("period_month", { ascending: false })
        .limit(6)
      if (error) throw error
      return data as (Budget & { budget_lines: (BudgetLine & { category?: { name: string } | null })[] })[]
    },
    enabled: !!householdId,
  })
}

export function useCreateBudget() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ data, lines }: { data: Parameters<typeof createBudget>[0]; lines: Parameters<typeof createBudget>[1] }) =>
      createBudget(data, lines),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["budgets"] })
      toast.success("Presupuesto creado")
    },
    onError: (e: Error) => toast.error(e.message),
  })
}
