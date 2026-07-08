"use client"

import { useRouter } from "next/navigation"
import { Tv, Gamepad2, Film, CreditCard, Calendar } from "lucide-react"
import { StatCard } from "@/components/data/StatCard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LoadingSkeleton } from "@/components/data/LoadingSkeleton"
import { useHousehold } from "@/lib/use-household"
import { useSubscriptions, useGames, useWatchlist } from "../queries"
import { formatMoney, formatShortDate, cn } from "@/lib/utils"

export function EntertainmentPage() {
  const router = useRouter()
  const { householdId, isLoading: householdLoading } = useHousehold()

  const { data: subscriptions = [], isLoading: subsLoading } = useSubscriptions(householdId || null)
  const { data: games = [], isLoading: gamesLoading } = useGames(householdId || null)
  const { data: watchlist = [], isLoading: watchlistLoading } = useWatchlist(householdId || null)

  const loading = householdLoading || subsLoading || gamesLoading || watchlistLoading

  const activeSubs = subscriptions.filter((s: any) => s.status === "active")
  const monthlyTotal = activeSubs.reduce((sum: number, s: any) => sum + Number(s.monthly_price || 0), 0)
  const activeGames = games.filter((g: any) => g.status === "playing").length
  const pendingWatchlist = watchlist.filter((w: any) => w.status === "pending").length

  const now = new Date()
  const thirtyDaysFromNow = new Date()
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

  const upcomingRenewals = subscriptions
    .filter((s: any) => {
      if (!s.renewal_date) return false
      const renewal = new Date(s.renewal_date)
      return renewal >= now && renewal <= thirtyDaysFromNow
    })
    .sort((a: any, b: any) => new Date(a.renewal_date).getTime() - new Date(b.renewal_date).getTime())

  const statusBadgeClass = (status: string) => {
    if (status === "active") return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
    if (status === "paused") return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
    return "bg-muted text-muted-foreground"
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Entretenimiento</h1>
          <p className="text-muted-foreground text-sm mt-1">Suscripciones, juegos y contenido multimedia</p>
        </div>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <LoadingSkeleton rows={2} />
          <LoadingSkeleton rows={2} />
          <LoadingSkeleton rows={2} />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Entretenimiento</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Suscripciones, juegos y contenido multimedia
        </p>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Gasto mensual suscripciones"
          value={formatMoney(monthlyTotal)}
          subtitle={`${activeSubs.length} suscripciones activas`}
          icon={CreditCard}
          trend="neutral"
        />
        <StatCard
          title="Juegos activos"
          value={String(activeGames)}
          subtitle={`${games.length} en biblioteca`}
          icon={Gamepad2}
        />
        <StatCard
          title="Pendientes por ver"
          value={String(pendingWatchlist)}
          subtitle={`${watchlist.length} en total`}
          icon={Film}
        />
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Button
          variant="outline"
          className="h-auto py-6 flex-col gap-2"
          onClick={() => router.push("/entertainment/subscriptions")}
        >
          <Tv className="h-6 w-6" />
          <span className="text-sm font-medium">Suscripciones</span>
        </Button>
        <Button
          variant="outline"
          className="h-auto py-6 flex-col gap-2"
          onClick={() => router.push("/entertainment/games")}
        >
          <Gamepad2 className="h-6 w-6" />
          <span className="text-sm font-medium">Juegos</span>
        </Button>
        <Button
          variant="outline"
          className="h-auto py-6 flex-col gap-2"
          onClick={() => router.push("/entertainment/watchlist")}
        >
          <Film className="h-6 w-6" />
          <span className="text-sm font-medium">Watchlist</span>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Próximas renovaciones (30 días)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingRenewals.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No hay renovaciones próximas
            </p>
          ) : (
            <div className="divide-y">
              {upcomingRenewals.map((sub: any) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div>
                      <p className="text-sm font-medium truncate">{sub.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatShortDate(sub.renewal_date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-medium">
                      {formatMoney(sub.monthly_price)}
                    </span>
                    <Badge className={cn("text-[10px]", statusBadgeClass(sub.status))}>
                      {sub.status === "active" ? "Activa" : sub.status === "paused" ? "Pausada" : "Cancelada"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
