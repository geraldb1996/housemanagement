// @ts-nocheck — DB types stub; resolves when supabase gen types runs
import { NextRequest, NextResponse } from "next/server"
import { createServiceSupabase } from "@/lib/supabase/service"
import { createServerSupabase } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

    const { name } = await request.json()
    const serviceClient = createServiceSupabase()

    // Create household
    const { data: household, error: hErr } = await serviceClient
      .from("households")
      .insert({ name: name || "Mi Hogar", base_currency: "NIO" })
      .select("id")
      .single()

    if (hErr) return NextResponse.json({ error: hErr.message }, { status: 500 })
    if (!household) return NextResponse.json({ error: "No se pudo crear el hogar" }, { status: 500 })

    // Add user as admin member
    const { error: mErr } = await serviceClient
      .from("household_members")
      .insert({
        household_id: household.id,
        user_id: user.id,
        role: "admin",
        display_name: user.user_metadata?.full_name || name || "Admin",
      })

    if (mErr) return NextResponse.json({ error: mErr.message }, { status: 500 })

    // Seed default categories
    const expenses = [
      { name: "Comida", icon: "Utensils" },
      { name: "Transporte", icon: "Car" },
      { name: "Servicios", icon: "Zap" },
      { name: "Salud", icon: "Heart" },
      { name: "Entretenimiento", icon: "Gamepad2" },
      { name: "Ropa", icon: "Shirt" },
      { name: "Educación", icon: "BookOpen" },
      { name: "Hogar", icon: "House" },
      { name: "Otros", icon: "Ellipsis" },
    ]
    const incomes = [
      { name: "Salario", icon: "Briefcase" },
      { name: "Freelance", icon: "Laptop" },
      { name: "Inversiones", icon: "TrendingUp" },
      { name: "Otros ingresos", icon: "Plus" },
    ]

    const categories = [
      ...expenses.map((c) => ({ household_id: household.id, name: c.name, kind: "expense", icon: c.icon })),
      ...incomes.map((c) => ({ household_id: household.id, name: c.name, kind: "income", icon: c.icon })),
    ]

    await serviceClient.from("categories").insert(categories)

    // Default payment cycles
    await serviceClient.from("payment_cycles").insert([
      { household_id: household.id, name: "Quincena 15", cycle_type: "fixed_dates", config: { days: [15] }, active: true },
      { household_id: household.id, name: "Quincena 30", cycle_type: "fixed_dates", config: { days: [28] }, active: true },
    ])

    // Default cash account
    await serviceClient.from("accounts").insert({
      household_id: household.id,
      name: "Efectivo",
      account_type: "cash",
      opening_balance: 0,
      currency: "NIO",
    })

    return NextResponse.json({ success: true, householdId: household.id })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
