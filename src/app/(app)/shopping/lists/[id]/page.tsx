"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { EmptyState } from "@/components/data/EmptyState"
import { LoadingSkeleton } from "@/components/data/LoadingSkeleton"
import {
  ArrowLeft,
  ShoppingCart,
  Check,
  Clock,
  Trash2,
  Plus,
  Pencil,
  Loader2,
  Save,
  X,
  DollarSign,
} from "lucide-react"
import { formatMoney, cn } from "@/lib/utils"
import { useHousehold } from "@/lib/use-household"
import { CATEGORY_LABELS, type ShoppingCategory } from "@/features/shopping/schemas"
import {
  useShoppingList,
  useShoppingLists,
  useUpdateShoppingList,
  useAddItem,
  useUpdateItem,
  useDeleteItem,
  useProducts,
} from "@/features/shopping/queries"
import { useConvertListToTransactions } from "@/features/shopping/queries"

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline"; icon: typeof Clock }> = {
  open: { label: "Pendiente", variant: "outline", icon: Clock },
  shopping: { label: "Comprando", variant: "default", icon: ShoppingCart },
  completed: { label: "Completada", variant: "secondary", icon: Check },
}

const kindConfig: Record<string, { label: string; variant: "default" | "outline" }> = {
  grocery: { label: "Supermercado", variant: "outline" },
  custom: { label: "Personalizada", variant: "default" },
}

