"use client"

import { useState } from "react"
import { Search, Plus, Gamepad2, Monitor, GamepadIcon, MonitorPlay } from "lucide-react"
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
import { useGames, useCreateGame, useUpdateGame } from "../queries"
import { formatMoney, cn } from "@/lib/utils"

const platformFilters = ["all", "PC", "PS5", "Xbox", "Switch", "Mobile"] as const
const statusFilters = ["all", "owned", "wishlist", "playing", "finished"] as const

const platformIcons: Record<string, typeof Monitor> = {
  PC: Monitor,
  PS5: Gamepad2,
  Xbox: Gamepad2,
  Switch: GamepadIcon,
  Mobile: MonitorPlay,
}

const platformLabels: Record<string, string> = {
  PC: "PC",
  PS5: "PS5",
  Xbox: "Xbox",
  Switch: "Switch",
  Mobile: "Móvil",
}

const statusLabels: Record<string, string> = {
  owned: "Comprado",
  wishlist: "Deseado",
  playing: "Jugando",
  finished: "Terminado",
}

const emptyForm = {
  title: "",
  platform: "PC" as const,
  status: "owned" as const,
  purchase_date: "",
  purchase_price: 0,
  cover_url: "",
}

export function GamesPage() {
  const { householdId, isLoading: householdLoading } = useHousehold()
  const { data: games = [], isLoading: dataLoading } = useGames(householdId || null)
  const createGame = useCreateGame()
  const updateGame = useUpdateGame()

  const [search, setSearch] = useState("")
  const [platformFilter, setPlatformFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [openForm, setOpenForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)

  const loading = householdLoading || dataLoading

  const filtered = games.filter((g: any) => {
    if (search && !g.title.toLowerCase().includes(search.toLowerCase())) return false
    if (platformFilter !== "all" && g.platform !== platformFilter) return false
    if (statusFilter !== "all" && g.status !== statusFilter) return false
    return true
  })

  const playingCount = games.filter((g: any) => g.status === "playing").length
  const ownedCount = games.filter((g: any) => g.status === "owned" || g.status === "finished" || g.status === "playing").length
  const wishlistCount = games.filter((g: any) => g.status === "wishlist").length
  const totalSpent = games.reduce((sum: number, g: any) => sum + Number(g.purchase_price || 0), 0)

  const statusBadgeClass = (status: string) => {
    if (status === "playing") return "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400"
    if (status === "finished") return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
    if (status === "wishlist") return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
    return "bg-muted text-muted-foreground"
  }

  const openCreate = () => {
    setForm(emptyForm)
    setEditingId(null)
    setOpenForm(true)
  }

  const openEdit = (game: any) => {
    setForm({
      title: game.title || "",
      platform: game.platform || "PC",
      status: game.status || "owned",
      purchase_date: game.purchase_date || "",
      purchase_price: Number(game.purchase_price || 0),
      cover_url: game.cover_url || "",
    })
    setEditingId(game.id)
    setOpenForm(true)
  }

  const handleSave = () => {
    if (editingId) {
      updateGame.mutate({ id: editingId, data: form }, { onSuccess: () => setOpenForm(false) })
    } else {
      createGame.mutate(form, { onSuccess: () => setOpenForm(false) })
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Juegos</h1>
          <p className="text-muted-foreground text-sm mt-1">Biblioteca de juegos y lista de deseos</p>
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
          <h1 className="text-2xl font-bold tracking-tight">Juegos</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Biblioteca de juegos y lista de deseos
          </p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1" /> Agregar juego
        </Button>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="En biblioteca" value={String(ownedCount)} icon={Gamepad2} />
        <StatCard title="Jugando" value={String(playingCount)} icon={Gamepad2} />
        <StatCard title="Lista de deseos" value={String(wishlistCount)} icon={Gamepad2} />
        <StatCard title="Total gastado" value={formatMoney(totalSpent)} icon={Gamepad2} />
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
        <Select value={platformFilter} onValueChange={(v) => setPlatformFilter(v ?? "all")}>
          <SelectTrigger className="w-[130px] h-9 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {platformFilters.map((p) => (
              <SelectItem key={p} value={p}>
                {p === "all" ? "Todas" : platformLabels[p]}
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

      {games.length === 0 && !loading ? (
        <EmptyState
          icon={Gamepad2}
          title="Sin juegos"
          description="Agrega juegos a tu biblioteca o lista de deseos"
          actionLabel="Agregar juego"
          onAction={openCreate}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Gamepad2}
          title="Sin resultados"
          description="No se encontraron juegos con los filtros actuales"
        />
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((game: any) => {
            const Icon = platformIcons[game.platform] || Monitor
            return (
              <Card
                key={game.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => openEdit(game)}
              >
                <CardHeader className="pb-2">
                  <div className="h-28 bg-muted rounded-lg flex items-center justify-center">
                    <Icon className="h-10 w-10 text-muted-foreground/50" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{game.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{platformLabels[game.platform] || game.platform}</p>
                    </div>
                    <Badge className={cn("text-[10px] shrink-0", statusBadgeClass(game.status))}>
                      {statusLabels[game.status] || game.status}
                    </Badge>
                  </div>
                  {Number(game.purchase_price) > 0 && (
                    <p className="text-sm font-medium mt-2">{formatMoney(game.purchase_price)}</p>
                  )}
                  {game.status === "wishlist" && (
                    <p className="text-xs text-muted-foreground mt-1">En lista de deseos</p>
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
            <DialogTitle>{editingId ? "Editar juego" : "Nuevo juego"}</DialogTitle>
            <DialogDescription>Agrega un juego a tu biblioteca o lista de deseos</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="space-y-1">
              <Label>Título</Label>
              <Input
                placeholder="Ej: Elden Ring"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Plataforma</Label>
                <Select value={form.platform} onValueChange={(v) => setForm({ ...form, platform: v as any })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PC">PC</SelectItem>
                    <SelectItem value="PS5">PS5</SelectItem>
                    <SelectItem value="Xbox">Xbox</SelectItem>
                    <SelectItem value="Switch">Switch</SelectItem>
                    <SelectItem value="Mobile">Móvil</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Estado</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as any })}>
                  <SelectTrigger><SelectValue placeholder="Comprado" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="owned">Comprado</SelectItem>
                    <SelectItem value="wishlist">Deseado</SelectItem>
                    <SelectItem value="playing">Jugando</SelectItem>
                    <SelectItem value="finished">Terminado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Precio</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={form.purchase_price || ""}
                  onChange={(e) => setForm({ ...form, purchase_price: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-1">
                <Label>Fecha de compra</Label>
                <Input
                  type="date"
                  value={form.purchase_date}
                  onChange={(e) => setForm({ ...form, purchase_date: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenForm(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={createGame.isPending || updateGame.isPending}>
              {createGame.isPending || updateGame.isPending ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
