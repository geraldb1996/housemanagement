"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatCard } from "@/components/data/StatCard"
import { EmptyState } from "@/components/data/EmptyState"
import { LoadingSkeleton } from "@/components/data/LoadingSkeleton"
import {
  Plus,
  Search,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Wallet,
  RefreshCw,
} from "lucide-react"
import { formatMoney, formatShortDate, cn } from "@/lib/utils"
import { useHousehold } from "@/lib/use-household"
import { useObligations, useCreateObligation, useAddObligationPayment } from "@/features/finance/queries"
import { useCreateObligationPaymentWithTransaction } from "@/features/finance/queries"
import { useApplyBatchPayment } from "@/features/finance/queries"
import { useAccounts } from "@/features/finance/queries"
import { usePeople } from "@/features/finance/queries"

const statusLabels: Record<string, string> = {
  open: "Pendiente",
  partially_paid: "Parcial",
  settled: "Liquidado",
}

const statusStyles: Record<string, string> = {
  open: "bg-red-100 dark:bg-red-900/30 text-red-600 border-red-200 dark:border-red-800",
  partially_paid: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 border-amber-200 dark:border-amber-800",
  settled: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 border-emerald-200 dark:border-emerald-800",
}

function formatCsvDate(date: string) {
  const [y, m, d] = date.split("-")
  return `${d}/${m}/${y}`
}

