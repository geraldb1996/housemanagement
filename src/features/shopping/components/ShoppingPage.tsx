"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { EmptyState } from "@/components/data/EmptyState"
import { LoadingSkeleton } from "@/components/data/LoadingSkeleton"
import { StatCard } from "@/components/data/StatCard"
import {
  Plus,
  ShoppingCart,
  Search,
  Check,
  Clock,
  Trash2,
  ArrowRightLeft,
  PackageOpen,
  ChevronDown,
  ChevronUp,
  Loader2,
  Pencil,
  Eye,
} from "lucide-react"
import { formatMoney, formatShortDate, cn } from "@/lib/utils"
import { useHousehold } from "@/lib/use-household"
import { CATEGORY_LABELS, type ShoppingCategory } from "../schemas"
import { useShoppingLists, useCreateShoppingList, useUpdateShoppingList, useUpdateItem, useDeleteItem, useDeleteShoppingList } from "../queries"
import { useProducts } from "../queries"

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline"; icon: typeof Clock }> = {
  open: { label: "Pendiente", variant: "outline", icon: Clock },
  shopping: { label: "Comprando", variant: "default", icon: ShoppingCart },
  completed: { label: "Completada", variant: "secondary", icon: Check },
}

const kindConfig: Record<string, { label: string; variant: "default" | "outline" }> = {
  grocery: { label: "Supermercado", variant: "outline" },
  custom: { label: "Personalizada", variant: "default" },
}

