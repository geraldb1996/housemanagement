"use client"

import { StatCard } from "@/components/data/StatCard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { LoadingSkeleton, CardSkeleton } from "@/components/data/LoadingSkeleton"
import { EmptyState } from "@/components/data/EmptyState"
import {
  PiggyBank,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Plus,
  Wallet,
  CreditCard,
  BadgeDollarSign,
} from "lucide-react"
import { formatMoney, formatShortDate, cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { useHousehold } from "@/lib/use-household"
import { useAccounts, useTransactions, useObligations } from "@/features/finance/queries"

const accountTypeIcons: Record<string, React.ElementType> = {
  bank: Wallet,
  cash: Wallet,
  savings: PiggyBank,
  credit_card: CreditCard,
}

function getMonthLabel(): string {
  const now = new Date()
  const months = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
  ]
  return `${months[now.getMonth()]} ${now.getFullYear()}`
}

function isCurrentMonth(dateStr: string): boolean {
  const d = new Date(dateStr)
  const now = new Date()
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
}

export function FinanceDashboard() {
  const router = useRouter()
  const { householdId, isLoading: householdLoading } = useHousehold()

  const {
    data: accounts,
    isLoading: accountsLoading,
    error: accountsError,
  } = useAccounts(householdId || null)

  const {
    data: transactions,
    isLoading: transactionsLoading,
    error: transactionsError,
  } = useTransactions(householdId || null)

  const {
    data: obligations,
    isLoading: obligationsLoading,
    error: obligationsError,
  } = useObligations(householdId || null)

  const activeAccounts = accounts?.filter((a) => !a.is_archived) ?? []
  const totalBalance = activeAccounts
    .filter((a) => a.include_in_net_worth || a.account_type === "credit_card")
    .reduce((s, a) => s + Number(a.current_balance), 0)

  const monthTransactions = transactions?.filter((tx) => isCurrentMonth(tx.date)) ?? []
  const monthlyIncome = monthTransactions
    .filter((tx) => tx.type === "income")
    .reduce((s, tx) => s + Number(tx.amount), 0)
  const monthlyExpense = monthTransactions
    .filter((tx) => tx.type === "expense")
    .reduce((s, tx) => s + Number(tx.amount), 0)

  const openObligations =
    obligations?.filter((o) => o.status === "open" || o.status === "partially_paid") ?? []
  const pendingAmount = openObligations
    .filter((o) => o.direction === "owed_by_us")
    .reduce((s, o) => s + (Number(o.total_amount) - Number(o.paid_amount)), 0)

  const recentTransactions = transactions?.slice(0, 6) ?? []

  const allQueriesLoading = accountsLoading || transactionsLoading || obligationsLoading
  const anyError = accountsError || transactionsError || obligationsError

  const primaryCurrency = activeAccounts[0]?.currency ?? "NIO"
  const monthLabel = getMonthLabel()

  if (householdLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-4 w-48 mt-1" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Finanzas</h1>
          <p className="text-muted-foreground text-sm mt-1">Dashboard financiero</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => router.push("/finance/transactions")}>
            <Plus className="h-4 w-4 mr-1" /> Transacci&oacute;n
          </Button>
          <Button variant="outline" size="sm" onClick={() => router.push("/finance/accounts")}>
            <Wallet className="h-4 w-4 mr-1" /> Cuentas
          </Button>
        </div>
      </div>

      {anyError ? (
        <EmptyState
          icon={AlertTriangle}
          title="Error al cargar datos"
          description="No se pudieron cargar los datos financieros. Revisa tu conexi&oacute;n e intenta de nuevo."
        />
      ) : allQueriesLoading ? (
        <>
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-12">
            <div className="md:col-span-4 rounded-xl border bg-card p-4">
              <LoadingSkeleton rows={4} />
            </div>
            <div className="md:col-span-5 rounded-xl border bg-card p-4">
              <LoadingSkeleton rows={6} />
            </div>
            <div className="md:col-span-3 rounded-xl border bg-card p-4">
              <LoadingSkeleton rows={3} />
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Balance total"
              value={formatMoney(totalBalance, primaryCurrency)}
              icon={PiggyBank}
              trend={totalBalance >= 0 ? "up" : "down"}
            />
            <StatCard
              title="Ingresos del mes"
              value={formatMoney(monthlyIncome, primaryCurrency)}
              icon={TrendingUp}
              trend="up"
              subtitle={monthLabel}
            />
            <StatCard
              title="Gastos del mes"
              value={formatMoney(monthlyExpense, primaryCurrency)}
              icon={TrendingDown}
              trend="down"
              subtitle={monthLabel}
            />
            <StatCard
              title="Pendiente"
              value={formatMoney(pendingAmount, primaryCurrency)}
              icon={AlertTriangle}
              trend="neutral"
              subtitle="Por pagar"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-12">
            <Card className="md:col-span-4">
              <CardHeader>
                <CardTitle className="text-sm font-medium">Cuentas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {activeAccounts.length === 0 ? (
                  <EmptyState
                    icon={Wallet}
                    title="Sin cuentas"
                    description="Agrega tu primera cuenta para empezar"
                    actionLabel="Nueva cuenta"
                    onAction={() => router.push("/finance/accounts")}
                    className="py-8"
                  />
                ) : (
                  activeAccounts.map((acc) => {
                    const Icon = accountTypeIcons[acc.account_type] || Wallet
                    return (
                      <div key={acc.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-8 w-8 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: (acc.color || "#888") + "20" }}
                          >
                            <Icon className="h-4 w-4" style={{ color: acc.color || "#888" }} />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{acc.name}</p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {acc.account_type.replace("_", " ")}
                            </p>
                          </div>
                        </div>
                        <span
                          className={cn(
                            "text-sm font-semibold",
                            Number(acc.current_balance) < 0 ? "text-red-600" : "text-emerald-600"
                          )}
                        >
                          {formatMoney(Number(acc.current_balance), acc.currency)}
                        </span>
                      </div>
                    )
                  })
                )}
              </CardContent>
            </Card>

            <Card className="md:col-span-5">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Actividad reciente</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => router.push("/finance/transactions")}
                >
                  Ver todas
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentTransactions.length === 0 ? (
                  <EmptyState
                    icon={BadgeDollarSign}
                    title="Sin transacciones"
                    description="Registra tu primer ingreso o gasto"
                    actionLabel="Nueva transacci&oacute;n"
                    onAction={() => router.push("/finance/transactions")}
                    className="py-8"
                  />
                ) : (
                  recentTransactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={cn(
                            "h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0",
                            tx.type === "income" &&
                              "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600",
                            tx.type === "expense" &&
                              "bg-red-100 dark:bg-red-900/30 text-red-600",
                            tx.type === "transfer" &&
                              "bg-blue-100 dark:bg-blue-900/30 text-blue-600"
                          )}
                        >
                          {tx.type === "income" ? (
                            <TrendingUp className="h-3.5 w-3.5" />
                          ) : tx.type === "expense" ? (
                            <TrendingDown className="h-3.5 w-3.5" />
                          ) : (
                            <BadgeDollarSign className="h-3.5 w-3.5" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {tx.description || "Sin descripci&oacute;n"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {(tx as any).account_name ?? "—"} &middot;{" "}
                            {(tx as any).category_name ?? "—"} &middot; {formatShortDate(tx.date)}
                          </p>
                        </div>
                      </div>
                      <span
                        className={cn(
                          "text-sm font-semibold flex-shrink-0 ml-2",
                          tx.type === "income"
                            ? "text-emerald-600"
                            : tx.type === "expense"
                              ? "text-red-600"
                              : "text-blue-600"
                        )}
                      >
                        {tx.type === "income" ? "+" : tx.type === "expense" ? "-" : ""}
                        {formatMoney(Number(tx.amount), tx.currency)}
                      </span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <div className="md:col-span-3 space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Obligaciones</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {openObligations.length === 0 ? (
                    <EmptyState
                      icon={AlertTriangle}
                      title="Sin obligaciones pendientes"
                      description="No hay deudas ni pr&eacute;stamos activos"
                      className="py-6"
                    />
                  ) : (
                    openObligations.map((ob) => {
                      const remaining = Number(ob.total_amount) - Number(ob.paid_amount)
                      return (
                        <div key={ob.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <div
                              className={cn(
                                "h-2 w-2 rounded-full flex-shrink-0",
                                ob.direction === "owed_by_us"
                                  ? "bg-orange-400"
                                  : "bg-emerald-400"
                              )}
                            />
                            <div className="min-w-0">
                              <p className="text-sm truncate">{ob.description}</p>
                              <p className="text-xs text-muted-foreground">
                                {ob.direction === "owed_by_us" ? "Debemos" : "Nos deben"}
                                {(ob as any).person_name
                                  ? ` \u00b7 ${(ob as any).person_name}`
                                  : ""}
                              </p>
                            </div>
                          </div>
                          <span className="text-sm font-semibold flex-shrink-0 ml-2">
                            {formatMoney(remaining, primaryCurrency)}
                          </span>
                        </div>
                      )
                    })
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full h-7 text-xs"
                    onClick={() => router.push("/finance/obligations")}
                  >
                    Ver obligaciones
                  </Button>
                </CardContent>
              </Card>

              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-start h-auto py-3"
                  onClick={() => router.push("/finance/budgets")}
                >
                  <BadgeDollarSign className="h-4 w-4 mr-2" />
                  <div className="text-left">
                    <p className="text-sm font-medium">Presupuestos</p>
                    <p className="text-xs text-muted-foreground">Planifica tus gastos</p>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-start h-auto py-3"
                  onClick={() => router.push("/finance/people")}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  <div className="text-left">
                    <p className="text-sm font-medium">Personas</p>
                    <p className="text-xs text-muted-foreground">Deudas y pr&eacute;stamos</p>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-start h-auto py-3"
                  onClick={() => router.push("/finance/reports")}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  <div className="text-left">
                    <p className="text-sm font-medium">Reportes</p>
                    <p className="text-xs text-muted-foreground">
                      Gr&aacute;ficas y exportaci&oacute;n
                    </p>
                  </div>
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
