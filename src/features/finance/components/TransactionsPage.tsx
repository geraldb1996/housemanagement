"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
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
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { EmptyState } from "@/components/data/EmptyState"
import { LoadingSkeleton } from "@/components/data/LoadingSkeleton"
import {
  Plus,
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  BadgeDollarSign,
  Download,
  Receipt,
  Trash2,
  ArrowLeftRight,
} from "lucide-react"
import { formatMoney, formatShortDate, cn, downloadExcelFromJson } from "@/lib/utils"
import { convertAmount } from "@/lib/exchange-rates"
import { useHousehold } from "@/lib/use-household"
import {
  useTransactions,
  useCreateTransaction,
  useUpdateTransaction,
  useDeleteTransaction,
  useAccounts,
  useCategories,
  useObligations,
} from "@/features/finance/queries"
import { useCreateObligationPaymentWithTransaction } from "@/features/finance/queries"
import { useExchangeRates } from "@/features/settings/queries"
import type { TransactionForm } from "@/features/finance/schemas"

const typeIcons = { income: TrendingUp, expense: TrendingDown, transfer: BadgeDollarSign }
const typeStyles = {
  income: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600",
  expense: "bg-red-100 dark:bg-red-900/30 text-red-600",
  transfer: "bg-blue-100 dark:bg-blue-900/30 text-blue-600",
}

const emptyForm: TransactionForm = {
  account_id: "",
  category_id: null,
  type: "expense",
  amount: 0,
  date: new Date().toISOString().split("T")[0],
  paid: false,
  description: "",
  notes: "",
  destination_account_id: null,
  exchange_rate: null,
  currency: null,
}

