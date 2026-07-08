"use client"

import { useState, useMemo } from "react"
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
import { StatCard } from "@/components/data/StatCard"
import { LoadingSkeleton } from "@/components/data/LoadingSkeleton"
import {
  Plus,
  Search,
  PackageOpen,
  Star,
  Barcode,
  ShoppingBag,
  TrendingDown,
} from "lucide-react"
import { formatMoney, cn } from "@/lib/utils"
import { useHousehold } from "@/lib/use-household"
import {
  useProducts,
  useCreateProduct,
  useUpdateProduct,
} from "../queries"
import { CATEGORY_LABELS, type ShoppingCategory } from "../schemas"

const catColors: Record<ShoppingCategory, string> = {
  alimentos: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  bebidas: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  limpieza: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
  higiene: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  hogar: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  mascotas: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  farmacia: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  ropa: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
  electronica: "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400",
  otros: "bg-muted text-muted-foreground",
}

const emptyForm = {
  name: "",
  category: "otros" as ShoppingCategory,
  last_price: 0,
  unit: "unidad",
  barcode: "",
  favorite: false,
}

export function ProductsPage() {
  const { householdId, isLoading: hhLoading } = useHousehold()
  const [search, setSearch] = useState("")
  const [catFilter, setCatFilter] = useState("all")

  const { data: products = [], isLoading } = useProducts(householdId || null, {
    search: search || undefined,
  })

  const createProduct = useCreateProduct()
  const updateProduct = useUpdateProduct()

  const [openForm, setOpenForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)

  const list = products as any[]

  const filtered = useMemo(() => {
    return list.filter((p: any) => {
      if (catFilter !== "all" && p.category !== catFilter) return false
      return true
    })
  }, [list, catFilter])

  const favorites = list.filter((p: any) => p.favorite).length
  const avgPrice = list.length > 0 ? list.reduce((s: number, p: any) => s + Number(p.last_price), 0) / list.length : 0

  const toggleFavorite = (p: any) => {
    updateProduct.mutate({ id: p.id, data: { favorite: !p.favorite } })
  }

  const openCreate = () => {
    setForm(emptyForm)
    setEditingId(null)
    setOpenForm(true)
  }

  const openEdit = (p: any) => {
    setForm({
      name: p.name ?? "",
      category: p.category ?? "otros",
      last_price: Number(p.last_price ?? 0),
      unit: p.unit ?? "unidad",
      barcode: p.barcode ?? "",
      favorite: p.favorite ?? false,
    })
    setEditingId(p.id)
    setOpenForm(true)
  }

  const handleSave = () => {
    if (!form.name.trim()) return
    if (editingId) {
      updateProduct.mutate({ id: editingId, data: form }, { onSuccess: () => setOpenForm(false) })
    } else {
      createProduct.mutate(form, { onSuccess: () => setOpenForm(false) })
    }
  }

  if (hhLoading || isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Productos</h1>
          <p className="text-muted-foreground text-sm mt-1">Catálogo de productos frecuentes y favoritos</p>
        </div>
        <LoadingSkeleton rows={4} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Productos</h1>
          <p className="text-muted-foreground text-sm mt-1">Catálogo de productos frecuentes y favoritos</p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1" /> Agregar producto
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title="Total productos"
          value={String(list.length)}
          icon={ShoppingBag}
        />
        <StatCard
          title="Favoritos"
          value={String(favorites)}
          icon={Star}
        />
        <StatCard
          title="Precio promedio"
          value={formatMoney(avgPrice, "NIO")}
          icon={TrendingDown}
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o código..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={catFilter} onValueChange={(v) => setCatFilter(v ?? "all")}>
          <SelectTrigger className="w-[150px] h-9 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {(Object.entries(CATEGORY_LABELS) as [ShoppingCategory, string][]).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={PackageOpen}
          title="Sin productos"
          description={search || catFilter !== "all" ? "Intenta con otros filtros" : "Agrega tu primer producto"}
          actionLabel={!search && catFilter === "all" ? "Agregar producto" : undefined}
          onAction={openCreate}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p: any) => (
            <Card
              key={p.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => openEdit(p)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Badge className={cn("text-[10px] h-5 px-1.5", catColors[p.category as ShoppingCategory])}>
                    {CATEGORY_LABELS[p.category as ShoppingCategory] || p.category}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleFavorite(p)
                    }}
                  >
                    <Star
                      className={cn(
                        "h-4 w-4",
                        p.favorite ? "text-amber-400 fill-amber-400" : "text-muted-foreground"
                      )}
                    />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <CardTitle className="text-sm">{p.name}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-lg font-bold text-emerald-600">
                    {formatMoney(p.last_price, "NIO")}
                  </p>
                  <span className="text-xs text-muted-foreground">
                    /{p.unit ?? "unidad"}
                  </span>
                </div>
                {p.barcode && (
                  <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground">
                    <Barcode className="h-3 w-3" />
                    {p.barcode}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={openForm} onOpenChange={setOpenForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar producto" : "Agregar producto"}</DialogTitle>
            <DialogDescription>
              Registra un producto frecuente para reutilizarlo en tus listas
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="prod-name">Nombre</Label>
              <Input
                id="prod-name"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Ej: Leche entera"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Categoría</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => v && setForm((p) => ({ ...p, category: v as ShoppingCategory }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.entries(CATEGORY_LABELS) as [ShoppingCategory, string][]).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Unidad</Label>
                <Select
                  value={form.unit}
                  onValueChange={(v) => v && setForm((p) => ({ ...p, unit: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unidad">Unidad</SelectItem>
                    <SelectItem value="lb">Libra</SelectItem>
                    <SelectItem value="kg">Kilogramo</SelectItem>
                    <SelectItem value="galón">Galón</SelectItem>
                    <SelectItem value="litro">Litro</SelectItem>
                    <SelectItem value="botella">Botella</SelectItem>
                    <SelectItem value="paquete">Paquete</SelectItem>
                    <SelectItem value="bolsa">Bolsa</SelectItem>
                    <SelectItem value="caja">Caja</SelectItem>
                    <SelectItem value="cartón">Cartón</SelectItem>
                    <SelectItem value="barra">Barra</SelectItem>
                    <SelectItem value="tubo">Tubo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Precio (aproximado)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={form.last_price || ""}
                onChange={(e) => setForm((p) => ({ ...p, last_price: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Código de barras</Label>
              <Input
                value={form.barcode}
                onChange={(e) => setForm((p) => ({ ...p, barcode: e.target.value }))}
                placeholder="Opcional"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenForm(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={createProduct.isPending || updateProduct.isPending || !form.name.trim()}
            >
              {createProduct.isPending || updateProduct.isPending ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
