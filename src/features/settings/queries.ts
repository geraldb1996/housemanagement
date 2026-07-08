// @ts-nocheck — DB types stub; resolves when supabase gen types runs
"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { queryKeys as qk } from "@/lib/query-keys"
import { saveExchangeRates, addHouseholdMember, removeHouseholdMember } from "./actions"
import type { ExchangeRateForm } from "./schemas"
import { toast } from "sonner"

export function useExchangeRates(householdId: string | null) {
  return useQuery({
    queryKey: qk.exchangeRates.household(householdId ?? ""),
    queryFn: async () => {
      if (!householdId) return [] as ExchangeRateForm[]
      const supabase = createClient()
      const { data, error } = await supabase
        .from("app_settings")
        .select("preferences")
        .eq("household_id", householdId)
        .maybeSingle()
      if (error && error.code !== "PGRST116") throw error
      const rates = data?.preferences?.exchange_rates as ExchangeRateForm[] | undefined
      return rates ?? []
    },
    enabled: !!householdId,
  })
}

export function useSaveExchangeRates() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: saveExchangeRates,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exchange-rates"] })
      toast.success("Tasas de cambio guardadas")
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useHouseholdMembers(householdId: string | null) {
  return useQuery({
    queryKey: qk.household.members(householdId ?? ""),
    queryFn: async () => {
      if (!householdId) return [] as any[]
      const supabase = createClient()
      const { data, error } = await supabase
        .from("household_members")
        .select("id, role, display_name, joined_at, user_id")
        .eq("household_id", householdId)
        .order("joined_at", { ascending: true })
      if (error) throw error
      return data as any[]
    },
    enabled: !!householdId,
  })
}

export function useAddHouseholdMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: addHouseholdMember,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["household"] })
      toast.success("Miembro invitado")
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useRemoveHouseholdMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: removeHouseholdMember,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["household"] })
      toast.success("Miembro removido")
    },
    onError: (e: Error) => toast.error(e.message),
  })
}
