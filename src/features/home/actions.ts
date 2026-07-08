// @ts-nocheck — DB types are a stub; will resolve when supabase gen types runs
"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { createServerSupabase } from "@/lib/supabase/server"
import { requireHousehold } from "@/lib/auth"
import {
  inventoryItemSchema,
  inventoryMaintenanceSchema,
  type InventoryItem,
  type InventoryMaintenance,
} from "./schemas"

type InventoryItemInput = z.infer<typeof inventoryItemSchema>

export async function createInventoryItem(data: InventoryItemInput) {
  const { householdId } = await requireHousehold()
  const parsed = inventoryItemSchema.parse(data)
  const supabase = await createServerSupabase()

  const { error } = await supabase.from("inventory_items").insert({
    ...parsed,
    household_id: householdId,
  })

  if (error) throw new Error(error.message)
  revalidatePath("/home/inventory")
  revalidatePath("/")
}

export async function updateInventoryItem(id: string, data: Partial<InventoryItemInput>) {
  await requireHousehold()
  const supabase = await createServerSupabase()

  const { error } = await supabase.from("inventory_items").update(data).eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath("/home/inventory")
  revalidatePath("/")
}

export async function deleteInventoryItem(id: string) {
  await requireHousehold()
  const supabase = await createServerSupabase()
  const { error } = await supabase.from("inventory_items").update({ deleted_at: new Date().toISOString() }).eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath("/home/inventory")
  revalidatePath("/")
}

export async function addMaintenance(itemId: string, data: InventoryMaintenance) {
  await requireHousehold()
  const parsed = inventoryMaintenanceSchema.parse({ ...data, item_id: itemId })
  const supabase = await createServerSupabase()

  const { error } = await supabase.from("inventory_maintenance").insert(parsed)
  if (error) throw new Error(error.message)
  revalidatePath("/home/inventory")
}
