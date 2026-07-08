// @ts-nocheck — DB types are a stub; will resolve when supabase gen types runs
"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { queryKeys as qk } from "@/lib/query-keys"
import type { ShoppingList, ShoppingListItem, Product } from "@/types/db"
import {
  createShoppingList,
  updateShoppingList,
  addItem,
  updateItem,
  deleteItem,
  createProduct,
  updateProduct,
  convertListToTransactions,
} from "./actions"
import { toast } from "sonner"

// ── Shopping Lists ──

export function useShoppingLists(householdId: string | null) {
  return useQuery({
    queryKey: qk.shoppingLists.all(householdId ?? ""),
    queryFn: async () => {
      if (!householdId) return [] as ShoppingList[]
      const supabase = createClient()
      const { data, error } = await supabase
        .from("shopping_lists")
        .select("*, items:shopping_list_items(*, shopping_category:shopping_categories!category_id(name))")
        .eq("household_id", householdId)
        .order("created_at", { ascending: false })
      if (error) throw error
      return (data as any[]).map((list) => ({
        ...list,
        item_count: list.items?.length ?? 0,
        total_estimated: list.items?.reduce((sum: number, i: any) => sum + (i.estimated_price ?? 0), 0) ?? 0,
        items: (list.items ?? []).map((item: any) => ({
          ...item,
          category: item.shopping_category?.name ?? "otros",
        })),
      })) as (ShoppingList & { items: (ShoppingListItem & { category: string })[]; item_count: number; total_estimated: number })[]
    },
    enabled: !!householdId,
  })
}

export function useShoppingListItems(listId: string | null) {
  return useQuery({
    queryKey: qk.shoppingLists.items(listId ?? ""),
    queryFn: async () => {
      if (!listId) return [] as ShoppingListItem[]
      const supabase = createClient()
      const { data, error } = await supabase
        .from("shopping_list_items")
        .select("*, shopping_category:shopping_categories!category_id(name)")
        .eq("list_id", listId)
        .order("sort_order")
      if (error) throw error
      return (data as any[]).map((item) => ({
        ...item,
        category: item.shopping_category?.name ?? "otros",
      })) as (ShoppingListItem & { category: string })[]
    },
    enabled: !!listId,
  })
}

export function useCreateShoppingList() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createShoppingList,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shopping-lists"] })
      toast.success("Lista creada")
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useUpdateShoppingList() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateShoppingList>[1] }) =>
      updateShoppingList(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shopping-lists"] })
      toast.success("Lista actualizada")
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

// ── Items ──

export function useAddItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ listId, data }: { listId: string; data: Parameters<typeof addItem>[1] }) =>
      addItem(listId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shopping-lists"] })
      toast.success("Artículo agregado")
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useUpdateItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateItem>[1] }) =>
      updateItem(id, data),
    onMutate: async ({ id, data }) => {
      await qc.cancelQueries({ queryKey: ["shopping-lists"] })
      const previous = qc.getQueriesData({ queryKey: ["shopping-lists"] })

      qc.setQueriesData({ queryKey: ["shopping-lists"] }, (old: any) => {
        if (!old) return old
        if (Array.isArray(old)) {
          return old.map((list: any) => ({
            ...list,
            items: (list.items ?? []).map((item: any) =>
              item.id === id ? { ...item, ...data } : item
            ),
            total_estimated: (list.items ?? []).reduce(
              (sum: number, i: any) =>
                sum + (i.id === id ? (data.estimated_price ?? i.estimated_price ?? 0) : (i.estimated_price ?? 0)),
              0
            ),
          }))
        }
        return old
      })

      return { previous }
    },
    onError: (err, vars, context) => {
      if (context?.previous) {
        for (const [key, data] of context.previous) {
          if (data) qc.setQueryData(key, data)
        }
      }
      toast.error(err.message)
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["shopping-lists"] })
    },
  })
}

export function useDeleteItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteItem,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shopping-lists"] })
      toast.success("Artículo eliminado")
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

// ── Products ──

export function useProducts(householdId: string | null, filters?: { category?: string; favorite?: boolean; search?: string }) {
  return useQuery({
    queryKey: qk.products.all(householdId ?? ""),
    queryFn: async () => {
      if (!householdId) return [] as Product[]
      const supabase = createClient()
      let query = supabase
        .from("products")
        .select("*, shopping_category:shopping_categories!default_category_id(name)")
        .eq("household_id", householdId)
        .order("name")

      if (filters?.category) {
        query = query.eq("default_category_id", filters.category)
      }
      if (filters?.favorite) {
        query = query.eq("favorite", true)
      }
      if (filters?.search) {
        query = query.ilike("name", `%${filters.search}%`)
      }

      const { data, error } = await query
      if (error) throw error
      return (data as any[]).map((p) => ({
        ...p,
        category: p.shopping_category?.name ?? "otros",
        unit: p.default_unit ?? "unidad",
      })) as (Product & { category: string; unit: string })[]
    },
    enabled: !!householdId,
  })
}

export function useCreateProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] })
      toast.success("Producto creado")
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useUpdateProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateProduct>[1] }) =>
      updateProduct(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] })
      toast.success("Producto actualizado")
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

// ── Convert ──

export function useConvertListToTransactions() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: convertListToTransactions,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shopping-lists"] })
      qc.invalidateQueries({ queryKey: ["transactions"] })
      qc.invalidateQueries({ queryKey: ["accounts"] })
      toast.success("Lista convertida a transacciones")
    },
    onError: (e: Error) => toast.error(e.message),
  })
}
