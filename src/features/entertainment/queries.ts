// @ts-nocheck — DB types are a stub; will resolve when supabase gen types runs
"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { queryKeys as qk } from "@/lib/query-keys"
import {
  createSubscription,
  updateSubscription,
  deleteSubscription,
  generateSubscriptionTransaction,
  createGame,
  updateGame,
  createWatchlistItem,
  updateWatchlistItem,
} from "./actions"
import { toast } from "sonner"

// ── Subscriptions ──

export function useSubscriptions(householdId: string | null) {
  return useQuery({
    queryKey: qk.subscriptions.all(householdId ?? ""),
    queryFn: async () => {
      if (!householdId) return []
      const supabase = createClient()
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("household_id", householdId)
        .order("renewal_date", { ascending: true })
      if (error) throw error
      return data
    },
    enabled: !!householdId,
  })
}

export function useActiveSubscriptions(householdId: string | null) {
  return useQuery({
    queryKey: qk.subscriptions.active(householdId ?? ""),
    queryFn: async () => {
      if (!householdId) return []
      const supabase = createClient()
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("household_id", householdId)
        .eq("status", "active")
        .order("renewal_date", { ascending: true })
      if (error) throw error
      return data
    },
    enabled: !!householdId,
  })
}

export function useCreateSubscription() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createSubscription,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subscriptions"] })
      qc.invalidateQueries({ queryKey: ["dashboard"] })
      toast.success("Suscripción creada")
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useUpdateSubscription() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateSubscription>[1] }) =>
      updateSubscription(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subscriptions"] })
      toast.success("Suscripción actualizada")
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useDeleteSubscription() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteSubscription,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subscriptions"] })
      toast.success("Suscripción cancelada")
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useGenerateSubscriptionTransaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: generateSubscriptionTransaction,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subscriptions"] })
      qc.invalidateQueries({ queryKey: ["transactions"] })
      qc.invalidateQueries({ queryKey: ["accounts"] })
      qc.invalidateQueries({ queryKey: ["dashboard"] })
      toast.success("Cobro generado y fecha renovada")
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

// ── Games ──

export function useGames(householdId: string | null) {
  return useQuery({
    queryKey: qk.games.all(householdId ?? ""),
    queryFn: async () => {
      if (!householdId) return []
      const supabase = createClient()
      const { data, error } = await supabase
        .from("games")
        .select("*")
        .eq("household_id", householdId)
        .order("created_at", { ascending: false })
      if (error) throw error
      return data
    },
    enabled: !!householdId,
  })
}

export function useCreateGame() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createGame,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["games"] })
      toast.success("Juego agregado")
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useUpdateGame() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateGame>[1] }) =>
      updateGame(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["games"] })
      toast.success("Juego actualizado")
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

// ── Watchlist ──

export function useWatchlist(householdId: string | null) {
  return useQuery({
    queryKey: qk.watchlist.all(householdId ?? ""),
    queryFn: async () => {
      if (!householdId) return []
      const supabase = createClient()
      const { data, error } = await supabase
        .from("watchlist_items")
        .select("*")
        .eq("household_id", householdId)
        .order("created_at", { ascending: false })
      if (error) throw error
      return data
    },
    enabled: !!householdId,
  })
}

export function useCreateWatchlistItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createWatchlistItem,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["watchlist"] })
      toast.success("Título agregado")
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useUpdateWatchlistItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateWatchlistItem>[1] }) =>
      updateWatchlistItem(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["watchlist"] })
      toast.success("Título actualizado")
    },
    onError: (e: Error) => toast.error(e.message),
  })
}
