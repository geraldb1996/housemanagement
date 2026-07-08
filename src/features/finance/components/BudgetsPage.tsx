"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { StatCard } from "@/components/data/StatCard"
import { EmptyState } from "@/components/data/EmptyState"
import { LoadingSkeleton } from "@/components/data/LoadingSkeleton"
import {
  Plus,
  TrendingDown,
  TrendingUp,
  Target,
  Search,
  PiggyBank,
  Trash2,
  RefreshCw,
  Calendar,
} from "lucide-react"
import { formatMoney, cn } from "@/lib/utils"
import { useHousehold } from "@/lib/use-household"
import { useBudgets, useCreateBudget } from "@/features/finance/queries"
import { useCategories } from "@/features/finance/queries"
import type { BudgetLineForm } from "@/features/finance/schemas"

type BudgetLineDraft = {
  category_id: string
  planned_amount: number
}

const RECURRENCE_LABELS: Record<string, string> = {
  biweekly: "Quincenal",
  monthly: "Mensual",
}

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = Math.min(Math.round((value / Math.max(max, 1)) * 100), 100)
  const isOver = value > max

  return (
    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
      <div
        className={cn(
          "h-full rounded-full transition-all duration-300",
          isOver ? "bg-red-500" : pct > 80 ? "bg-amber-500" : "bg-emerald-500"
        )}
        style={{ width: `${Math.min(pct, 100)}%` }}
      />
    </div>
  )
}

