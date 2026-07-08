// @ts-nocheck — DB types are a stub; will resolve when supabase gen types runs
"use server"

import { revalidatePath } from "next/cache"
import { createServerSupabase } from "@/lib/supabase/server"
import { requireHousehold } from "@/lib/auth"
import {
  shoppingListSchema,
  shoppingListItemSchema,
  productSchema,
  type ShoppingListForm,
  type ShoppingListItemForm,
  type ProductForm,
} from "./schemas"

// ── Shopping Lists ──

export async function createShoppingList(data: ShoppingListForm) {
  const { householdId } = await requireHousehold()
  const parsed = shoppingListSchema.parse(data)
  const supabase = await createServerSupabase()

  const { data: created, error } = await supabase
    .from("shopping_lists")
    .insert({
      name: parsed.name,
      kind: parsed.kind,
      status: parsed.status,
      store: parsed.store || null,
      household_id: householdId,
    })
    .select("id")
    .single()

  if (error || !created) throw new Error(error?.message || "No se pudo crear la lista")

  if (parsed.items.length > 0) {
    const itemsData = await Promise.all(parsed.items.map(async (item, idx) => {
      const categoryId = await ensureShoppingCategory(supabase, householdId, item.category)
      return {
        list_id: (created as any).id,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        category_id: categoryId,
        estimated_price: item.estimated_price,
        purchased: item.purchased,
        purchased_at: item.purchased ? new Date().toISOString() : null,
        sort_order: idx,
      }
    }))

    const { error: itemsError } = await supabase.from("shopping_list_items").insert(itemsData)
    if (itemsError) throw new Error(itemsError.message)
  }

  revalidatePath("/shopping")
  revalidatePath("/")
}

export async function updateShoppingList(id: string, data: Partial<ShoppingListForm>) {
  await requireHousehold()
  const supabase = await createServerSupabase()

  const { error } = await supabase.from("shopping_lists").update(data).eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath("/shopping")
  revalidatePath("/")
}

export async function deleteShoppingList(id: string) {
  await requireHousehold()
  const supabase = await createServerSupabase()

  const { error: itemsErr } = await supabase.from("shopping_list_items").delete().eq("list_id", id)
  if (itemsErr) throw new Error(itemsErr.message)

  const { error } = await supabase.from("shopping_lists").delete().eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath("/shopping")
  revalidatePath("/")
}

// ── Items ──

export async function addItem(listId: string, data: ShoppingListItemForm) {
  const { householdId } = await requireHousehold()
  const parsed = shoppingListItemSchema.parse(data)
  const supabase = await createServerSupabase()

  const categoryId = await ensureShoppingCategory(supabase, householdId, parsed.category)

  const { error } = await supabase.from("shopping_list_items").insert({
    list_id: listId,
    name: parsed.name,
    quantity: parsed.quantity,
    unit: parsed.unit,
    category_id: categoryId,
    estimated_price: parsed.estimated_price,
    purchased: parsed.purchased,
    purchased_at: parsed.purchased ? new Date().toISOString() : null,
    sort_order: 0,
  })

  if (error) throw new Error(error.message)
  revalidatePath("/shopping")
  revalidatePath("/")
}

export async function updateItem(id: string, data: Partial<ShoppingListItemForm>) {
  await requireHousehold()
  const supabase = await createServerSupabase()

  const update: Record<string, unknown> = { ...data }
  if (data.purchased !== undefined) {
    update.purchased_at = data.purchased ? new Date().toISOString() : null
  }

  const { error } = await supabase.from("shopping_list_items").update(update).eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath("/shopping")
  revalidatePath("/")
}

export async function deleteItem(id: string) {
  await requireHousehold()
  const supabase = await createServerSupabase()
  const { error } = await supabase.from("shopping_list_items").delete().eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath("/shopping")
  revalidatePath("/")
}

// ── Products ──

async function ensureShoppingCategory(supabase: Awaited<ReturnType<typeof createServerSupabase>>, householdId: string, categoryName: string): Promise<string | null> {
  if (!categoryName) return null

  const { data: existing } = await supabase
    .from("shopping_categories")
    .select("id")
    .eq("household_id", householdId)
    .eq("name", categoryName)
    .maybeSingle()

  if (existing) return existing.id

  const { data: created, error } = await supabase
    .from("shopping_categories")
    .insert({
      household_id: householdId,
      name: categoryName,
    })
    .select("id")
    .single()

  if (error || !created) return null
  return created.id
}

export async function createProduct(data: ProductForm) {
  const { householdId } = await requireHousehold()
  const parsed = productSchema.parse(data)
  const supabase = await createServerSupabase()

  const categoryId = await ensureShoppingCategory(supabase, householdId, parsed.category)

  const { error } = await supabase.from("products").insert({
    household_id: householdId,
    name: parsed.name,
    default_unit: parsed.unit,
    default_category_id: categoryId,
    last_price: parsed.last_price,
    barcode: parsed.barcode || null,
    favorite: parsed.favorite,
  })

  if (error) throw new Error(error.message)
  revalidatePath("/shopping")
  revalidatePath("/shopping/products")
}

export async function updateProduct(id: string, data: Partial<ProductForm>) {
  const { householdId } = await requireHousehold()
  const supabase = await createServerSupabase()

  const update: Record<string, unknown> = {}
  if (data.name !== undefined) update.name = data.name
  if (data.unit !== undefined) update.default_unit = data.unit
  if (data.last_price !== undefined) update.last_price = data.last_price
  if (data.barcode !== undefined) update.barcode = data.barcode || null
  if (data.favorite !== undefined) update.favorite = data.favorite

  if (data.category !== undefined) {
    update.default_category_id = await ensureShoppingCategory(supabase, householdId, data.category)
  }

  if (Object.keys(update).length === 0) return
  const { error } = await supabase.from("products").update(update).eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath("/shopping")
  revalidatePath("/shopping/products")
}

// ── Convert to Transactions ──

export async function convertListToTransactions(listId: string) {
  const { householdId } = await requireHousehold()
  const supabase = await createServerSupabase()

  const { data: items, error: itemsError } = await supabase
    .from("shopping_list_items")
    .select("*")
    .eq("list_id", listId)

  if (itemsError) throw new Error(itemsError.message)
  if (!items || items.length === 0) throw new Error("La lista no tiene artículos")

  const { data: accounts } = await supabase
    .from("accounts")
    .select("id")
    .eq("household_id", householdId)
    .eq("is_archived", false)
    .limit(1)

  const accountId = accounts?.[0]?.id
  const now = new Date().toISOString()

  const transactions = items.map((item) => ({
    household_id: householdId,
    account_id: accountId,
    type: "expense",
    amount: item.estimated_price ?? 0,
    currency: "NIO",
    date: now.split("T")[0],
    paid: true,
    paid_at: now,
    description: `${item.name} — ${item.quantity ?? 1} ${item.unit ?? "unidad"}`,
    notes: `Convertido de lista de compras #${listId}`,
  }))

  const { error: txError } = await supabase.from("transactions").insert(transactions)
  if (txError) throw new Error(txError.message)

  await supabase.from("shopping_lists").update({ status: "completed" }).eq("id", listId)

  revalidatePath("/shopping")
  revalidatePath("/finance")
  revalidatePath("/finance/transactions")
  revalidatePath("/")
}
