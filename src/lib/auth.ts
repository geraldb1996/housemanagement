import { createServerSupabase } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export async function getSession() {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase.auth.getSession()
  if (error || !data.session) return null
  return data.session
}

export async function requireSession() {
  const session = await getSession()
  if (!session) redirect("/login")
  return session
}

export async function requireHousehold(): Promise<{
  userId: string
  householdId: string
  role: string
}> {
  const session = await requireSession()
  const supabase = await createServerSupabase()
  const result = await supabase
    .from("household_members")
    .select("household_id, role")
    .eq("user_id", session.user.id)
    .maybeSingle()

  const member = result.data as { household_id: string; role: string } | null

  if (!member) redirect("/onboarding")
  return { userId: session.user.id, householdId: member.household_id, role: member.role }
}

export async function requireAdmin() {
  const { userId, householdId, role } = await requireHousehold()
  if (role !== "admin") redirect("/?error=unauthorized")
  return { userId, householdId, role }
}