export function BudgetsPage() {
  const { householdId } = useHousehold()
  const { data: budgets = [], isLoading } = useBudgets(householdId || null)
  const { data: categories = [] } = useCategories(householdId || null)
  const createBudget = useCreateBudget()

  const [search, setSearch] = useState("")
  const [openForm, setOpenForm] = useState(false)

  const [formName, setFormName] = useState("")
  const [formMonth, setFormMonth] = useState("")
  const [formRecurrence, setFormRecurrence] = useState<"biweekly" | "monthly" | null>(null)
  const [formIsGeneral, setFormIsGeneral] = useState(false)
  const [formTotalAmount, setFormTotalAmount] = useState("")
  const [formLines, setFormLines] = useState<BudgetLineDraft[]>([
    { category_id: "", planned_amount: 0 },
  ])

  const expenseCategories = useMemo(
    () => categories.filter((c) => c.kind === "expense"),
    [categories]
  )

  const totalPlanned = useMemo(() => {
    return budgets.reduce((sum, b) => {
      if (b.is_general && b.total_amount) return sum + b.total_amount
      return sum + (b.budget_lines?.reduce((s, l) => s + l.planned_amount, 0) ?? 0)
    }, 0)
  }, [budgets])

  const handleAddLine = () => {
    setFormLines([...formLines, { category_id: "", planned_amount: 0 }])
  }

  const handleRemoveLine = (index: number) => {
    if (formLines.length <= 1) return
    setFormLines(formLines.filter((_, i) => i !== index))
  }

  const handleLineChange = (
    index: number,
    field: keyof BudgetLineDraft,
    value: string | number | null
  ) => {
    setFormLines((prev) =>
      prev.map((line, i) =>
        i === index ? { ...line, [field]: value } : line
      )
    )
  }

  const handleSubmit = () => {
    const data = {
      name: formName,
      period_month: formMonth,
      scope: "household" as const,
      recurrence: formRecurrence,
      recurrence_start: formRecurrence ? formMonth : null,
      is_general: formIsGeneral,
      total_amount: formIsGeneral ? parseFloat(formTotalAmount) || 0 : null,
    }
    const lines = formIsGeneral
      ? []
      : formLines
          .filter((l) => l.category_id && l.planned_amount > 0)
          .map((l) => ({
            category_id: l.category_id,
            planned_amount: l.planned_amount,
          }))
    if (!data.name || !data.period_month) return
    if (!formIsGeneral && lines.length === 0) return
    createBudget.mutate(
      { data, lines: lines as BudgetLineForm[] },
      {
        onSuccess: () => {
          setOpenForm(false)
          setFormName("")
          setFormMonth("")
          setFormRecurrence(null)
          setFormIsGeneral(false)
          setFormTotalAmount("")
          setFormLines([{ category_id: "", planned_amount: 0 }])
        },
      }
    )
  }

  const openDialog = () => {
    setFormName("")
    setFormMonth("")
    setFormRecurrence(null)
    setFormIsGeneral(false)
    setFormTotalAmount("")
    setFormLines([{ category_id: "", planned_amount: 0 }])
    setOpenForm(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Presupuestos</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Planifica y controla tus gastos
          </p>
        </div>
        <Dialog open={openForm} onOpenChange={setOpenForm}>
          <DialogTrigger
            render={<Button size="sm" onClick={openDialog} />}
          >
            <Plus className="h-4 w-4 mr-1" /> Nuevo presupuesto
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nuevo presupuesto</DialogTitle>
              <DialogDescription>
                Crea un presupuesto único o recurrente
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="space-y-1">
                <Label htmlFor="budget-name">Nombre</Label>
                <Input
                  id="budget-name"
                  placeholder="Ej: Presupuesto quincenal"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="budget-month">Inicio</Label>
                <Input
                  id="budget-month"
                  type="date"
                  value={formMonth}
                  onChange={(e) => setFormMonth(e.target.value)}
                />
              </div>

              <div className="space-y-2 rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">Presupuesto general (sobre total)</Label>
                  <Switch
                    checked={formIsGeneral}
                    onCheckedChange={(v) => {
                      setFormIsGeneral(v)
                      if (v) setFormLines([{ category_id: "", planned_amount: 0 }])
                    }}
                  />
                </div>
                {formIsGeneral ? (
                  <div className="space-y-1">
                    <Label className="text-xs">Monto total</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formTotalAmount}
                      onChange={(e) => setFormTotalAmount(e.target.value)}
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium">Categorías</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleAddLine}
                      >
                        <Plus className="h-3 w-3 mr-1" /> Agregar
                      </Button>
                    </div>
                    {formLines.map((line, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Select
                          value={line.category_id}
                          onValueChange={(v) => handleLineChange(i, "category_id", v ?? "")}
                        >
                          <SelectTrigger className="flex-1 h-9 text-xs">
                            <SelectValue placeholder="Categoría" />
                          </SelectTrigger>
                          <SelectContent>
                            {expenseCategories.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          className="w-28 h-9 text-xs"
                          value={line.planned_amount === 0 ? "" : line.planned_amount}
                          onChange={(e) =>
                            handleLineChange(i, "planned_amount", parseFloat(e.target.value) || 0)
                          }
                        />
                        {formLines.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 shrink-0"
                            onClick={() => handleRemoveLine(i)}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <Label>Repetición</Label>
                <Select
                  value={formRecurrence ?? "none"}
                  onValueChange={(v) => {
                    if (v === "biweekly" || v === "monthly") setFormRecurrence(v)
                    else setFormRecurrence(null)
                  }}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Una sola vez</SelectItem>
                    <SelectItem value="biweekly">Quincenal</SelectItem>
                    <SelectItem value="monthly">Mensual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenForm(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={createBudget.isPending}>
                {createBudget.isPending ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard title="Planificado" value={formatMoney(totalPlanned, "NIO")} icon={Target} />
        <StatCard title="Ejecutado" value={formatMoney(0, "NIO")} icon={TrendingDown} trend="down" />
        <StatCard title="Restante" value={formatMoney(totalPlanned, "NIO")} icon={TrendingUp} trend="up" />
        <StatCard title="Presupuestos" value={String(budgets.length)} icon={PiggyBank} />
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar..."
          className="pl-8"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <LoadingSkeleton rows={3} />
      ) : budgets.length === 0 ? (
        <EmptyState
          icon={PiggyBank}
          title="Sin presupuestos"
          description="Crea tu primer presupuesto para empezar a planificar"
          actionLabel="Nuevo presupuesto"
          onAction={openDialog}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {budgets.map((budget) => {
            const lines = budget.budget_lines ?? []
            const filtered = lines.filter(
              (l) =>
                !search ||
                (l.category?.name ?? "").toLowerCase().includes(search.toLowerCase())
            )
            const budgetTotal = budget.is_general && budget.total_amount
              ? budget.total_amount
              : lines.reduce((s, l) => s + l.planned_amount, 0)

            return (
              <Card key={budget.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{budget.name}</CardTitle>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      {budget.period_month}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    {budget.recurrence && (
                      <Badge variant="outline" className="text-[10px] h-4 px-1 gap-1">
                        <RefreshCw className="h-2.5 w-2.5" />
                        {RECURRENCE_LABELS[budget.recurrence] ?? budget.recurrence}
                      </Badge>
                    )}
                    {budget.is_general && (
                      <Badge variant="outline" className="text-[10px] h-4 px-1 bg-primary/10 text-primary border-primary/20">
                        General
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Planificado</span>
                    <span className="font-semibold">{formatMoney(budgetTotal, "NIO")}</span>
                  </div>
                  <ProgressBar value={0} max={budgetTotal} />

                  {!budget.is_general && filtered.length > 0 && (
                    <div className="space-y-2 pt-2">
                      {filtered.map((line) => {
                        const catName = line.category?.name ?? "Sin categoría"
                        return (
                          <div key={line.id} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-medium">{catName}</span>
                              <span className="tabular-nums text-muted-foreground">
                                {formatMoney(line.planned_amount, "NIO")}
                              </span>
                            </div>
                            <ProgressBar value={0} max={line.planned_amount} />
                          </div>
                        )
                      })}
                    </div>
                  )}
                  {!budget.is_general && filtered.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-2">
                      Sin resultados para esta búsqueda
                    </p>
                  )}
                  {budget.is_general && (
                    <p className="text-xs text-muted-foreground text-center py-1">
                      Presupuesto general — aplica a todas las categorías
                    </p>
                  )}
                </CardContent>
                <CardFooter>
                  <Button variant="ghost" size="sm" className="w-full text-xs">
                    Ver detalle
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
