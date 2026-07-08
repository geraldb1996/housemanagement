"use client"

import { useState } from "react"
import { Search, Plus, Film, Tv2, Star } from "lucide-react"
import { StatCard } from "@/components/data/StatCard"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
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
import { useWatchlist, useCreateWatchlistItem, useUpdateWatchlistItem } from "../queries"
import { cn } from "@/lib/utils"

const kindFilters = ["all", "movie", "tv"] as const
const statusFilters = ["all", "pending", "watching", "watched"] as const

const kindIcons: Record<string, typeof Film> = {
  movie: Film,
  tv: Tv2,
}

const kindLabels: Record<string, string> = {
  movie: "Película",
  tv: "Serie",
}

const statusLabels: Record<string, string> = {
  pending: "Pendiente",
  watching: "Viendo",
  watched: "Visto",
}

const emptyForm = {
  title: "",
  kind: "movie" as const,
  status: "pending" as const,
  rating: 0,
}

export function WatchlistPage() {
  const { householdId, isLoading: householdLoading } = useHousehold()
  const { data: watchlist = [], isLoading: dataLoading } = useWatchlist(householdId || null)
  const createItem = useCreateWatchlistItem()
  const updateItem = useUpdateWatchlistItem()

  const [search, setSearch] = useState("")
  const [kindFilter, setKindFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [openForm, setOpenForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)

  const loading = householdLoading || dataLoading

  const filtered = watchlist.filter((w: any) => {
    if (search && !w.title.toLowerCase().includes(search.toLowerCase())) return false
    if (kindFilter !== "all" && w.kind !== kindFilter) return false
    if (statusFilter !== "all" && w.status !== statusFilter) return false
    return true
  })

  const pendingCount = watchlist.filter((w: any) => w.status === "pending").length
  const watchingCount = watchlist.filter((w: any) => w.status === "watching").length
  const watchedCount = watchlist.filter((w: any) => w.status === "watched").length
  const ratedItems = watchlist.filter((w: any) => Number(w.rating) > 0)
  const avgRating = ratedItems.length > 0
    ? ratedItems.reduce((sum: number, w: any) => sum + Number(w.rating), 0) / ratedItems.length
    : 0

  const statusBadgeClass = (status: string) => {
    if (status === "watching") return "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400"
    if (status === "watched") return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
    return "bg-muted text-muted-foreground"
  }

  const openCreate = () => {
    setForm(emptyForm)
    setEditingId(null)
    setOpenForm(true)
  }

  const openEdit = (item: any) => {
    setForm({
      title: item.title || "",
      kind: item.kind || "movie",
      status: item.status || "pending",
      rating: Number(item.rating || 0),
    })
    setEditingId(item.id)
    setOpenForm(true)
  }

  const handleSave = () => {
    if (editingId) {
      updateItem.mutate({ id: editingId, data: form }, { onSuccess: () => setOpenForm(false) })
    } else {
      createItem.mutate(form, { onSuccess: () => setOpenForm(false) })
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Watchlist</h1>
          <p className="text-muted-foreground text-sm mt-1">Películas y series por ver</p>
        </div>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <LoadingSkeleton rows={2} />
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
          <h1 className="text-2xl font-bold tracking-tight">Watchlist</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Películas y series por ver
          </p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1" /> Agregar título
        </Button>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Pendientes" value={String(pendingCount)} icon={Film} />
        <StatCard title="Viendo" value={String(watchingCount)} icon={Tv2} />
        <StatCard title="Vistos" value={String(watchedCount)} icon={Film} />
        <StatCard
          title="Rating promedio"
          value={avgRating > 0 ? avgRating.toFixed(1) : "--"}
          subtitle="de 10"
          icon={Star}
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
          <SelectTrigger className="w-[130px] h-9 text-xs">
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

      {watchlist.length === 0 && !loading ? (
        <EmptyState
          icon={Film}
          title="Sin títulos"
          description="Agrega películas o series a tu watchlist"
          actionLabel="Agregar título"
          onAction={openCreate}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Film}
          title="Sin resultados"
          description="No se encontraron títulos con los filtros actuales"
        />
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((item: any) => {
            const Icon = kindIcons[item.kind] || Film
            return (
              <Card
                key={item.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => openEdit(item)}
              >
                <CardHeader className="pb-2">
                  <div className="h-28 bg-muted rounded-lg flex items-center justify-center">
                    <Icon className="h-10 w-10 text-muted-foreground/50" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{item.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{kindLabels[item.kind] || item.kind}</p>
                    </div>
                    <Badge className={cn("text-[10px] shrink-0", statusBadgeClass(item.status))}>
                      {statusLabels[item.status] || item.status}
                    </Badge>
                  </div>
                  {Number(item.rating) > 0 && (
                    <div className="flex items-center gap-1 mt-2">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      <span className="text-sm font-medium">{item.rating}/10</span>
                    </div>
                  )}
                  {Number(item.rating) === 0 && (
                    <p className="text-xs text-muted-foreground mt-1">Sin calificar</p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={openForm} onOpenChange={setOpenForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar título" : "Nuevo título"}</DialogTitle>
            <DialogDescription>Agrega una película o serie a tu watchlist</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="space-y-1">
              <Label>Título</Label>
              <Input
                placeholder="Ej: Dune"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Tipo</Label>
                <Select value={form.kind} onValueChange={(v) => setForm({ ...form, kind: v as any })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="movie">Película</SelectItem>
                    <SelectItem value="tv">Serie</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Estado</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as any })}>
                  <SelectTrigger><SelectValue placeholder="Pendiente" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendiente</SelectItem>
                    <SelectItem value="watching">Viendo</SelectItem>
                    <SelectItem value="watched">Visto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Rating (0-10)</Label>
              <Input
                type="number"
                min="0"
                max="10"
                placeholder="0"
                value={form.rating || ""}
                onChange={(e) => setForm({ ...form, rating: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenForm(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={createItem.isPending || updateItem.isPending}>
              {createItem.isPending || updateItem.isPending ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
