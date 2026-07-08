// @ts-nocheck — DB types stub; resolves when supabase gen types runs
"use server"

import { revalidatePath } from "next/cache"
import { createServerSupabase } from "@/lib/supabase/server"
import { createServiceSupabase } from "@/lib/supabase/service"
import { requireHousehold, requireAdmin } from "@/lib/auth"
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

export async function addHouseholdMember(email: string) {
  const { householdId, role: adminRole, userId: currentUserId } = await requireAdmin()
  if (adminRole !== "admin") throw new Error("Solo el admin puede invitar miembros")

  const serviceClient = createServiceSupabase()

  const { data: profile, error: profileErr } = await serviceClient
    .from("profiles")
    .select("id, email, full_name")
    .eq("email", email.toLowerCase().trim())
    .maybeSingle()

  if (profileErr || !profile) throw new Error("No se encontró un usuario con ese email. Debe registrarse primero.")

  const supabase = await createServerSupabase()

  const { data: existing, error: checkErr } = await supabase
    .from("household_members")
    .select("id")
    .eq("household_id", householdId)
    .eq("user_id", profile.id)
    .maybeSingle()

  if (existing) throw new Error("Ese usuario ya es miembro del hogar")

  const { error: insertErr } = await supabase
    .from("household_members")
    .insert({
      household_id: householdId,
      user_id: profile.id,
      role: "member",
      display_name: profile.full_name ?? email,
    })

  if (insertErr) throw new Error(insertErr.message)

  revalidatePath("/settings/users")
}

export async function removeHouseholdMember(memberId: string) {
  const { householdId, role: adminRole } = await requireAdmin()
  if (adminRole !== "admin") throw new Error("Solo el admin puede remover miembros")

  const supabase = await createServerSupabase()

  const { data: member, error: fetchErr } = await supabase
    .from("household_members")
    .select("role")
    .eq("id", memberId)
    .eq("household_id", householdId)
    .maybeSingle()

  if (fetchErr || !member) throw new Error("Miembro no encontrado")
  if (member.role === "admin") throw new Error("No se puede remover al admin")

  const { error } = await supabase.from("household_members").delete().eq("id", memberId)
  if (error) throw new Error(error.message)

  revalidatePath("/settings/users")
}
