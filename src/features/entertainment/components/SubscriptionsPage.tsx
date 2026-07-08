"use client"

import { useState } from "react"
import { Search, Plus, Tv, Music, Gamepad2, CreditCard, RefreshCw } from "lucide-react"
import { StatCard } from "@/components/data/StatCard"
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { EmptyState } from "@/components/data/EmptyState"
import { LoadingSkeleton } from "@/components/data/LoadingSkeleton"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useHousehold } from "@/lib/use-household"
import {
  useSubscriptions,
  useCreateSubscription,
  useUpdateSubscription,
  useDeleteSubscription,
  useGenerateSubscriptionTransaction,
} from "../queries"
import { useAccounts } from "@/features/finance/queries"
import { formatMoney, formatShortDate, cn } from "@/lib/utils"

const kindFilters = ["all", "streaming", "gaming", "software"] as const
const statusFilters = ["all", "active", "paused", "cancelled"] as const

const kindIcons: Record<string, typeof Tv> = {
  streaming: Tv,
  gaming: Gamepad2,
  software: Music,
}

const kindLabels: Record<string, string> = {
  streaming: "Streaming",
  gaming: "Gaming",
  software: "Software",
}

const statusLabels: Record<string, string> = {
  active: "Activa",
  paused: "Pausada",
  cancelled: "Cancelada",
}

const billingCycleLabels: Record<string, string> = {
  monthly: "Mensual",
  quarterly: "Trimestral",
  annual: "Anual",
}

const emptyForm = {
  name: "",
  kind: "streaming" as const,
  monthly_price: 0,
  billing_cycle: "monthly" as const,
  renewal_date: "",
  account_id: "",
  username: "",
  status: "active" as const,
}