export function ObligationsPage() {
  const { householdId } = useHousehold()
  const { data: obligations, isLoading, isError, error } = useObligations(householdId)
  const { data: people } = usePeople(householdId)
  const { data: accounts } = useAccounts(householdId)
  const createObligation = useCreateObligation()
  const addPayment = useAddObligationPayment()
  const createLinkedPayment = useCreateObligationPaymentWithTransaction()
  const applyBatchPayment = useApplyBatchPayment()

  const [search, setSearch] = useState("")
  const [directionFilter, setDirectionFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [personFilter, setPersonFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("")
  const [openForm, setOpenForm] = useState(false)
  const [paymentForm, setPaymentForm] = useState<string | null>(null)

  const [formDirection, setFormDirection] = useState<"owed_to_us" | "owed_by_us">("owed_to_us")
  const [formPersonId, setFormPersonId] = useState("")
  const [formDescription, setFormDescription] = useState("")
  const [formAmount, setFormAmount] = useState("")
  const [formDueDate, setFormDueDate] = useState("")

  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0])
  const [paymentAccountId, setPaymentAccountId] = useState("")

  const [batchOpen, setBatchOpen] = useState(false)
  const [batchAmount, setBatchAmount] = useState("")
  const [batchAccountId, setBatchAccountId] = useState("")

  const list = obligations ?? []

  const filtered = useMemo(() => {
    return list.filter((o) => {
      const q = search.toLowerCase()
      const personName = o.person_name ?? ""
      if (
        q &&
        !o.description.toLowerCase().includes(q) &&
        !personName.toLowerCase().includes(q)
      )
        return false
      if (directionFilter !== "all" && o.direction !== directionFilter) return false
      if (statusFilter !== "all" && o.status !== statusFilter) return false
      if (personFilter !== "all" && o.person_id !== personFilter) return false
      if (dateFilter && o.due_date !== dateFilter) return false
      return true
    })
  }, [list, search, directionFilter, statusFilter, personFilter, dateFilter])

  const stats = useMemo(() => {
    const owedToUs = filtered
      .filter((o) => o.direction === "owed_to_us")
      .reduce((sum, o) => sum + (Number(o.total_amount) - Number(o.paid_amount)), 0)
    const weOwe = filtered
      .filter((o) => o.direction === "owed_by_us")
      .reduce((sum, o) => sum + (Number(o.total_amount) - Number(o.paid_amount)), 0)
    const net = owedToUs - weOwe
    return { owedToUs, weOwe, net }
  }, [filtered])

  const pendingCount = filtered.filter(
    (o) => o.status === "open" || o.status === "partially_paid"
  ).length

  const batchObligations = useMemo(() => {
    if (personFilter === "all" || !dateFilter) return []
    return list
      .filter((o) => o.person_id === personFilter && o.due_date === dateFilter)
      .filter((o) => o.status === "open" || o.status === "partially_paid")
      .sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
  }, [list, personFilter, dateFilter])

  const batchAllocations = useMemo(() => {
    const amount = parseFloat(batchAmount)
    if (!amount || isNaN(amount) || batchObligations.length === 0) return []
    let remaining = amount
    return batchObligations
      .map((o) => {
        const oblRemaining =
          Number(o.total_amount) - Number(o.paid_amount)
        const allocation = Math.min(oblRemaining, remaining)
        remaining = Math.round((remaining - allocation) * 100) / 100
        return {
          ...o,
          allocation,
          isSettled:
            Number(o.paid_amount) + allocation >= Number(o.total_amount),
        }
      })
      .filter((a) => a.allocation > 0)
  }, [batchObligations, batchAmount])

  const batchTotalRemaining = useMemo(() => {
    return batchObligations.reduce(
      (sum, o) => sum + Number(o.total_amount) - Number(o.paid_amount),
      0
    )
  }, [batchObligations])

  function openBatchDialog() {
    setBatchAmount("")
    setBatchAccountId("")
    setBatchOpen(true)
  }

  function handleBatchPayment() {
    const amount = parseFloat(batchAmount)
    if (!amount || isNaN(amount) || amount <= 0) return
    if (personFilter === "all" || !dateFilter) return

    applyBatchPayment.mutate(
      {
        person_id: personFilter,
        paid_date: dateFilter,
        total_amount: amount,
        account_id: batchAccountId || undefined,
        currency: accounts?.find((a) => a.id === batchAccountId)?.currency ?? undefined,
      },
      {
        onSuccess: () => {
          setBatchOpen(false)
          setBatchAmount("")
          setBatchAccountId("")
        },
      }
    )
  }

  function handleCreateObligation() {
    createObligation.mutate({
      direction: formDirection,
      person_id: formPersonId,
      description: formDescription,
      total_amount: Number(formAmount),
      due_date: formDueDate || undefined,
    }, {
      onSuccess: () => {
        setOpenForm(false)
        setFormDirection("owed_to_us")
        setFormPersonId("")
        setFormDescription("")
        setFormAmount("")
        setFormDueDate("")
      },
    })
  }

  function handleAddPayment(obligationId: string) {
    if (paymentAccountId) {
      createLinkedPayment.mutate({
        obligation_id: obligationId,
        amount: Number(paymentAmount),
        paid_date: paymentDate,
        account_id: paymentAccountId,
        currency: accounts?.find((a) => a.id === paymentAccountId)?.currency ?? undefined,
      }, {
        onSuccess: () => {
          setPaymentForm(null)
          setPaymentAmount("")
          setPaymentDate(new Date().toISOString().split("T")[0])
          setPaymentAccountId("")
        },
      })
    } else {
      addPayment.mutate({
        obligation_id: obligationId,
        amount: Number(paymentAmount),
        paid_date: paymentDate,
      }, {
        onSuccess: () => {
          setPaymentForm(null)
          setPaymentAmount("")
          setPaymentDate(new Date().toISOString().split("T")[0])
        },
      })
    }
  }

  function openCreateDialog() {
    setFormDirection("owed_to_us")
    setFormPersonId("")
    setFormDescription("")
    setFormAmount("")
    setFormDueDate("")
    setOpenForm(true)
  }

  function openPaymentDialog(obligationId: string) {
    const obl = list.find(o => o.id === obligationId)
    const remaining = obl ? Number(obl.total_amount) - Number(obl.paid_amount) : 0
    setPaymentAmount(String(remaining))
    setPaymentDate(new Date().toISOString().split("T")[0])
    setPaymentAccountId("")
    setPaymentForm(obligationId)
  }

  function openRenewDialog(obligationId: string) {
    const obl = list.find(o => o.id === obligationId)
    if (!obl) return
    setFormDirection(obl.direction as "owed_to_us" | "owed_by_us")
    setFormPersonId(obl.person_id ?? "")
    setFormDescription(obl.description)
    setFormAmount(String(obl.total_amount))
    setFormDueDate("")
    setOpenForm(true)
  }

  const exportCsv = () => {
    const rows = filtered.map((o) => ({
      "Persona": o.person_name ?? "",
      "Descripción": o.description,
      "Dirección": o.direction === "owed_to_us" ? "Nos deben" : "Debemos",
      "Monto total": String(o.total_amount),
      "Pagado": String(o.paid_amount),
      "Pendiente": String(Number(o.total_amount) - Number(o.paid_amount)),
      "Vencimiento": o.due_date ? formatCsvDate(o.due_date) : "",
      "Estado": statusLabels[o.status] ?? o.status,
      "Notas": "",
    }))
    const header = Object.keys(rows[0] ?? {}).join(",")
    const body = rows
      .map((r) =>
        Object.values(r)
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n")
    const csv = "\uFEFF" + [header, body].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "obligaciones.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Obligaciones</h1>
            <p className="text-muted-foreground text-sm mt-1">Deudas por cobrar y por pagar</p>
          </div>
        </div>
        <LoadingSkeleton rows={4} />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Obligaciones</h1>
        <EmptyState icon={Wallet} title="Error al cargar" description={error?.message ?? "Intenta de nuevo"} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Obligaciones</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Deudas por cobrar y por pagar
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <ArrowDownRight className="h-4 w-4 mr-1" /> Exportar
          </Button>
          {personFilter !== "all" && dateFilter && batchObligations.length > 0 && (
            <Button size="sm" variant="secondary" onClick={openBatchDialog}>
              <Wallet className="h-4 w-4 mr-1" /> Registrar abono
            </Button>
          )}
          <Button size="sm" onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-1" /> Nueva
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          title="Nos deben"
          value={formatMoney(stats.owedToUs, "NIO")}
          icon={ArrowUpRight}
          trend="up"
        />
        <StatCard
          title="Debemos"
          value={formatMoney(stats.weOwe, "NIO")}
          icon={ArrowDownRight}
          trend="down"
        />
        <StatCard
          title="Posición neta"
          value={formatMoney(stats.net, "NIO")}
          subtitle={pendingCount > 0 ? `${pendingCount} obligaciones activas` : "Todo al día"}
          icon={Wallet}
          trend={stats.net >= 0 ? "neutral" : "down"}
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por persona o descripción..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Select value={directionFilter} onValueChange={(v) => setDirectionFilter(v ?? "all")}>
            <SelectTrigger className="w-[130px] h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="owed_to_us">Nos deben</SelectItem>
              <SelectItem value="owed_by_us">Debemos</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
            <SelectTrigger className="w-[120px] h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="open">Pendientes</SelectItem>
              <SelectItem value="partially_paid">Parciales</SelectItem>
              <SelectItem value="settled">Liquidados</SelectItem>
            </SelectContent>
          </Select>
          <Select value={personFilter} onValueChange={(v) => setPersonFilter(v ?? "all")}>
            <SelectTrigger className="w-[140px] h-9 text-xs">
              <SelectValue placeholder="Persona">
                {personFilter !== "all" && people?.find((p) => p.id === personFilter)?.name}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las personas</SelectItem>
              {(people ?? []).map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="relative">
            <Input
              type="date"
              className="h-9 w-[140px] text-xs"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              placeholder="Vencimiento"
            />
            {dateFilter && (
              <button
                className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs px-1"
                onClick={() => setDateFilter("")}
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {filtered.length === 0 ? (
          <div className="sm:col-span-2">
            <EmptyState
              icon={Wallet}
              title="Sin obligaciones"
              description={
                search || directionFilter !== "all" || statusFilter !== "all"
                  ? "Intenta con otros filtros"
                  : "Agrega tu primera obligación"
              }
              actionLabel={
                !search && directionFilter === "all" && statusFilter === "all"
                  ? "Nueva obligación"
                  : undefined
              }
              onAction={openCreateDialog}
            />
          </div>
        ) : (
          filtered.map((o) => {
            const total = Number(o.total_amount)
            const paid = Number(o.paid_amount)
            const remaining = total - paid
            const progress = total > 0 ? (paid / total) * 100 : 0
            const isOverdue =
              o.status !== "settled" &&
              o.due_date &&
              new Date(o.due_date) < new Date()

            return (
              <Card
                key={o.id}
                className={cn(
                  isOverdue && "border-red-300 dark:border-red-800"
                )}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={cn(
                          "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0",
                          o.direction === "owed_to_us"
                            ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600"
                            : "bg-red-100 dark:bg-red-900/30 text-red-600"
                        )}
                      >
                        {o.direction === "owed_to_us" ? (
                          <ArrowUpRight className="h-4 w-4" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-sm truncate">
                            {o.description}
                          </CardTitle>
                          {isOverdue && (
                            <AlertTriangle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {o.person_name ?? ""}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] h-5 px-1.5 flex-shrink-0",
                        statusStyles[o.status]
                      )}
                    >
                      {statusLabels[o.status] ?? o.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {formatMoney(paid, "NIO")} de{" "}
                        {formatMoney(total, "NIO")}
                      </span>
                      <span
                        className={cn(
                          "font-semibold",
                          o.direction === "owed_to_us"
                            ? "text-emerald-600"
                            : "text-red-600"
                        )}
                      >
                        {o.direction === "owed_to_us" ? "+" : "-"}
                        {formatMoney(remaining, "NIO")}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          progress >= 100
                            ? "bg-emerald-500"
                            : o.direction === "owed_to_us"
                              ? "bg-emerald-500"
                              : "bg-red-500"
                        )}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {o.due_date && (
                        <span
                          className={cn(
                            "text-xs",
                            isOverdue
                              ? "text-red-600 font-medium"
                              : "text-muted-foreground"
                          )}
                        >
                          {isOverdue ? "Vencía" : "Vence"}:{" "}
                          {formatShortDate(o.due_date)}
                        </span>
                      )}
                    </div>
                    {o.status !== "settled" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => openPaymentDialog(o.id)}
                      >
                        <Plus className="h-3 w-3 mr-1" /> Abonar
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => openRenewDialog(o.id)}
                      >
                        <RefreshCw className="h-3 w-3 mr-1" /> Renovar
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      <Dialog open={openForm} onOpenChange={setOpenForm}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nueva obligación</DialogTitle>
            <DialogDescription>
              Registra una deuda por cobrar o por pagar
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-1">
              <Label>Dirección</Label>
              <Select value={formDirection} onValueChange={(v) => { if (v) setFormDirection(v as "owed_to_us" | "owed_by_us") }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="owed_to_us">
                    <ArrowUpRight className="h-3.5 w-3.5 inline mr-1.5 text-emerald-600" />
                    Nos deben
                  </SelectItem>
                  <SelectItem value="owed_by_us">
                    <ArrowDownRight className="h-3.5 w-3.5 inline mr-1.5 text-red-600" />
                    Debemos
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Persona o entidad</Label>
              <Select value={formPersonId} onValueChange={(v) => { if (v) setFormPersonId(v) }}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar persona">
                    {formPersonId && people?.find((p) => p.id === formPersonId)?.name}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {(people ?? []).map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Descripción</Label>
              <Input placeholder="Ej: Préstamo personal" value={formDescription} onChange={e => setFormDescription(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Monto total</Label>
                <Input type="number" step="0.01" placeholder="0.00" value={formAmount} onChange={e => setFormAmount(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Fecha de vencimiento</Label>
                <div className="flex gap-2">
                  <Input type="date" value={formDueDate} onChange={e => setFormDueDate(e.target.value)} className="flex-1" />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 text-xs shrink-0"
                    onClick={() => {
                      const d = new Date()
                      d.setMonth(d.getMonth() + 1)
                      setFormDueDate(d.toISOString().split("T")[0])
                    }}
                  >
                    +1 mes
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenForm(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateObligation} disabled={createObligation.isPending || !formDescription.trim() || !formPersonId || !formAmount}>
              {createObligation.isPending ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!paymentForm} onOpenChange={(open) => { if (!open) setPaymentForm(null) }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Registrar pago</DialogTitle>
            <DialogDescription>
              {(() => {
                const obl = list.find(o => o.id === paymentForm)
                if (!obl) return ""
                return `${obl.description} · ${obl.person_name ?? ""}`
              })()}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Pendiente
              </span>
              <span className="font-semibold">
                {(() => {
                  const obl = list.find(o => o.id === paymentForm)
                  if (!obl) return formatMoney(0, "NIO")
                  return formatMoney(Number(obl.total_amount) - Number(obl.paid_amount), "NIO")
                })()}
              </span>
            </div>
            <div className="space-y-1">
              <Label>Monto del pago</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={paymentAmount}
                onChange={e => setPaymentAmount(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Fecha del pago</Label>
              <Input
                type="date"
                value={paymentDate}
                onChange={e => setPaymentDate(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Cuenta (opcional)</Label>
              <Select value={paymentAccountId || "none"} onValueChange={(v) => setPaymentAccountId(v === "none" ? "" : (v ?? ""))}>
                <SelectTrigger>
                  <SelectValue placeholder="Sin cuenta (solo abono)">
                    {paymentAccountId && accounts?.find((a) => a.id === paymentAccountId)?.name}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin cuenta — solo registrar abono</SelectItem>
                  {(accounts ?? []).map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.name} ({a.currency})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPaymentForm(null)}
            >
              Cancelar
            </Button>
            <Button onClick={() => paymentForm && handleAddPayment(paymentForm)} disabled={addPayment.isPending || createLinkedPayment.isPending || !paymentAmount}>
              {addPayment.isPending || createLinkedPayment.isPending ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={batchOpen} onOpenChange={setBatchOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Registrar abono</DialogTitle>
            <DialogDescription>
              El abono se distribuye automáticamente de la obligación más antigua a la más nueva
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Persona</Label>
                <p className="text-sm font-medium">
                  {people?.find((p) => p.id === personFilter)?.name ?? ""}
                </p>
              </div>
              <div className="space-y-1">
                <Label>Fecha</Label>
                <p className="text-sm font-medium">
                  {dateFilter ? formatShortDate(dateFilter) : ""}
                </p>
              </div>
            </div>

            <div className="space-y-1">
              <Label>Obligaciones a cubrir</Label>
              <div className="border rounded-md divide-y max-h-40 overflow-y-auto">
                {batchObligations.map((o) => {
                  const remaining = Number(o.total_amount) - Number(o.paid_amount)
                  return (
                    <div key={o.id} className="flex items-center justify-between px-3 py-2 text-xs gap-2">
                      <span className="truncate">{o.description}</span>
                      <span className="text-muted-foreground whitespace-nowrap">
                        Pendiente: {formatMoney(remaining, "NIO")}
                      </span>
                    </div>
                  )
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                Total pendiente: {formatMoney(batchTotalRemaining, "NIO")}
              </p>
            </div>

            <div className="space-y-1">
              <Label>Monto del abono</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={batchAmount}
                onChange={(e) => setBatchAmount(e.target.value)}
              />
              <p className="text-[10px] text-muted-foreground">
                Sugerido: {formatMoney(batchTotalRemaining, "NIO")} (total pendiente)
              </p>
            </div>

            <div className="space-y-1">
              <Label>Cuenta (opcional)</Label>
              <Select
                value={batchAccountId || "none"}
                onValueChange={(v) =>
                  setBatchAccountId(v === "none" ? "" : v ?? "")
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sin cuenta (solo abono)">
                    {batchAccountId &&
                      accounts?.find((a) => a.id === batchAccountId)?.name}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    Sin cuenta — solo registrar abono
                  </SelectItem>
                  {(accounts ?? []).map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name} ({a.currency})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {batchAllocations.length > 0 && (
              <div className="space-y-1">
                <Label>Distribución del abono</Label>
                <div className="border rounded-md divide-y max-h-44 overflow-y-auto">
                  {batchAllocations.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center justify-between px-3 py-2 text-xs gap-2"
                    >
                      <div className="min-w-0">
                        <span className="truncate block">{a.description}</span>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] h-4 px-1 mt-0.5",
                            a.isSettled
                              ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 border-emerald-200 dark:border-emerald-800"
                              : "bg-amber-100 dark:bg-amber-900/30 text-amber-600 border-amber-200 dark:border-amber-800"
                          )}
                        >
                          {a.isSettled ? "Liquidado" : "Parcial"}
                        </Badge>
                      </div>
                      <span className="text-muted-foreground whitespace-nowrap font-medium">
                        {formatMoney(a.allocation, "NIO")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBatchOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleBatchPayment}
              disabled={
                applyBatchPayment.isPending ||
                !batchAmount ||
                parseFloat(batchAmount) <= 0
              }
            >
              {applyBatchPayment.isPending ? "Aplicando..." : "Aplicar abono"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
