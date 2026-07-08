// @ts-nocheck — DB types stub; resolves when supabase gen types runs
"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { useHousehold } from "@/lib/use-household"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { EmptyState } from "@/components/data/EmptyState"
import { CardSkeleton, LoadingSkeleton } from "@/components/data/LoadingSkeleton"
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Tv,
  Box,
  FileText,
  ArrowRight,
  PiggyBank,
} from "lucide-react"
import { formatShortDate, formatMoney, cn } from "@/lib/utils"

type ModuleSource = "finance" | "entertainment" | "inventory" | "documents"

interface CalendarEvent {
  id: string
  title: string
  date: string
  module: ModuleSource
  description: string
  route: string
}

const moduleConfig: Record<ModuleSource, { label: string; icon: React.ElementType; color: string; badgeClass: string; route: string }> = {
  finance: {
    label: "Finanzas",
    icon: PiggyBank,
    color: "text-emerald-600",
    badgeClass: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    route: "/finance",
  },
  entertainment: {
    label: "Entretenimiento",
    icon: Tv,
    color: "text-blue-600",
    badgeClass: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    route: "/entertainment",
  },
  inventory: {
    label: "Inventario",
    icon: Box,
    color: "text-orange-600",
    badgeClass: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    route: "/shopping/products",
  },
  documents: {
    label: "Documentos",
    icon: FileText,
    color: "text-violet-600",
    badgeClass: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
    route: "/documents",
  },
}

function mapEntityTypeToModule(entityType: string | null): ModuleSource {
  if (!entityType) return "finance"
  const t = entityType.toLowerCase()
  if (["payment", "transaction", "obligation", "finance", "bill"].some(s => t.includes(s))) return "finance"
  if (["subscription", "service", "tv", "game", "watchlist"].some(s => t.includes(s))) return "entertainment"
  if (["inventory", "item", "maintenance", "warranty", "product"].some(s => t.includes(s))) return "inventory"
  if (["document", "file", "contract"].some(s => t.includes(s))) return "documents"
  return "finance"
}