export function ShoppingPage() {
  const router = useRouter()
  const { householdId, isLoading: householdLoading } = useHousehold()
  const { data: lists = [], isLoading, error } = useShoppingLists(householdId || null)
  const { data: products = [] } = useProducts(householdId || null)
  const createList = useCreateShoppingList()
  const updateItem = useUpdateItem()
  const deleteItem = useDeleteItem()
  const deleteList = useDeleteShoppingList()
  const updateList = useUpdateShoppingList()

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [openForm, setOpenForm] = useState(false)
  const [editingListId, setEditingListId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newName, setNewName] = useState("")
  const [newKind, setNewKind] = useState<"grocery" | "custom">("grocery")
  const [newStore, setNewStore] = useState("")
  const [newItems, setNewItems] = useState<
    { name: string; quantity: number; unit: string; category: ShoppingCategory; estimated_price: number }[]
  >([{ name: "", quantity: 1, unit: "unidad", category: "otros", estimated_price: 0 }])

  const [suggestionsFor, setSuggestionsFor] = useState<number | null>(null)

  const filtered = useMemo(() => {
    return lists.filter((l: any) => {
      if (search && !l.name.toLowerCase().includes(search.toLowerCase()) && !(l.store ?? "").toLowerCase().includes(search.toLowerCase())) return false
      if (statusFilter !== "all" && l.status !== statusFilter) return false
      return true
    })
  }, [lists, search, statusFilter])

  const activeLists = lists.filter((l: any) => l.status !== "completed").length
  const pendingItems = lists.reduce((sum: number, l: any) => sum + (l.items ?? []).filter((i: any) => !i.purchased).length, 0)
  const estimatedTotal = lists.reduce((sum: number, l: any) => sum + (l.total_estimated ?? 0), 0)

  const togglePurchased = (itemId: string, purchased: boolean, estimated_price: number) => {
    updateItem.mutate({
      id: itemId,
      data: { purchased: !purchased },
    })
  }

  const handleDeleteItem = (itemId: string) => {
    deleteItem.mutate(itemId)
  }

  const addItemField = () => {
    setNewItems((prev) => [...prev, { name: "", quantity: 1, unit: "unidad", category: "otros", estimated_price: 0 }])
  }

  const removeItemField = (idx: number) => {
    if (newItems.length <= 1) return
    setNewItems((prev) => prev.filter((_, i) => i !== idx))
  }

  const updateItemField = (idx: number, field: string, value: string | number) => {
    setNewItems((prev) => prev.map((it, i) => (i === idx ? { ...it, [field]: value } : it)))
  }

  const handleSaveList = async () => {
    if (!newName.trim() || isSubmitting) return
    setIsSubmitting(true)
    try {
      if (editingListId) {
        await updateList.mutateAsync({
          id: editingListId,
          data: { name: newName, kind: newKind, store: newStore || "" },
        })
      } else {
        const validItems = newItems.filter((it) => it.name.trim())
        await createList.mutateAsync({
          name: newName,
          kind: newKind,
          status: "open",
          store: newStore,
          items: validItems.map((it) => ({
            id: crypto.randomUUID(),
            name: it.name,
            quantity: it.quantity,
            unit: it.unit,
            category: it.category,
            purchased: false,
            estimated_price: it.estimated_price,
          })),
        })
      }
      setOpenForm(false)
      resetForm()
    } catch (e) {
      // error handled by mutation onError
    } finally {
      setIsSubmitting(false)
    }
  }

  const openEdit = (list: any) => {
    setEditingListId(list.id)
    setNewName(list.name)
    setNewKind(list.kind)
    setNewStore(list.store ?? "")
    setOpenForm(true)
  }

  const openCreate = () => {
    setEditingListId(null)
    resetForm()
    setOpenForm(true)
  }

  const resetForm = () => {
    setEditingListId(null)
    setNewName("")
    setNewKind("grocery")
    setNewStore("")
    setNewItems([{ name: "", quantity: 1, unit: "unidad", category: "otros", estimated_price: 0 }])
  }

  const loading = householdLoading || isLoading

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Listas de compras</h1>
          <p className="text-muted-foreground text-sm mt-1">Planifica y gestiona tus listas de compras</p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1" /> Nueva lista
        </Button>
        <Dialog open={openForm} onOpenChange={setOpenForm}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingListId ? "Editar lista" : "Nueva lista de compras"}</DialogTitle>
              <DialogDescription>
                {editingListId ? "Actualiza los datos de la lista" : "Crea una lista con los artículos que necesitas comprar"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2 max-h-[60vh] overflow-y-auto pr-1">
              <div className="grid gap-2">
                <Label htmlFor="list-name">Nombre de la lista</Label>
                <Input
                  id="list-name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ej: Compra semanal"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label>Tipo</Label>
                  <Select value={newKind} onValueChange={(v) => v && setNewKind(v as "grocery" | "custom")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="grocery">Supermercado</SelectItem>
                      <SelectItem value="custom">Personalizada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="list-store">Tienda</Label>
                  <Input
                    id="list-store"
                    value={newStore}
                    onChange={(e) => setNewStore(e.target.value)}
                    placeholder="Ej: Nacional"
                  />
                </div>
              </div>
              {!editingListId && (
                <div className="border-t pt-3">
                  <div className="flex items-center justify-between mb-3">
                  <Label className="text-sm font-medium">Artículos</Label>
                  <Button variant="outline" size="sm" onClick={addItemField}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> Agregar
                  </Button>
                </div>
                <div className="grid gap-3">
                  {newItems.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-start p-3 rounded-lg border bg-muted/30">
                      <div className="col-span-4 relative">
                        <Input
                          placeholder="Nombre"
                          value={item.name}
                          onFocus={() => setSuggestionsFor(idx)}
                          onBlur={() => setTimeout(() => setSuggestionsFor(null), 150)}
                          onChange={(e) => {
                            updateItemField(idx, "name", e.target.value)
                            if (e.target.value.trim()) setSuggestionsFor(idx)
                          }}
                        />
                        {suggestionsFor === idx && item.name.trim() && (() => {
                          const matches = (products as any[]).filter((p: any) =>
                            p.name.toLowerCase().includes(item.name.toLowerCase())
                          ).slice(0, 5)
                          if (matches.length === 0) return null
                          return (
                            <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-popover border rounded-md shadow-md max-h-40 overflow-y-auto">
                              {matches.map((p: any) => (
                                <button
                                  key={p.id}
                                  type="button"
                                  className="w-full text-left px-3 py-2 text-xs hover:bg-accent flex items-center justify-between gap-2"
                                  onMouseDown={() => {
                                    updateItemField(idx, "name", p.name)
                                    updateItemField(idx, "category", p.category)
                                    updateItemField(idx, "unit", p.unit ?? "unidad")
                                    updateItemField(idx, "estimated_price", Number(p.last_price ?? 0))
                                    setSuggestionsFor(null)
                                  }}
                                >
                                  <span className="truncate font-medium">{p.name}</span>
                                  <span className="text-muted-foreground shrink-0">{formatMoney(p.last_price, "NIO")}</span>
                                </button>
                              ))}
                            </div>
                          )
                        })()}
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          min={1}
                          placeholder="Cant"
                          value={item.quantity}
                          onChange={(e) => updateItemField(idx, "quantity", Number(e.target.value) || 1)}
                        />
                      </div>
                      <div className="col-span-2">
                        <Select value={item.unit} onValueChange={(v) => v && updateItemField(idx, "unit", v)}>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unidad">unidad</SelectItem>
                            <SelectItem value="lb">lb</SelectItem>
                            <SelectItem value="galón">galón</SelectItem>
                            <SelectItem value="paquete">paquete</SelectItem>
                            <SelectItem value="botella">botella</SelectItem>
                            <SelectItem value="caja">caja</SelectItem>
                            <SelectItem value="bolsa">bolsa</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          min={0}
                          placeholder="Precio"
                          value={item.estimated_price || ""}
                          onChange={(e) => updateItemField(idx, "estimated_price", Number(e.target.value) || 0)}
                        />
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          className="text-muted-foreground hover:text-destructive mt-0.5"
                          onClick={() => removeItemField(idx)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <div className="col-span-3">
                        <Select value={item.category} onValueChange={(v) => v && updateItemField(idx, "category", v)}>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(Object.entries(CATEGORY_LABELS) as [ShoppingCategory, string][]).map(([key, label]) => (
                              <SelectItem key={key} value={key}>{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenForm(false)}>Cancelar</Button>
              <Button onClick={handleSaveList} disabled={!newName.trim() || isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : editingListId ? null : <Plus className="h-4 w-4 mr-1" />}
                {editingListId ? "Actualizar" : "Crear lista"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatCard title="Listas activas" value={String(activeLists)} icon={ShoppingCart} />
        <StatCard title="Items pendientes" value={String(pendingItems)} icon={PackageOpen} />
        <StatCard title="Gasto estimado" value={formatMoney(estimatedTotal)} icon={ArrowRightLeft} />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar lista o tienda..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Filtrar estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="open">Pendientes</SelectItem>
            <SelectItem value="shopping">Comprando</SelectItem>
            <SelectItem value="completed">Completadas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="grid gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <LoadingSkeleton rows={2} />
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : error ? (
        <EmptyState
          icon={ShoppingCart}
          title="Error al cargar listas"
          description="Ocurrió un error al obtener las listas de compras"
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title="No hay listas de compras"
          description="Crea tu primera lista para empezar a organizar tus compras"
          actionLabel="Nueva lista"
          onAction={openCreate}
        />
      ) : (
        <div className="grid gap-3">
          {filtered.map((list: any) => {
            const s = statusConfig[list.status] ?? statusConfig.open
            const k = kindConfig[list.kind] ?? kindConfig.grocery
            const isExpanded = expandedId === list.id
            const items = list.items ?? []
            const purchasedCount = items.filter((i: any) => i.purchased).length

            return (
              <Card key={list.id} className={cn("transition-all", list.status === "completed" && "opacity-70")}>
                <CardHeader className="cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : list.id)}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className="text-base">{list.name}</CardTitle>
                        <Badge variant={k.variant}>{k.label}</Badge>
                        <Badge variant={s.variant}>
                          <s.icon className="h-3 w-3 mr-1" />
                          {s.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                        <span>{list.store}</span>
                        <span>{items.length} artículos</span>
                        <span className="font-medium text-foreground">Est: {formatMoney(list.total_estimated ?? 0)}</span>
                        {list.actual_cost != null && (
                          <>
                            <span className="font-medium text-foreground">
                              Real: {formatMoney(list.actual_cost)}
                            </span>
                            <span className={cn(
                              "font-medium",
                              Number(list.actual_cost) > (list.total_estimated ?? 0)
                                ? "text-red-500"
                                : Number(list.actual_cost) < (list.total_estimated ?? 0)
                                  ? "text-emerald-500"
                                  : "text-muted-foreground"
                            )}>
                              {Number(list.actual_cost) > (list.total_estimated ?? 0) ? "+" : ""}
                              {formatMoney(Number(list.actual_cost) - (list.total_estimated ?? 0))}
                            </span>
                          </>
                        )}
                        <span>{formatShortDate(list.created_at)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {list.status === "completed" && (
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push("/finance")
                          }}
                        >
                          <ArrowRightLeft className="h-3 w-3 mr-1" />
                          Convertir
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/shopping/lists/${list.id}`)
                        }}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteList.mutate(list.id)
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={(e) => {
                          e.stopPropagation()
                          openEdit(list)
                        }}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                  {items.length > 0 && (
                    <div className="w-full bg-muted rounded-full h-1.5 mt-3">
                      <div
                        className="bg-emerald-500 h-1.5 rounded-full transition-all"
                        style={{ width: `${(purchasedCount / items.length) * 100}%` }}
                      />
                    </div>
                  )}
                </CardHeader>
                {isExpanded && (
                  <CardContent>
                    <div className="border-t pt-3">
                      {items.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">No hay artículos en esta lista</p>
                      ) : (
                        <div className="grid gap-1.5">
                          {items.map((item: any) => (
                            <div
                              key={item.id}
                              className={cn(
                                "flex items-center gap-3 rounded-lg p-2.5 transition-colors hover:bg-muted/50",
                                item.purchased && "opacity-60"
                              )}
                            >
                              <button
                                onClick={() => togglePurchased(item.id, item.purchased, item.estimated_price)}
                                className={cn(
                                  "h-5 w-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors",
                                  item.purchased
                                    ? "bg-emerald-500 border-emerald-500 text-white"
                                    : "border-muted-foreground/30 hover:border-emerald-500"
                                )}
                              >
                                {item.purchased && <Check className="h-3.5 w-3.5" />}
                              </button>
                              <div className="flex-1 min-w-0">
                                <span className={cn("text-sm font-medium", item.purchased && "line-through")}>
                                  {item.name}
                                </span>
                              </div>
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {item.quantity} × {item.unit}
                              </span>
                              <Badge variant="outline" className="text-[10px]">
                                {CATEGORY_LABELS[item.category as ShoppingCategory] ?? item.category}
                              </Badge>
                              <span className="text-sm font-medium whitespace-nowrap min-w-20 text-right">
                                {formatMoney(item.estimated_price ?? 0)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
