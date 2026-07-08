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
    const itemsData = parsed.items.map((item, idx) => ({
      list_id: (created as any).id,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      category_id: item.category,
      estimated_price: item.estimated_price,
      purchased: item.purchased,
      purchased_at: item.purchased ? new Date().toISOString() : null,
      sort_order: idx,
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

// ── Items ──

export async function addItem(listId: string, data: ShoppingListItemForm) {
  await requireHousehold()
  const parsed = shoppingListItemSchema.parse(data)
  const supabase = await createServerSupabase()

  const { error } = await supabase.from("shopping_list_items").insert({
    list_id: listId,
    name: parsed.name,
    quantity: parsed.quantity,
    unit: parsed.unit,
    category_id: parsed.category,
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

export async function createProduct(data: ProductForm) {
  const { householdId } = await requireHousehold()
  const parsed = productSchema.parse(data)
  const supabase = await createServerSupabase()

  const { error } = await supabase.from("products").insert({
    household_id: householdId,
    name: parsed.name,
    default_unit: parsed.unit,
    default_category_id: parsed.category,
    last_price: parsed.last_price,
    barcode: parsed.barcode || null,
    favorite: parsed.favorite,
  })

  if (error) throw new Error(error.message)
  revalidatePath("/shopping")
  revalidatePath("/shopping/products")
}

export async function updateProduct(id: string, data: Partial<ProductForm>) {
  await requireHousehold()
  const supabase = await createServerSupabase()

  const update: Record<string, unknown> = { ...data }
  if (data.unit !== undefined) {
    update.default_unit = data.unit
    delete update.unit
  }
  if (data.category !== undefined) {
    update.default_category_id = data.category
    delete update.category
  }

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