export function TransactionsPage() {
  const router = useRouter()
  const { householdId, isLoading: householdLoading } = useHousehold()

  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [paidFilter, setPaidFilter] = useState("all")
  const [openForm, setOpenForm] = useState(false)
  const [form, setForm] = useState<TransactionForm>(emptyForm)

  const {
    data: transactions,
    isLoading: txLoading,
    error: txError,
  } = useTransactions(householdId || null, {
    type: typeFilter !== "all" ? typeFilter : undefined,
    paid: paidFilter !== "all" ? paidFilter : undefined,
    search: search || undefined,
  })

  const { data: accounts, isLoading: accountsLoading } = useAccounts(householdId || null)
  const { data: categories, isLoading: categoriesLoading } = useCategories(householdId || null)
  const { data: obligations } = useObligations(householdId || null)
  const { data: exchangeRates } = useExchangeRates(householdId || null)

  const createTx = useCreateTransaction()
  const updateTx = useUpdateTransaction()
  const deleteTx = useDeleteTransaction()
  const createLinkedObligation = useCreateObligationPaymentWithTransaction()

  const [obligationId, setObligationId] = useState<string | null>(null)

  const isLoading = householdLoading || txLoading

  function setField<K extends keyof TransactionForm>(key: K, value: TransactionForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleCreate(e: FormEvent) {
    e.preventDefault()
    if (obligationId) {
      createLinkedObligation.mutate({
        obligation_id: obligationId,
        amount: form.amount,
        paid_date: form.date,
        account_id: form.account_id,
        currency: form.currency ?? undefined,
      }, {
        onSuccess: () => {
          setOpenForm(false)
          setForm(emptyForm)
          setObligationId(null)
        },
      })
    } else {
      createTx.mutate(form, {
        onSuccess: () => {
          setOpenForm(false)
          setForm(emptyForm)
        },
      })
    }
  }

  function handleTogglePaid(id: string, current: boolean) {
    updateTx.mutate({ id, data: { paid: !current } })
  }

  function handleDelete(id: string) {
    deleteTx.mutate(id)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Transacciones</h1>
          <p className="text-muted-foreground text-sm mt-1">Gestiona tus ingresos, gastos y transferencias</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              downloadExcelFromJson(
                (transactions ?? []).map((tx) => ({
                  Descripción: tx.description,
                  Tipo: tx.type,
                  Monto: tx.amount,
                  Categoría: (tx as any).category_name ?? "",
                  Cuenta: (tx as any).account_name ?? "",
                  Fecha: tx.date,
                  Pagado: tx.paid ? "Sí" : "No",
                })),
                "transacciones"
              )
            }
            disabled={!transactions?.length}
          >
            <Download className="h-4 w-4 mr-1" /> Exportar
          </Button>
          <Dialog open={openForm} onOpenChange={setOpenForm}>
            <DialogTrigger render={<Button size="sm" />}>
              <Plus className="h-4 w-4 mr-1" /> Nueva
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <form onSubmit={handleCreate}>
                <DialogHeader>
                  <DialogTitle>Nueva transacci&oacute;n</DialogTitle>
                  <DialogDescription>Registra un ingreso, gasto o transferencia</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-2">
                  <div className="grid grid-cols-3 gap-2">
                    {(["income", "expense", "transfer"] as const).map((t) => {
                      const Icon = typeIcons[t]
                      const labels: Record<string, string> = {
                        income: "Ingreso",
                        expense: "Gasto",
                        transfer: "Transferencia",
                      }
                      return (
                        <Button
                          key={t}
                          type="button"
                          variant="outline"
                          className={`h-auto py-4 flex-col gap-1 ${form.type === t ? "bg-muted/50 ring-2 ring-primary" : ""}`}
                          size="sm"
                          onClick={() => setField("type", t)}
                        >
                          <Icon className={`h-4 w-4 ${t === "income" ? "text-emerald-600" : t === "expense" ? "text-red-600" : "text-blue-600"}`} />
                          <span className="text-xs">{labels[t]}</span>
                        </Button>
                      )
                    })}
                  </div>
                  {form.type !== "transfer" && (obligations ?? []).filter(o => o.status !== "settled").length > 0 && (
                    <div className="space-y-1 rounded-lg border p-3">
                      <Label>Obligaci&oacute;n (opcional)</Label>
                      <Select
                        value={obligationId ?? "none"}
                        onValueChange={(v) => {
                          if (v === "none") {
                            setObligationId(null)
                            return
                          }
                          setObligationId(v)
                          const obl = obligations?.find((o) => o.id === v)
                          if (obl) {
                            const remaining = Number(obl.total_amount) - Number(obl.paid_amount)
                            setField("amount", remaining)
                            setField("description", obl.description)
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar obligación">
                            {obligationId && obligations?.find((o) => o.id === obligationId) && (() => {
                              const obl = obligations.find((o) => o.id === obligationId)!
                              const remaining = Number(obl.total_amount) - Number(obl.paid_amount)
                              return `${obl.person_name ?? "Sin persona"} · ${obl.description} (${formatMoney(remaining, "NIO")})`
                            })()}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Ninguna</SelectItem>
                          {(obligations ?? [])
                            .filter((o) => o.status !== "settled")
                            .map((o) => {
                              const remaining = Number(o.total_amount) - Number(o.paid_amount)
                              return (
                                <SelectItem key={o.id} value={o.id}>
                                  {o.person_name ?? "Sin persona"} · {o.description} ({formatMoney(remaining, "NIO")})
                                </SelectItem>
                              )
                            })}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="space-y-1">
                    <Label>Descripci&oacute;n</Label>
                    <Input
                      placeholder="Ej: Supermercado"
                      value={form.description ?? ""}
                      onChange={(e) => setField("description", e.target.value || null)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Monto</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={form.amount || ""}
                        onChange={(e) => setField("amount", parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Fecha</Label>
                      <Input
                        type="date"
                        value={form.date}
                        onChange={(e) => setField("date", e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Cuenta</Label>
                      <Select value={form.account_id || "none"} onValueChange={(v) => setField("account_id", v === "none" ? "" : (v ?? ""))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar">
                            {form.account_id && accounts?.find((a) => a.id === form.account_id)?.name}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none" disabled>Seleccionar cuenta</SelectItem>
                          {accountsLoading ? (
                            <SelectItem value="loading" disabled>Cargando...</SelectItem>
                          ) : (
                            accounts?.map((a) => (
                              <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label>Categor&iacute;a</Label>
                      <Select
                        value={form.category_id ?? "none"}
                        onValueChange={(v) => setField("category_id", v === "none" ? null : v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar">
                            {form.category_id && categories?.find((c) => c.id === form.category_id)?.name}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Ninguna</SelectItem>
                          {categoriesLoading ? (
                            <SelectItem value="loading" disabled>Cargando...</SelectItem>
                          ) : (
                            categories?.map((c) => (
                              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {form.type === "transfer" && (
                    <div className="space-y-3 rounded-lg border p-3">
                      <div className="space-y-1">
                        <Label>Cuenta destino</Label>
                        <Select
                          value={form.destination_account_id ?? "none"}
                          onValueChange={(v) => {
                            const destId = v === "none" ? null : v
                            setField("destination_account_id", destId)
                            const srcAccount = accounts?.find((a) => a.id === form.account_id)
                            const dstAccount = accounts?.find((a) => a.id === v)
                            if (srcAccount && dstAccount && form.amount > 0) {
                              const baseCurrency = "NIO"
                              const rates = exchangeRates ?? []
                              const converted = convertAmount(form.amount, srcAccount.currency, dstAccount.currency, rates, baseCurrency)
                              if (converted !== null) {
                                const rate = form.amount > 0 ? converted / form.amount : 0
                                setField("exchange_rate", rate)
                              } else {
                                setField("exchange_rate", null)
                              }
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar cuenta destino">
                              {(() => {
                                const a = accounts?.find((a) => a.id === form.destination_account_id)
                                return a ? `${a.name} (${a.currency})` : null
                              })()}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none" disabled>Seleccionar cuenta</SelectItem>
                            {accountsLoading ? (
                              <SelectItem value="loading" disabled>Cargando...</SelectItem>
                            ) : (
                              accounts
                                ?.filter((a) => a.id !== form.account_id)
                                .map((a) => (
                                  <SelectItem key={a.id} value={a.id}>
                                    {a.name} ({a.currency})
                                  </SelectItem>
                                ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      {form.account_id && form.destination_account_id && form.amount > 0 && exchangeRates && (() => {
                        const src = accounts?.find((a) => a.id === form.account_id)
                        const dst = accounts?.find((a) => a.id === form.destination_account_id)
                        if (!src || !dst || src.currency === dst.currency) return null
                        const converted = convertAmount(form.amount, src.currency, dst.currency, exchangeRates, "NIO")
                        return (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                            <ArrowLeftRight className="h-3.5 w-3.5 flex-shrink-0" />
                            {converted !== null ? (
                              <span>
                                {formatMoney(form.amount, src.currency)} →{" "}
                                <strong className="text-foreground">{formatMoney(converted, dst.currency)}</strong>
                                {" "}(1 {src.currency} = {form.exchange_rate?.toFixed(4)} {dst.currency})
                              </span>
                            ) : (
                              <span className="text-destructive">
                                No hay tasa de cambio para {src.currency} → {dst.currency}. Configurala en Ajustes → Moneda.
                              </span>
                            )}
                          </div>
                        )
                      })()}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Switch
                      id="paid"
                      checked={form.paid}
                      onCheckedChange={(v) => setField("paid", v)}
                    />
                    <Label htmlFor="paid">Marcar como pagado</Label>
                  </div>
                  <div className="space-y-1">
                    <Label>Notas</Label>
                    <Textarea
                      placeholder="Notas opcionales..."
                      rows={2}
                      value={form.notes ?? ""}
                      onChange={(e) => setField("notes", e.target.value || null)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setOpenForm(false)
                      setForm(emptyForm)
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createTx.isPending || createLinkedObligation.isPending || !form.account_id || !form.amount}>
                    {createTx.isPending || createLinkedObligation.isPending ? "Guardando..." : "Guardar"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por descripción o categoría..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v ?? "all")}>
            <SelectTrigger className="w-[130px] h-9 text-xs">
              <Filter className="h-3 w-3 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="income">Ingresos</SelectItem>
              <SelectItem value="expense">Gastos</SelectItem>
              <SelectItem value="transfer">Transferencias</SelectItem>
            </SelectContent>
          </Select>
          <Select value={paidFilter} onValueChange={(v) => setPaidFilter(v ?? "all")}>
            <SelectTrigger className="w-[130px] h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="paid">Pagado</SelectItem>
              <SelectItem value="pending">Pendiente</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">
            {transactions?.length ?? 0} transacción{transactions?.length !== 1 ? "es" : ""}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <LoadingSkeleton rows={6} className="p-4" />
          ) : txError ? (
            <EmptyState
              icon={Receipt}
              title="Error al cargar"
              description="No se pudieron cargar las transacciones. Intenta recargar la página."
            />
          ) : !transactions?.length ? (
            <EmptyState
              icon={Receipt}
              title="Sin transacciones"
              description={search || typeFilter !== "all" ? "Intenta con otros filtros" : "Agrega tu primera transacción"}
              actionLabel={!search && typeFilter === "all" ? "Nueva transacción" : undefined}
              onAction={() => setOpenForm(true)}
            />
          ) : (
            <div className="divide-y">
              {transactions.map((tx) => {
                const Icon = typeIcons[tx.type]
                return (
                  <div
                    key={tx.id}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors group"
                  >
                    <div className={cn("h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0", typeStyles[tx.type])}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{tx.description || "Sin descripción"}</p>
                        <button
                          type="button"
                          onClick={() => handleTogglePaid(tx.id, tx.paid)}
                          className="cursor-pointer"
                        >
                          {!tx.paid ? (
                            <Badge variant="outline" className="text-[10px] h-4 px-1 text-orange-500 border-orange-200 bg-orange-50">
                              pendiente
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] h-4 px-1 text-emerald-500 border-emerald-200 bg-emerald-50">
                              pagado
                            </Badge>
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {(tx as any).account_name ?? "Sin cuenta"} · {(tx as any).category_name ?? "Sin categoría"} · {formatShortDate(tx.date)}
                      </p>
                    </div>
                    <span className={cn(
                      "text-sm font-semibold flex-shrink-0",
                      tx.type === "income" ? "text-emerald-600" : tx.type === "expense" ? "text-red-600" : "text-blue-600"
                    )}>
                      {tx.type === "income" ? "+" : tx.type === "expense" ? "-" : ""}
                      {formatMoney(tx.amount, "NIO")}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDelete(tx.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
