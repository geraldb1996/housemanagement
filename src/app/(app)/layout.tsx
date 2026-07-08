import { createServerSupabase } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AppShell } from "@/components/layout/AppShell"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  let user: { email?: string | null; name?: string | null } = {
    email: "demo@house.local",
    name: "Usuario",
  }

  try {
    const supabase = await createServerSupabase()
    const { data } = await supabase.auth.getUser()
    if (data.user) {
      user = {
        email: data.user.email,
        name: data.user.user_metadata?.full_name || data.user.email,
      }
    }
    // If supabase is configured but no session, redirect
    const isConfigured =
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://your-project.supabase.co"
    if (isConfigured && !data.user) {
      redirect("/login")
    }
  } catch {
    // Supabase not available — use mock user for dev
  }

  return <AppShell user={user}>{children}</AppShell>
}
