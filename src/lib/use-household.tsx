// @ts-nocheck — DB types stub; resolves when supabase gen types runs
"use client"

import { useEffect, useState, createContext, useContext, type ReactNode } from "react"
import { createClient } from "@/lib/supabase/client"

export interface HouseholdContext {
  householdId: string
  userId: string
  role: string
  isLoading: boolean
}

const HouseholdCtx = createContext<HouseholdContext>({
  householdId: "",
  userId: "",
  role: "member",
  isLoading: true,
})

export function HouseholdProvider({ children }: { children: ReactNode }) {
  const [ctx, setCtx] = useState<HouseholdContext>({
    householdId: "",
    userId: "",
    role: "member",
    isLoading: true,
  })

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        setCtx((c) => ({ ...c, isLoading: false }))
        return
      }
      supabase
        .from("household_members")
        .select("household_id, role")
        .eq("user_id", user.id)
        .maybeSingle()
        .then(({ data: member }) => {
          setCtx({
            householdId: member?.household_id ?? "",
            userId: user.id,
            role: member?.role ?? "member",
            isLoading: false,
          })
        })
    })
  }, [])

  return <HouseholdCtx.Provider value={ctx}>{children}</HouseholdCtx.Provider>
}

export function useHousehold() {
  return useContext(HouseholdCtx)
}
