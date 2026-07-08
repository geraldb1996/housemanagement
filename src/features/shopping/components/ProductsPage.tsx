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
import { CATEGORY_LABELS, type ShoppingCategory } from "../schemas"

interface Product {
  name: string
  category: ShoppingCategory
  last_price: number
  unit: string
  favorite: boolean
  barcode: string
}

const mockProducts: Product[] = [
  { name: "Leche entera La Vaquita", category: "alimentos", last_price: 155, unit: "galón", favorite: true, barcode: "7460012345671" },
  { name: "Pan integral Bimbo", category: "alimentos", last_price: 89, unit: "paquete", favorite: true, barcode: "7460012345672" },
  { name: "Huevos grandes docena", category: "alimentos", last_price: 245, unit: "cartón", favorite: true, barcode: "7460012345673" },
  { name: "Pechuga de pollo fresca", category: "alimentos", last_price: 148, unit: "lb", favorite: false, barcode: "7460012345674" },
  { name: "Arroz selecto", category: "alimentos", last_price: 115, unit: "paquete", favorite: false, barcode: "7460012345675" },
  { name: "Café Santo Domingo", category: "bebidas", last_price: 375, unit: "bolsa", favorite: true, barcode: "7460012345676" },
  { name: "Jugo de naranja Tropicana", category: "bebidas", last_price: 180, unit: "botella", favorite: false, barcode: "7460012345677" },
  { name: "Detergente líquido Mistolín", category: "limpieza", last_price: 320, unit: "botella", favorite: true, barcode: "7460012345678" },
  { name: "Jabón de baño Protex", category: "higiene", last_price: 65, unit: "barra", favorite: false, barcode: "7460012345679" },
  { name: "Papel higiénico Suave", category: "higiene", last_price: 410, unit: "paquete", favorite: true, barcode: "7460012345680" },
  { name: "Pasta dental Colgate", category: "higiene", last_price: 175, unit: "tubo", favorite: false, barcode: "7460012345681" },
  { name: "Comida de perro Pedigree", category: "mascotas", last_price: 850, unit: "bolsa", favorite: true, barcode: "7460012345682" },
]

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

export function ProductsPage() {
  const [products, setProducts] = useState(mockProducts)
  const [search, setSearch] = useState("")
  const [catFilter, setCatFilter] = useState("all")
  const [openForm, setOpenForm] = useState(false)
  const [newProduct, setNewProduct] = useState({ name: "", category: "otros" as ShoppingCategory, last_price: 0, unit: "unidad", barcode: "" })

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.barcode.includes(search)) return false
      if (catFilter !== "all" && p.category !== catFilter) return false
      return true
    })
  }, [products, search, catFilter])

  const toggleFavorite = (name: string) => {
    setProducts((prev) => prev.map((p) => (p.name === name ? { ...p, favorite: !p.favorite } : p)))
  }

  const handleAdd = () => {
    if (!newProduct.name.trim()) return
    setProducts((prev) => [
      { ...newProduct, favorite: false },
      ...prev,
    ])
    setOpenForm(false)
    setNewProduct({ name: "", category: "otros", last_price: 0, unit: "unidad", barcode: "" })
  }

  const favorites = products.filter((p) => p.favorite).length
  const avgPrice = products.length > 0 ? products.reduce((s, p) => s + p.last_price, 0) / products.length : 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Productos</h1>
          <p className="text-muted-foreground text-sm mt-1">Catalogo de productos frecuentes y favoritos</p>
        </div>
        <Button size="sm" onClick={() => setOpenForm(true)}>
          <Plus className="h-4 w-4 mr-1" /> Agregar producto
        </Button>
        <Dialog open={openForm} onOpenChange={setOpenForm}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Agregar producto</DialogTitle>
              <DialogDescription>Registra un producto frecuente para reutilizarlo en tus listas</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label htmlFor="prod-name">Nombre</Label>
                <Input
                  id="prod-name"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Ej: Leche entera"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label>Categoría</Label>
                  <Select value={newProduct.category} onValueChange={(v) => v && setNewProduct((p) => ({ ...p, category: v as ShoppingCategory }))}>
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
                <div className="grid gap-2">
                  <Label>Unidad</Label>
                  <Select value={newProduct.unit} onValueChange={(v) => v && setNewProduct((p) => ({ ...p, unit: v }))}>
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
                      <SelectItem value="barra">barra</SelectItem>
                      <SelectItem value="tubo">tubo</SelectItem>
                      <SelectItem value="cartón">cartón</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="prod-price">Precio habitual</Label>
                  <Input
                    id="prod-price"
                    type="number"
                    min={0}
                    value={newProduct.last_price || ""}
                    onChange={(e) => setNewProduct((p) => ({ ...p, last_price: Number(e.target.value) || 0 }))}
                    placeholder="0"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="prod-barcode">Código de barras</Label>
                  <Input
                    id="prod-barcode"
                    value={newProduct.barcode}
                    onChange={(e) => setNewProduct((p) => ({ ...p, barcode: e.target.value }))}
                    placeholder="74600..."
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenForm(false)}>Cancelar</Button>
              <Button onClick={handleAdd} disabled={!newProduct.name.trim()}><Plus className="h-4 w-4 mr-1" /> Guardar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatCard title="Productos" value={String(products.length)} icon={ShoppingBag} />
        <StatCard title="Favoritos" value={String(favorites)} icon={Star} />
        <StatCard title="Precio promedio" value={formatMoney(avgPrice)} icon={TrendingDown} />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o código..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={catFilter} onValueChange={(v) => setCatFilter(v ?? "all")}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Filtrar categoría" />
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
          title="No se encontraron productos"
          description="Agrega tus primeros productos frecuentes o ajusta los filtros"
          actionLabel="Agregar producto"
          onAction={() => setOpenForm(true)}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((product) => (
            <Card
              key={product.name}
              className={cn("group transition-all hover:shadow-md", product.favorite && "ring-1 ring-amber-500/50")}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-sm leading-tight pr-6">{product.name}</CardTitle>
                  <button
                    onClick={() => toggleFavorite(product.name)}
                    className="shrink-0 mt-0.5"
                    aria-label={product.favorite ? "Quitar de favoritos" : "Agregar a favoritos"}
                  >
                    <Star
                      className={cn(
                        "h-4 w-4 transition-colors",
                        product.favorite
                          ? "fill-amber-500 text-amber-500"
                          : "text-muted-foreground/30 hover:text-amber-500"
                      )}
                    />
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl font-bold">{formatMoney(product.last_price)}</span>
                  <span className="text-xs text-muted-foreground">/ {product.unit}</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={cn("text-[10px]", catColors[product.category])}>
                    {CATEGORY_LABELS[product.category]}
                  </Badge>
                  {product.barcode && (
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Barcode className="h-3 w-3" />
                      {product.barcode}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
