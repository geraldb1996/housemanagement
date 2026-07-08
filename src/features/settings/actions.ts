// @ts-nocheck — DB types stub; resolves when supabase gen types runs
"use server"

import { revalidatePath } from "next/cache"
import { createServerSupabase } from "@/lib/supabase/server"
import { requireHousehold } from "@/lib/auth"
import { exchangeRatesSchema } from "./schemas"
import type { ExchangeRateForm } from "./schemas"

export async function saveExchangeRates(rates: ExchangeRateForm[]) {
  const { householdId } = await requireHousehold()
  exchangeRatesSchema.parse({ rates })

  const supabase = await createServerSupabase()

  const { data: existing, error: fetchErr } = await supabase
    .from("app_settings")
    .select("id, preferences")
    .eq("household_id", householdId)
    .maybeSingle()

  if (fetchErr && fetchErr.code !== "PGRST116") throw new Error(fetchErr.message)

  const preferences = (existing?.preferences as Record<string, unknown>) ?? {}
  preferences.exchange_rates = rates

  if (existing) {
    const { error } = await supabase
      .from("app_settings")
      .update({ preferences, updated_at: new Date().toISOString() })
      .eq("id", existing.id)
    if (error) throw new Error(error.message)
  } else {
    const { error } = await supabase
      .from("app_settings")
      .insert({ household_id: householdId, preferences })
    if (error) throw new Error(error.message)
  }

  revalidatePath("/settings/currency")
  revalidatePath("/finance")
}