export function SubscriptionsPage() {
  const { householdId, isLoading: householdLoading } = useHousehold()
  const { data: subscriptions = [], isLoading: dataLoading } = useSubscriptions(householdId || null)
  const { data: accounts = [] } = useAccounts(householdId || null)
  const createSub = useCreateSubscription()
  const updateSub = useUpdateSubscription()
  const deleteSub = useDeleteSubscription()
  const generateTx = useGenerateSubscriptionTransaction()

  const [search, setSearch] = useState("")
  const [kindFilter, setKindFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [openForm, setOpenForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)

  const loading = householdLoading || dataLoading

  const filtered = subscriptions.filter((s: any) => {
    if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false
    if (kindFilter !== "all" && s.kind !== kindFilter) return false
    if (statusFilter !== "all" && s.status !== statusFilter) return false
    return true
  })

  const activeSubs = subscriptions.filter((s: any) => s.status === "active")
  const totalMonthly = activeSubs.reduce((sum: number, s: any) => sum + Number(s.monthly_price || 0), 0)

  const now = new Date()
  const thirtyDaysFromNow = new Date()
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
  const upcomingCount = subscriptions.filter((s: any) => {
    if (!s.renewal_date) return false
    const renewal = new Date(s.renewal_date)
    return renewal >= now && renewal <= thirtyDaysFromNow
  }).length

  const statusBadgeClass = (status: string) => {
    if (status === "active") return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
    if (status === "paused") return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
    return "bg-muted text-muted-foreground"
  }

  const openCreate = () => {
    setForm(emptyForm)
    setEditingId(null)
    setOpenForm(true)
  }

  const openEdit = (sub: any) => {
    setForm({
      name: sub.name || "",
      kind: sub.kind || "streaming",
      monthly_price: Number(sub.monthly_price || 0),
      billing_cycle: sub.billing_cycle || "monthly",
      renewal_date: sub.renewal_date || "",
      account_id: sub.account_id || "",
      username: sub.username || "",
      status: sub.status || "active",
    })
    setEditingId(sub.id)
    setOpenForm(true)
  }

  const handleSave = () => {
    if (editingId) {
      updateSub.mutate({ id: editingId, data: form }, { onSuccess: () => setOpenForm(false) })
    } else {
      createSub.mutate(form, { onSuccess: () => setOpenForm(false) })
    }
  }

  const handleDelete = () => {
    if (editingId) {
      deleteSub.mutate(editingId, { onSuccess: () => setOpenForm(false) })
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Suscripciones</h1>
          <p className="text-muted-foreground text-sm mt-1">Gestiona tus servicios de streaming, gaming y software</p>
        </div>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
          <LoadingSkeleton rows={2} />
          <LoadingSkeleton rows={2} />
          <LoadingSkeleton rows={2} />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Suscripciones</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gestiona tus servicios de streaming, gaming y software
          </p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1" /> Agregar suscripción
        </Button>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <StatCard
          title="Costo mensual total"
          value={formatMoney(totalMonthly)}
          subtitle={`${activeSubs.length} activas`}
          icon={CreditCard}
        />
        <StatCard
          title="Suscripciones activas"
          value={String(activeSubs.length)}
          subtitle={`de ${subscriptions.length} totales`}
          icon={Tv}
        />
        <StatCard
          title="Próximas renovaciones"
          value={String(upcomingCount)}
          subtitle="En los próximos 30 días"
          icon={CreditCard}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={kindFilter} onValueChange={(v) => setKindFilter(v ?? "all")}>
          <SelectTrigger className="w-[140px] h-9 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {kindFilters.map((k) => (
              <SelectItem key={k} value={k}>
                {k === "all" ? "Todos" : kindLabels[k]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
          <SelectTrigger className="w-[140px] h-9 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statusFilters.map((s) => (
              <SelectItem key={s} value={s}>
                {s === "all" ? "Todos" : statusLabels[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {subscriptions.length === 0 && !loading ? (
        <EmptyState
          icon={Tv}
          title="Sin suscripciones"
          description="Agrega tus servicios de streaming, gaming y software"
          actionLabel="Agregar suscripción"
          onAction={openCreate}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Tv}
          title="Sin resultados"
          description="No se encontraron suscripciones con los filtros actuales"
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((sub: any) => {
            const Icon = kindIcons[sub.kind] || Tv
            return (
              <Card
                key={sub.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => openEdit(sub)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <Badge className={cn("text-[10px]", statusBadgeClass(sub.status))}>
                      {statusLabels[sub.status] || sub.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="font-semibold">{sub.name}</p>
                  {sub.username && (
                    <p className="text-xs text-muted-foreground mt-0.5">{sub.username}</p>
                  )}
                  <p className="text-lg font-bold mt-2 text-emerald-600">
                    {formatMoney(sub.monthly_price)}
                    <span className="text-xs font-normal text-muted-foreground ml-1">
                      /{billingCycleLabels[sub.billing_cycle] || "Mes"}
                    </span>
                  </p>
                </CardContent>
                <CardFooter className="flex-col items-start gap-2">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground w-full">
                    <span>{kindLabels[sub.kind] || sub.kind}</span>
                    <span className="truncate">
                      {accounts.find((a: any) => a.id === sub.account_id)?.name ?? "Sin cuenta"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs text-muted-foreground">
                      Renovación: {formatShortDate(sub.renewal_date)}
                    </span>
                    {sub.status !== "cancelled" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        disabled={generateTx.isPending}
                        onClick={(e) => {
                          e.stopPropagation()
                          generateTx.mutate(sub.id)
                        }}
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        {generateTx.isPending ? "..." : "Generar cobro"}
                      </Button>
                    )}
                  </div>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={openForm} onOpenChange={setOpenForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar suscripción" : "Nueva suscripción"}</DialogTitle>
            <DialogDescription>Agrega un servicio de streaming, gaming o software</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="space-y-1">
              <Label>Nombre</Label>
              <Input
                placeholder="Ej: Netflix"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>Tipo</Label>
              <Select value={form.kind} onValueChange={(v) => setForm({ ...form, kind: v as any })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="streaming">Streaming</SelectItem>
                  <SelectItem value="gaming">Gaming</SelectItem>
                  <SelectItem value="software">Software</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Precio mensual</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={form.monthly_price || ""}
                  onChange={(e) => setForm({ ...form, monthly_price: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-1">
                <Label>Ciclo</Label>
                <Select value={form.billing_cycle} onValueChange={(v) => setForm({ ...form, billing_cycle: v as any })}>
                  <SelectTrigger><SelectValue placeholder="Mensual" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Mensual</SelectItem>
                    <SelectItem value="quarterly">Trimestral</SelectItem>
                    <SelectItem value="annual">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Fecha de renovación</Label>
              <Input
                type="date"
                value={form.renewal_date}
                onChange={(e) => setForm({ ...form, renewal_date: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>Cuenta</Label>
              <Select
                value={form.account_id}
                onValueChange={(v) => { if (v) setForm({ ...form, account_id: v }) }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cuenta">
                    {form.account_id && accounts.find((a: any) => a.id === form.account_id)?.name}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((a: any) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name} ({a.currency})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Usuario / Email</Label>
              <Input
                placeholder="Opcional"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter className="flex justify-between">
            <div>
              {editingId && (
                <Button variant="destructive" size="sm" onClick={handleDelete}>
                  Cancelar suscripción
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setOpenForm(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={createSub.isPending || updateSub.isPending}>
                {createSub.isPending || updateSub.isPending ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