export function CalendarView() {
  const router = useRouter()
  const { householdId } = useHousehold()
  const [moduleFilter, setModuleFilter] = useState("all")
  const [viewMode, setViewMode] = useState<"list" | "grid">("list")
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const now = useMemo(() => new Date(), [])
  const thirtyDaysFromNow = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + 30)
    return d
  }, [])

  const todayStr = now.toISOString().split("T")[0]
  const thirtyDaysStr = thirtyDaysFromNow.toISOString().split("T")[0]

  const obligationsQuery = useQuery({
    queryKey: ["calendar", "obligations", householdId],
    queryFn: async () => {
      if (!householdId) return []
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
      }))
    },
    enabled: !!householdId,
  })

  const subscriptionsQuery = useQuery({
    queryKey: ["calendar", "subscriptions", householdId],
    queryFn: async () => {
      if (!householdId) return []
      const supabase = createClient()
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("household_id", householdId)
        .eq("status", "active")
        .not("renewal_date", "is", null)
      if (error) throw error
      return data
    },
    enabled: !!householdId,
  })

  const inventoryQuery = useQuery({
    queryKey: ["calendar", "inventory", householdId],
    queryFn: async () => {
      if (!householdId) return []
      const supabase = createClient()
      const { data, error } = await supabase
        .from("inventory_items")
        .select("*")
        .eq("household_id", householdId)
        .not("warranty_expires_at", "is", null)
        .is("deleted_at", null)
      if (error) throw error
      return data
    },
    enabled: !!householdId,
  })

  const documentsQuery = useQuery({
    queryKey: ["calendar", "documents", householdId],
    queryFn: async () => {
      if (!householdId) return []
      const supabase = createClient()
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("household_id", householdId)
        .not("expires_at", "is", null)
        .is("deleted_at", null)
      if (error) throw error
      return data
    },
    enabled: !!householdId,
  })

  const remindersQuery = useQuery({
    queryKey: ["calendar", "reminders", householdId],
    queryFn: async () => {
      if (!householdId) return []
      const supabase = createClient()
      const { data, error } = await supabase
        .from("reminders")
        .select("*")
        .eq("household_id", householdId)
        .eq("status", "pending")
        .order("due_at", { ascending: true })
      if (error) throw error
      return data
    },
    enabled: !!householdId,
  })

  const transactionsQuery = useQuery({
    queryKey: ["calendar", "transactions", householdId],
    queryFn: async () => {
      if (!householdId) return []
      const supabase = createClient()
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("household_id", householdId)
        .is("deleted_at", null)
        .gte("date", todayStr)
        .eq("paid", false)
        .order("date", { ascending: true })
      if (error) throw error
      return data
    },
    enabled: !!householdId,
  })

  const allEvents = useMemo((): CalendarEvent[] => {
    const events: CalendarEvent[] = []

    for (const o of (obligationsQuery.data ?? [])) {
      if (!o.due_date) continue
      const remaining = o.total_amount - (o.paid_amount ?? 0)
      events.push({
        id: `obl-${o.id}`,
        title: o.description || "Obligación de pago",
        date: o.due_date,
        module: "finance",
        description: `Restan ${formatMoney(remaining)}${o.person_name ? ` · ${o.person_name}` : ""}`,
        route: "/finance",
      })
    }

    for (const tx of (transactionsQuery.data ?? [])) {
      if (!tx.date) continue
      const desc = tx.description || "Transacción pendiente"
      events.push({
        id: `tx-${tx.id}`,
        title: desc,
        date: tx.date,
        module: "finance",
        description: `${tx.type === "income" ? "Ingreso" : "Gasto"} · ${formatMoney(tx.amount)}`,
        route: "/finance",
      })
    }

    for (const s of (subscriptionsQuery.data ?? [])) {
      if (!s.renewal_date) continue
      events.push({
        id: `sub-${s.id}`,
        title: `${s.name} se renueva`,
        date: s.renewal_date,
        module: "entertainment",
        description: `Renovación de ${s.name} · ${formatMoney(s.monthly_price ?? s.price ?? 0)}`,
        route: "/entertainment/subscriptions",
      })
    }

    for (const item of (inventoryQuery.data ?? [])) {
      if (!item.warranty_expires_at) continue
      events.push({
        id: `inv-${item.id}`,
        title: `Garantía de ${item.name}`,
        date: item.warranty_expires_at,
        module: "inventory",
        description: item.brand ? `Marca: ${item.brand}` : "Vence la garantía",
        route: "/shopping/products",
      })
    }

    for (const doc of (documentsQuery.data ?? [])) {
      if (!doc.expires_at) continue
      events.push({
        id: `doc-${doc.id}`,
        title: doc.name,
        date: doc.expires_at,
        module: "documents",
        description: doc.kind ? `Tipo: ${doc.kind}` : "Documento próximo a vencer",
        route: "/documents",
      })
    }

    for (const r of (remindersQuery.data ?? [])) {
      const mod = mapEntityTypeToModule(r.entity_type)
      events.push({
        id: `rem-${r.id}`,
        title: r.title,
        date: r.due_at,
        module: mod,
        description: "Recordatorio",
        route: moduleConfig[mod].route,
      })
    }

    return events
  }, [
    obligationsQuery.data,
    transactionsQuery.data,
    subscriptionsQuery.data,
    inventoryQuery.data,
    documentsQuery.data,
    remindersQuery.data,
  ])

  const eventsInRange = useMemo(() => {
    return allEvents
      .filter(e => e.date >= todayStr && e.date <= thirtyDaysStr)
      .filter(e => moduleFilter === "all" || e.module === moduleFilter)
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [allEvents, todayStr, thirtyDaysStr, moduleFilter])

  const allEventsInRange = useMemo(() => {
    return allEvents
      .filter(e => e.date >= todayStr && e.date <= thirtyDaysStr)
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [allEvents, todayStr, thirtyDaysStr])

  const groupedByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>()
    eventsInRange.forEach(e => {
      if (!map.has(e.date)) map.set(e.date, [])
      map.get(e.date)!.push(e)
    })
    return map
  }, [eventsInRange])

  const weekDays = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]

  const monthDays = useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startPadding = firstDay.getDay()
    const daysInMonth = lastDay.getDate()

    const days: { day: number; date: string; events: CalendarEvent[] }[] = []

    for (let i = 0; i < startPadding; i++) {
      days.push({ day: 0, date: "", events: [] })
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`
      const events = allEventsInRange.filter(e => {
        const ed = new Date(e.date + "T00:00:00")
        return ed.getFullYear() === year && ed.getMonth() === month && ed.getDate() === d
      })
      days.push({ day: d, date: dateStr, events })
    }

    return days
  }, [currentMonth, allEventsInRange])

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  const counts = useMemo(() => {
    const byModule: Record<string, number> = {}
    allEventsInRange.forEach(e => {
      byModule[e.module] = (byModule[e.module] || 0) + 1
    })
    return byModule
  }, [allEventsInRange])

  const handleEventClick = (event: CalendarEvent) => {
    router.push(event.route)
  }

  const isLoading =
    obligationsQuery.isLoading ||
    subscriptionsQuery.isLoading ||
    inventoryQuery.isLoading ||
    documentsQuery.isLoading ||
    remindersQuery.isLoading ||
    transactionsQuery.isLoading

  const borderLeftColor = (module: ModuleSource) => {
    if (module === "finance") return "#16a34a"
    if (module === "entertainment") return "#2563eb"
    if (module === "inventory") return "#ea580c"
    return "#7c3aed"
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Calendario</h1>
          <p className="text-muted-foreground text-sm mt-1">Vista unificada de próximos eventos en todas las áreas</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
          >
            Lista
          </Button>
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("grid")}
          >
            Mes
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
          {Object.entries(counts)
            .sort(([, a], [, b]) => b - a)
            .map(([module, count]) => {
              const cfg = moduleConfig[module as ModuleSource]
              if (!cfg) return null
              return (
                <Card
                  key={module}
                  className={cn(
                    "cursor-pointer transition-shadow hover:shadow-md",
                    moduleFilter === module && "ring-2 ring-primary"
                  )}
                  onClick={() => setModuleFilter(moduleFilter === module ? "all" : module)}
                >
                  <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-xs font-medium text-muted-foreground">{cfg.label}</CardTitle>
                    <div className={cn("h-7 w-7 rounded-full flex items-center justify-center", cfg.badgeClass)}>
                      <cfg.icon className="h-3.5 w-3.5" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold">{count}</div>
                    <p className="text-xs text-muted-foreground mt-0.5">Próximos 30 días</p>
                  </CardContent>
                </Card>
              )
            })}
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <Select value={moduleFilter} onValueChange={(v) => setModuleFilter(v ?? "all")}>
          <SelectTrigger className="w-40 h-9 text-xs">
            <SelectValue placeholder="Filtrar módulo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {Object.entries(moduleConfig).map(([key, cfg]) => (
              <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-32 text-center">
            {currentMonth.toLocaleDateString("es-DO", { month: "long", year: "numeric" })}
          </span>
          <Button variant="outline" size="sm" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="pt-6">
            <LoadingSkeleton rows={8} />
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-7 gap-px bg-muted rounded-lg overflow-hidden">
              {weekDays.map((day) => (
                <div key={day} className="bg-card p-2 text-center text-xs font-medium text-muted-foreground">
                  {day}
                </div>
              ))}
              {monthDays.map((d, i) => {
                const isToday = d.date === todayStr
                return (
                  <div
                    key={i}
                    className={cn(
                      "bg-card p-1.5 min-h-[64px] text-xs",
                      !d.day && "opacity-30",
                      d.date < todayStr && "opacity-40"
                    )}
                  >
                    {d.day > 0 && (
                      <>
                        <span className={cn(
                          "inline-flex items-center justify-center h-5 w-5 rounded-full text-xs",
                          isToday && "bg-primary text-primary-foreground font-bold"
                        )}>
                          {d.day}
                        </span>
                        <div className="mt-0.5 space-y-0.5">
                          {d.events.slice(0, 2).map((evt) => {
                            const cfg = moduleConfig[evt.module]
                            return (
                              <div
                                key={evt.id}
                                className={cn("h-1.5 w-full rounded-full", cfg.badgeClass)}
                                title={evt.title}
                              />
                            )
                          })}
                          {d.events.length > 2 && (
                            <span className="text-[10px] text-muted-foreground">+{d.events.length - 2}</span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {eventsInRange.length === 0 ? (
            <EmptyState
              icon={CalendarIcon}
              title="Sin eventos"
              description="No hay eventos programados para los próximos 30 días con los filtros actuales"
            />
          ) : (
            Array.from(groupedByDate.entries()).map(([date, events]) => {
              const isToday = date === todayStr
              const dateObj = new Date(date + "T00:00:00")
              const dayLabel = dateObj.toLocaleDateString("es-DO", { weekday: "long", month: "long", day: "numeric" })

              return (
                <div key={date}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className={cn(
                      "h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold",
                      isToday
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}>
                      {dateObj.getDate()}
                    </div>
                    <span className={cn("text-sm capitalize", isToday && "font-semibold")}>
                      {dayLabel}
                    </span>
                    {isToday && <Badge variant="default" className="text-[10px]">Hoy</Badge>}
                  </div>
                  <div className="grid gap-2 pl-10">
                    {events.map((event) => {
                      const cfg = moduleConfig[event.module]
                      return (
                        <Card
                          key={event.id}
                          className="hover:shadow-md transition-shadow cursor-pointer border-l-4"
                          style={{ borderLeftColor: borderLeftColor(event.module) }}
                          onClick={() => handleEventClick(event)}
                        >
                          <CardContent className="flex items-center justify-between py-3 px-4">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={cn("h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0", cfg.badgeClass)}>
                                <cfg.icon className="h-4 w-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate">{event.title}</p>
                                {event.description && (
                                  <p className="text-xs text-muted-foreground truncate">{event.description}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                              <Badge variant="outline" className={cn("text-[10px]", cfg.badgeClass)}>
                                {cfg.label}
                              </Badge>
                              <ArrowRight className="h-4 w-4 text-muted-foreground" />
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      <Card className="bg-muted/30 border-dashed">
        <CardContent className="flex items-center justify-between py-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Próximos 30 días ({formatShortDate(now)} — {formatShortDate(thirtyDaysFromNow)})</span>
          </div>
          <Badge variant="outline" className="text-xs">
            {eventsInRange.length} eventos
          </Badge>
        </CardContent>
      </Card>
    </div>
  )
}
