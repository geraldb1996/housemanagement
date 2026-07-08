// @ts-nocheck — DB types are a stub; will resolve when supabase gen types runs
"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { queryKeys as qk } from "@/lib/query-keys"
import {
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  addMaintenance,
} from "./actions"
import { toast } from "sonner"

type InventoryItemRow = {
  id: string
  household_id: string
  name: string
  category: string
  location: string
  brand: string
  model: string
  serial: string
  purchase_date: string
  purchase_price: number | null
  estimated_value: number | null
  warranty_expires_at: string | null
  notes: string
  created_at: string
  updated_at: string
  deleted_at: string | null
  maintenance_history: MaintenanceRow[]
}

type MaintenanceRow = {
  id: string
  item_id: string
  date: string
  description: string
  cost: number | null
  provider: string
}

export function useInventoryItems(householdId: string | null) {
  return useQuery({
    queryKey: qk.inventory.all(householdId ?? ""),
    queryFn: async () => {
      if (!householdId) return [] as InventoryItemRow[]
      const supabase = createClient()
      const { data, error } = await supabase
        .from("inventory_items")
        .select("*, maintenance_history:inventory_maintenance(*)")
        .eq("household_id", householdId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
      if (error) throw error
      return data as InventoryItemRow[]
    },
    enabled: !!householdId,
  })
}

export function useInventoryItem(id: string | null) {
  return useQuery({
    queryKey: qk.inventory.detail(id ?? ""),
    queryFn: async () => {
      if (!id) return null
      const supabase = createClient()
      const { data, error } = await supabase
        .from("inventory_items")
        .select("*, maintenance_history:inventory_maintenance(*)")
        .eq("id", id)
        .single()
      if (error) throw error
      return data as InventoryItemRow
    },
    enabled: !!id,
  })
}

export function useCreateInventoryItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createInventoryItem,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory"] })
      toast.success("Artículo agregado")
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useUpdateInventoryItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateInventoryItem>[1] }) =>
      updateInventoryItem(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory"] })
      toast.success("Artículo actualizado")
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useDeleteInventoryItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteInventoryItem,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory"] })
      toast.success("Artículo eliminado")
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useAddMaintenance() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ itemId, data }: { itemId: string; data: Parameters<typeof addMaintenance>[1] }) =>
      addMaintenance(itemId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory"] })
      toast.success("Mantenimiento registrado")
    },
    onError: (e: Error) => toast.error(e.message),
  })
}
