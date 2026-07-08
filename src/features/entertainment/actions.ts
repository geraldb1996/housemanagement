// @ts-nocheck — DB types are a stub; will resolve when supabase gen types runs
"use server"

import { revalidatePath } from "next/cache"
import { createServerSupabase } from "@/lib/supabase/server"
import { requireHousehold } from "@/lib/auth"
import {
  subscriptionSchema,
  gameSchema,
  watchlistItemSchema,
  type SubscriptionForm,
  type GameForm,
  type WatchlistItemForm,
} from "./schemas"

// ── Subscriptions ──

export async function createSubscription(data: SubscriptionForm) {
  const { householdId } = await requireHousehold()
  const parsed = subscriptionSchema.parse(data)
  const supabase = await createServerSupabase()

  const { error } = await supabase.from("subscriptions").insert({
    ...parsed,
    household_id: householdId,
  })

  if (error) throw new Error(error.message)
  revalidatePath("/entertainment")
  revalidatePath("/entertainment/subscriptions")
  revalidatePath("/")
}

export async function updateSubscription(id: string, data: Partial<SubscriptionForm>) {
  await requireHousehold()
  const supabase = await createServerSupabase()

  const { error } = await supabase.from("subscriptions").update(data).eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath("/entertainment")
  revalidatePath("/entertainment/subscriptions")
  revalidatePath("/")
}

export async function deleteSubscription(id: string) {
  await requireHousehold()
  const supabase = await createServerSupabase()

  const { error } = await supabase.from("subscriptions").update({ status: "cancelled" }).eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath("/entertainment")
  revalidatePath("/entertainment/subscriptions")
  revalidatePath("/")
}

export async function generateSubscriptionTransaction(subscriptionId: string) {
  const { householdId } = await requireHousehold()
  const supabase = await createServerSupabase()

  const { data: sub, error: fetchErr } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("id", subscriptionId)
    .single()

  if (fetchErr || !sub) throw new Error(fetchErr?.message ?? "Suscripción no encontrada")

  if (!sub.account_id) throw new Error("La suscripción no tiene cuenta asignada")

  const today = new Date().toISOString().split("T")[0]

  const { error: txErr } = await supabase.from("transactions").insert({
    household_id: householdId,
    account_id: sub.account_id,
    type: "expense",
    amount: Number(sub.monthly_price || 0),
    currency: "NIO",
    date: today,
    paid: true,
    paid_at: new Date().toISOString(),
    description: sub.name,
    notes: sub.username ? `Usuario: ${sub.username}` : null,
  })

  if (txErr) throw new Error(txErr.message)

  const nextDate = new Date(sub.renewal_date)
  switch (sub.billing_cycle) {
    case "monthly":
      nextDate.setMonth(nextDate.getMonth() + 1)
      break
    case "quarterly":
      nextDate.setMonth(nextDate.getMonth() + 3)
      break
    case "annual":
      nextDate.setFullYear(nextDate.getFullYear() + 1)
      break
    default:
      nextDate.setMonth(nextDate.getMonth() + 1)
  }

  await supabase
    .from("subscriptions")
    .update({ renewal_date: nextDate.toISOString().split("T")[0] })
    .eq("id", subscriptionId)

  revalidatePath("/entertainment")
  revalidatePath("/entertainment/subscriptions")
  revalidatePath("/finance")
  revalidatePath("/finance/transactions")
  revalidatePath("/")
}

// ── Games ──

export async function createGame(data: GameForm) {
  const { householdId } = await requireHousehold()
  const parsed = gameSchema.parse(data)
  const supabase = await createServerSupabase()

  const { error } = await supabase.from("games").insert({
    ...parsed,
    household_id: householdId,
  })

  if (error) throw new Error(error.message)
  revalidatePath("/entertainment")
  revalidatePath("/entertainment/games")
}

export async function updateGame(id: string, data: Partial<GameForm>) {
  await requireHousehold()
  const supabase = await createServerSupabase()

  const { error } = await supabase.from("games").update(data).eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath("/entertainment")
  revalidatePath("/entertainment/games")
}

// ── Watchlist ──

export async function createWatchlistItem(data: WatchlistItemForm) {
  const { householdId } = await requireHousehold()
  const parsed = watchlistItemSchema.parse(data)
  const supabase = await createServerSupabase()

  const { error } = await supabase.from("watchlist_items").insert({
    ...parsed,
    household_id: householdId,
  })

  if (error) throw new Error(error.message)
  revalidatePath("/entertainment")
  revalidatePath("/entertainment/watchlist")
}

export async function updateWatchlistItem(id: string, data: Partial<WatchlistItemForm>) {
  await requireHousehold()
  const supabase = await createServerSupabase()

  const { error } = await supabase.from("watchlist_items").update(data).eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath("/entertainment")
  revalidatePath("/entertainment/watchlist")
}