export default function ListDetailPage() {
  const params = useParams()
  const router = useRouter()
  const listId = params.id as string

  const { householdId, isLoading: hhLoading } = useHousehold()
  const { data: list, isLoading, error } = useShoppingList(listId)
  const { data: products = [] } = useProducts(householdId || null)
  const updateList = useUpdateShoppingList()
  const addItem = useAddItem()
  const updateItem = useUpdateItem()
  const deleteItem = useDeleteItem()
  const convertList = useConvertListToTransactions()

  const [openEdit, setOpenEdit] = useState(false)
  const [editName, setEditName] = useState("")
  const [editStore, setEditStore] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const [newItemName, setNewItemName] = useState("")
  const [newItemQty, setNewItemQty] = useState(1)
  const [newItemUnit, setNewItemUnit] = useState("unidad")
  const [newItemCategory, setNewItemCategory] = useState<ShoppingCategory>("otros")
  const [newItemPrice, setNewItemPrice] = useState(0)
  const [showSuggestions, setShowSuggestions] = useState(false)

  const [actualCost, setActualCost] = useState("")
  const [savingCost, setSavingCost] = useState(false)

  useEffect(() => {
    if (list?.actual_cost != null) {
      setActualCost(String(list.actual_cost))
    }
  }, [list?.actual_cost])

  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editItemQty, setEditItemQty] = useState(1)
  const [editItemUnit, setEditItemUnit] = useState("unidad")
  const [editItemCategory, setEditItemCategory] = useState<ShoppingCategory>("otros")
  const [editItemPrice, setEditItemPrice] = useState(0)

  const loading = hhLoading || isLoading

  const handleOpenEdit = () => {
    if (!list) return
    setEditName(list.name)
    setEditStore(list.store ?? "")
    setOpenEdit(true)
  }

  const handleSaveList = async () => {
    if (!editName.trim() || isSaving) return
    setIsSaving(true)
    try {
      await updateList.mutateAsync({
        id: listId,
        data: { name: editName, store: editStore || "" },
      })
      setOpenEdit(false)
    } catch {
    } finally {
      setIsSaving(false)
    }
  }

  const handleChangeStatus = async (status: string) => {
    if (!status) return
    await updateList.mutateAsync({ id: listId, data: { status: status as "open" | "shopping" | "completed" } })
  }

  const handleSaveActualCost = async () => {
    const val = actualCost.trim() ? Number(actualCost) : undefined
    if (val !== undefined && (isNaN(val) || val < 0)) return
    setSavingCost(true)
    try {
      await updateList.mutateAsync({ id: listId, data: { actual_cost: val } })
    } finally {
      setSavingCost(false)
    }
  }

  const handleAddItem = async () => {
    if (!newItemName.trim()) return
    await addItem.mutateAsync({
      listId,
      data: {
        id: crypto.randomUUID(),
        name: newItemName,
        quantity: newItemQty,
        unit: newItemUnit,
        category: newItemCategory,
        purchased: false,
        estimated_price: newItemPrice,
      },
    })
    setNewItemName("")
    setNewItemQty(1)
    setNewItemUnit("unidad")
    setNewItemCategory("otros")
    setNewItemPrice(0)
    setShowSuggestions(false)
  }

  const handleTogglePurchased = (item: any) => {
    updateItem.mutate({ id: item.id, data: { purchased: !item.purchased } })
  }

  const handleDeleteItem = (itemId: string) => {
    deleteItem.mutate(itemId)
  }

  const handleStartEditItem = (item: any) => {
    setEditingItemId(item.id)
    setEditItemQty(item.quantity)
    setEditItemUnit(item.unit ?? "unidad")
    setEditItemCategory(item.category ?? "otros")
    setEditItemPrice(Number(item.estimated_price ?? 0))
  }

  const handleSaveItem = async (itemId: string) => {
    await updateItem.mutateAsync({
      id: itemId,
      data: {
        quantity: editItemQty,
        unit: editItemUnit,
        category: editItemCategory,
        estimated_price: editItemPrice,
      },
    })
    setEditingItemId(null)
  }

  const handleCancelEditItem = () => {
    setEditingItemId(null)
  }

  const productSuggestions = newItemName.trim()
    ? (products as any[])
        .filter((p: any) => p.name.toLowerCase().includes(newItemName.toLowerCase()))
        .slice(0, 5)
    : []

  const actualCostValue = actualCost.trim() ? Number(actualCost) : null
  const estimated = list?.total_estimated ?? 0
  const diff = actualCostValue != null ? actualCostValue - estimated : 0
  const diffSign = diff >= 0 ? "+" : "−"
  const diffColor = actualCostValue == null ? "" : diff > 0 ? "text-red-500" : diff < 0 ? "text-emerald-500" : ""

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton rows={4} />
      </div>
    )
  }

  if (error || !list) {
    return (
      <EmptyState
        icon={ShoppingCart}
        title="Lista no encontrada"
        description="No se pudo cargar la lista de compras"
        actionLabel="Volver"
        onAction={() => router.push("/shopping")}
      />
    )
  }

  const s = statusConfig[list.status] ?? statusConfig.open
  const k = kindConfig[list.kind] ?? kindConfig.grocery
  const items = list.items ?? []
  const purchasedCount = items.filter((i: any) => i.purchased).length

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push("/shopping")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight">{list.name}</h1>
            <Badge variant={k.variant}>{k.label}</Badge>
            <Badge variant={s.variant}>
              <s.icon className="h-3 w-3 mr-1" />
              {s.label}
            </Badge>
          </div>
          {list.store && (
            <p className="text-sm text-muted-foreground mt-0.5">{list.store}</p>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium">Estado:</Label>
          <Select value={list.status} onValueChange={(v) => v && handleChangeStatus(v)}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5" /> Pendiente
                </div>
              </SelectItem>
              <SelectItem value="shopping">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-3.5 w-3.5" /> Comprando
                </div>
              </SelectItem>
              <SelectItem value="completed">
                <div className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5" /> Completada
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium whitespace-nowrap">Costo real:</Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              placeholder="0.00"
              className="w-28 h-8 text-sm"
              value={actualCost}
              onChange={(e) => setActualCost(e.target.value)}
              onBlur={handleSaveActualCost}
            />
            {savingCost && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
          </div>
          <div className="h-6 w-px bg-border mx-1 hidden sm:block" />
          <Button variant="outline" size="sm" onClick={handleOpenEdit}>
            <Pencil className="h-3.5 w-3.5 mr-1" /> Editar lista
          </Button>
          {list.status === "completed" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => convertList.mutate(listId)}
              disabled={convertList.isPending}
            >
              {convertList.isPending ? (
                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
              ) : null}
              Convertir a gastos
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-sm">
        <div className="rounded-lg border p-3">
          <p className="text-muted-foreground text-xs">Artículos</p>
          <p className="text-xl font-semibold mt-1">{items.length}</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-muted-foreground text-xs">Comprados</p>
          <p className="text-xl font-semibold mt-1">{purchasedCount}</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-muted-foreground text-xs">Pendientes</p>
          <p className="text-xl font-semibold mt-1">{items.length - purchasedCount}</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-muted-foreground text-xs">Estimado</p>
          <p className="text-xl font-semibold mt-1">{formatMoney(list.total_estimated ?? 0)}</p>
        </div>
        <div className={cn("rounded-lg border p-3", actualCostValue != null && "bg-muted/30")}>
          <p className="text-muted-foreground text-xs">Diferencia</p>
          <p className={cn("text-xl font-semibold mt-1", diffColor)}>
            {actualCostValue != null ? `${diffSign}${formatMoney(Math.abs(diff))}` : "—"}
          </p>
        </div>
      </div>

      {items.length > 0 && (
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-emerald-500 h-2 rounded-full transition-all"
            style={{ width: `${(purchasedCount / items.length) * 100}%` }}
          />
        </div>
      )}

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Artículos</CardTitle>
            <span className="text-xs text-muted-foreground">
              {purchasedCount} de {items.length} comprados
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">Esta lista no tiene artículos</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Agrega productos usando el formulario de abajo</p>
            </div>
          ) : (
            <div className="grid gap-1.5">
              {items.map((item: any) => (
                <div
                  key={item.id}
                  className={cn(
                    "flex items-center gap-3 rounded-lg p-2.5 transition-colors hover:bg-muted/50 group",
                    item.purchased && "opacity-60"
                  )}
                >
                  <button
                    onClick={() => handleTogglePurchased(item)}
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
                    {editingItemId === item.id ? (
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="w-16">
                          <Input
                            type="number"
                            min={1}
                            value={editItemQty}
                            onChange={(e) => setEditItemQty(Number(e.target.value) || 1)}
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="w-24">
                          <Select value={editItemUnit} onValueChange={(v) => v && setEditItemUnit(v)}>
                            <SelectTrigger className="h-8 text-xs">
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
                        <div className="w-28">
                          <Select value={editItemCategory} onValueChange={(v) => v && setEditItemCategory(v as ShoppingCategory)}>
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {(Object.entries(CATEGORY_LABELS) as [ShoppingCategory, string][]).map(([key, label]) => (
                                <SelectItem key={key} value={key}>{label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="w-20">
                          <Input
                            type="number"
                            min={0}
                            value={editItemPrice || ""}
                            onChange={(e) => setEditItemPrice(Number(e.target.value) || 0)}
                            className="h-8 text-xs"
                          />
                        </div>
                        <Button variant="ghost" size="icon-xs" onClick={() => handleSaveItem(item.id)}>
                          <Save className="h-3.5 w-3.5 text-emerald-500" />
                        </Button>
                        <Button variant="ghost" size="icon-xs" onClick={handleCancelEditItem}>
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <span className={cn("text-sm font-medium", item.purchased && "line-through")}>
                          {item.name}
                        </span>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                          <span>{item.quantity} × {item.unit}</span>
                          <Badge variant="outline" className="text-[10px]">
                            {CATEGORY_LABELS[item.category as ShoppingCategory] ?? item.category}
                          </Badge>
                        </div>
                      </>
                    )}
                  </div>

                  <span className="text-sm font-medium whitespace-nowrap">
                    {formatMoney(item.estimated_price ?? 0)}
                  </span>

                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!item.purchased && editingItemId !== item.id && (
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        className="text-muted-foreground"
                        onClick={() => handleStartEditItem(item)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeleteItem(item.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Agregar artículo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            <div className="grid grid-cols-12 gap-2 items-end">
              <div className="col-span-4 relative">
                <Label htmlFor="new-name" className="text-xs mb-1 block">Producto</Label>
                <Input
                  id="new-name"
                  placeholder="Nombre del producto"
                  value={newItemName}
                  onChange={(e) => {
                    setNewItemName(e.target.value)
                    setShowSuggestions(true)
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                />
                {showSuggestions && productSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-popover border rounded-md shadow-md max-h-40 overflow-y-auto">
                    {productSuggestions.map((p: any) => (
                      <button
                        key={p.id}
                        type="button"
                        className="w-full text-left px-3 py-2 text-xs hover:bg-accent flex items-center justify-between gap-2"
                        onMouseDown={() => {
                          setNewItemName(p.name)
                          setNewItemCategory(p.category ?? "otros")
                          setNewItemUnit(p.unit ?? "unidad")
                          setNewItemPrice(Number(p.last_price ?? 0))
                          setShowSuggestions(false)
                        }}
                      >
                        <span className="truncate font-medium">{p.name}</span>
                        <span className="text-muted-foreground shrink-0">{formatMoney(p.last_price, "NIO")}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="col-span-2">
                <Label htmlFor="new-qty" className="text-xs mb-1 block">Cant.</Label>
                <Input
                  id="new-qty"
                  type="number"
                  min={1}
                  value={newItemQty}
                  onChange={(e) => setNewItemQty(Number(e.target.value) || 1)}
                />
              </div>
              <div className="col-span-2">
                <Label className="text-xs mb-1 block">Unidad</Label>
                <Select value={newItemUnit} onValueChange={(v) => v && setNewItemUnit(v)}>
                  <SelectTrigger>
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
                <Label htmlFor="new-price" className="text-xs mb-1 block">Precio</Label>
                <Input
                  id="new-price"
                  type="number"
                  min={0}
                  value={newItemPrice || ""}
                  onChange={(e) => setNewItemPrice(Number(e.target.value) || 0)}
                />
              </div>
              <div className="col-span-2">
                <Label className="text-xs mb-1 block">&nbsp;</Label>
                <Button
                  className="w-full"
                  size="sm"
                  onClick={handleAddItem}
                  disabled={!newItemName.trim() || addItem.isPending}
                >
                  {addItem.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <div>
              <Select value={newItemCategory} onValueChange={(v) => v && setNewItemCategory(v as ShoppingCategory)}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(CATEGORY_LABELS) as [ShoppingCategory, string][]).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar lista</DialogTitle>
            <DialogDescription>Actualiza el nombre o la tienda de la lista</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Nombre</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-store">Tienda</Label>
              <Input
                id="edit-store"
                value={editStore}
                onChange={(e) => setEditStore(e.target.value)}
                placeholder="Ej: Nacional"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenEdit(false)}>Cancelar</Button>
            <Button onClick={handleSaveList} disabled={!editName.trim() || isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
