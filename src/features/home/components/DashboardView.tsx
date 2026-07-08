// @ts-nocheck — DB types stub; resolves when supabase gen types runs
"use client"

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { useHousehold } from "@/lib/use-household"
import { queryKeys as qk } from "@/lib/query-keys"
import { StatCard } from "@/components/data/StatCard"
import {
  PiggyBank,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Plus,
  ShoppingCart,
  CreditCard,
  Upload,
  FileText,
  Bell,
  Tv,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CardSkeleton, LoadingSkeleton } from "@/components/data/LoadingSkeleton"
import { EmptyState } from "@/components/data/EmptyState"
import { formatMoney, formatShortDate } from "@/lib/utils"
import type {
  Account,
  Transaction,
  PaymentObligation,
  Reminder,
  Subscription,
} from "@/types/db"

export function DashboardView({ userName }: { userName?: string | null }) {
  const router = useRouter()
  const { householdId } = useHousehold()

  const now = useMemo(() => new Date(), [])
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`
  const monthName = now.toLocaleDateString("es-DO", { month: "long", year: "numeric" })

  const accountsQuery = useQuery({
    queryKey: qk.dashboard.netWorth(householdId),
    queryFn: async () => {
      if (!householdId) return [] as Account[]
      const supabase = createClient()
      const { data, error } = await supabase
        .from("accounts")
        .select("*")
        .eq("household_id", householdId)
        .eq("is_archived", false)
      if (error) throw error
      return data as Account[]
    },
    enabled: !!householdId,
  })

  const transactionsQuery = useQuery({
    queryKey: qk.dashboard.summary(householdId),
    queryFn: async () => {
      if (!householdId) return [] as (Transaction & { account_name: string | null })[]
      const supabase = createClient()
      const { data, error } = await supabase
        .from("transactions")
        .select("*, account:accounts(name)")
        .eq("household_id", householdId)
        .is("deleted_at", null)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(10)
      if (error) throw error
      return (data as any[]).map(tx => ({
        ...tx,
        account_name: tx.account?.name ?? null,
      })) as (Transaction & { account_name: string | null })[]
    },
    enabled: !!householdId,
  })

  const monthTransactionsQuery = useQuery({
    queryKey: [...qk.dashboard.summary(householdId), "month", monthStart],
    queryFn: async () => {
      if (!householdId) return [] as Pick<Transaction, "type" | "amount" | "date">[]
      const supabase = createClient()
      const { data, error } = await supabase
        .from("transactions")
        .select("type, amount, date")
        .eq("household_id", householdId)
        .is("deleted_at", null)
        .gte("date", monthStart)
      if (error) throw error
      return data as Pick<Transaction, "type" | "amount" | "date">[]
    },
    enabled: !!householdId,
  })

  const obligationsQuery = useQuery({
    queryKey: qk.paymentObligations.open(householdId),
    queryFn: async () => {
      if (!householdId) return [] as (PaymentObligation & { person_name: string | null })[]
      const supabase = createClient()
      const { data, error } = await supabase
        .from("payment_obligations")
        .select("*, person:people(name)")
        .eq("household_id", householdId)
        .in("status", ["open", "partially_paid"])
        .is("deleted_at", null)
      if (error) throw error
      return (data as any[]).map(o => ({
        ...o,
        person_name: o.person?.name ?? null,
      })) as (PaymentObligation & { person_name: string | null })[]
    },
    enabled: !!householdId,
  })

  const remindersQuery = useQuery({
    queryKey: qk.reminders.upcoming(householdId),
    queryFn: async () => {
      if (!householdId) return [] as Reminder[]
      const nowISO = new Date().toISOString()
      const sevenDays = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      const supabase = createClient()
      const { data, error } = await supabase
        .from("reminders")
        .select("*")
        .eq("household_id", householdId)
        .eq("status", "pending")
        .gte("due_at", nowISO)
        .lte("due_at", sevenDays)
        .order("due_at", { ascending: true })
      if (error) throw error
      return data as Reminder[]
    },
    enabled: !!householdId,
  })

  const subscriptionsQuery = useQuery({
    queryKey: qk.subscriptions.active(householdId),
    queryFn: async () => {
      if (!householdId) return [] as Subscription[]
      const thirtyDays = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
      const supabase = createClient()
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("household_id", householdId)
        .eq("status", "active")
        .not("renewal_date", "is", null)
        .lte("renewal_date", thirtyDays)
        .order("renewal_date", { ascending: true })
      if (error) throw error
      return data as Subscription[]
    },
    enabled: !!householdId,
  })

  const netWorth = useMemo(() => {
    return (accountsQuery.data ?? [])
      .filter(a => a.include_in_net_worth)
      .reduce((sum, a) => sum + a.current_balance, 0)
  }, [accountsQuery.data])

  const incomeMTD = useMemo(() => {
    return (monthTransactionsQuery.data ?? [])
      .filter(tx => tx.type === "income")
      .reduce((sum, tx) => sum + tx.amount, 0)
  }, [monthTransactionsQuery.data])

  const expensesMTD = useMemo(() => {
    return (monthTransactionsQuery.data ?? [])
      .filter(tx => tx.type === "expense")
      .reduce((sum, tx) => sum + tx.amount, 0)
  }, [monthTransactionsQuery.data])

  const openObligations = useMemo(() => {
    return (obligationsQuery.data ?? [])
      .reduce((sum, o) => sum + (o.total_amount - o.paid_amount), 0)
  }, [obligationsQuery.data])

  const obligationsDirection = useMemo(() => {
    const data = obligationsQuery.data ?? []
    if (data.length === 0) return "owed_to_us"
    const weOwe = data.filter(o => o.direction === "owed_by_us")
    return weOwe.length > 0 ? "owed_by_us" : "owed_to_us"
  }, [obligationsQuery.data])

  const isLoading = accountsQuery.isLoading || transactionsQuery.isLoading || monthTransactionsQuery.isLoading

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Bienvenido{userName ? `, ${userName}` : ""}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Resumen del hogar</p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Patrimonio neto"
            value={formatMoney(netWorth)}
            icon={PiggyBank}
            trend={netWorth >= 0 ? "up" : "down"}
            subtitle="Total de activos"
          />
          <StatCard
            title="Ingresos del mes"
            value={formatMoney(incomeMTD)}
            icon={TrendingUp}
            trend="up"
            subtitle={monthName}
          />
          <StatCard
            title="Gastos del mes"
            value={formatMoney(expensesMTD)}
            icon={TrendingDown}
            trend="down"
            subtitle={monthName}
          />
          <StatCard
            title="Obligaciones abiertas"
            value={formatMoney(openObligations)}
            icon={AlertTriangle}
            trend="neutral"
            subtitle={obligationsDirection === "owed_to_us" ? "Nos deben" : "Debemos"}
          />
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-12">
        <Card className="md:col-span-7">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Actividad reciente</CardTitle>
          </CardHeader>
          <CardContent>
            {transactionsQuery.isLoading ? (
              <LoadingSkeleton rows={5} />
            ) : (transactionsQuery.data ?? []).length === 0 ? (
              <EmptyState
                icon={TrendingUp}
                title="Sin transacciones"
                description="No hay transacciones registradas aún"
              />
            ) : (
              <div className="space-y-3">
                {(transactionsQuery.data ?? []).map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-9 w-9 rounded-full flex items-center justify-center ${
                          tx.type === "income"
                            ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600"
                            : "bg-red-100 dark:bg-red-900/30 text-red-600"
                        }`}
                      >
                        {tx.type === "income" ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{tx.description || "Sin descripción"}</p>
                        <p className="text-xs text-muted-foreground">
                          {(tx as any).account_name ?? "—"} · {formatShortDate(tx.date)}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`text-sm font-semibold ${
                        tx.type === "income" ? "text-emerald-600" : "text-red-600"
                      }`}
                    >
                      {tx.type === "income" ? "+" : "-"}
                      {formatMoney(tx.amount)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="md:col-span-5 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Acciones rápidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-auto py-3 flex-col gap-1"
                  onClick={() => router.push("/finance/transactions")}
                >
                  <Plus className="h-4 w-4" />
                  <span className="text-xs">Transacción</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-auto py-3 flex-col gap-1"
                  onClick={() => router.push("/shopping")}
                >
                  <ShoppingCart className="h-4 w-4" />
                  <span className="text-xs">Lista compras</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-auto py-3 flex-col gap-1"
                  onClick={() => router.push("/entertainment/subscriptions")}
                >
                  <CreditCard className="h-4 w-4" />
                  <span className="text-xs">Suscripción</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-auto py-3 flex-col gap-1"
                  onClick={() => router.push("/documents")}
                >
                  <Upload className="h-4 w-4" />
                  <span className="text-xs">Documento</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Próximos recordatorios</CardTitle>
              <Badge variant="secondary" className="text-xs">
                {(remindersQuery.data ?? []).length}
              </Badge>
            </CardHeader>
            <CardContent>
              {remindersQuery.isLoading ? (
                <LoadingSkeleton rows={3} />
              ) : (remindersQuery.data ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">No hay recordatorios próximos</p>
              ) : (
                <div className="space-y-2">
                  {(remindersQuery.data ?? []).map((r) => (
                    <div key={r.id} className="flex items-center gap-2 text-sm">
                      <Bell className="h-3.5 w-3.5 text-orange-400 flex-shrink-0" />
                      <span className="flex-1 truncate">{r.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatShortDate(r.due_at)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Renovaciones pronto</CardTitle>
              <Badge variant="secondary" className="text-xs">
                {(subscriptionsQuery.data ?? []).length}
              </Badge>
            </CardHeader>
            <CardContent>
              {subscriptionsQuery.isLoading ? (
                <LoadingSkeleton rows={3} />
              ) : (subscriptionsQuery.data ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">No hay renovaciones próximas</p>
              ) : (
                <div className="space-y-2">
                  {(subscriptionsQuery.data ?? []).map((s) => (
                    <div key={s.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Tv className="h-4 w-4 text-muted-foreground" />
                        <span>{s.name}</span>
                      </div>
                      <span className="text-muted-foreground">
                        {formatMoney(s.monthly_price ?? s.price ?? 0)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
