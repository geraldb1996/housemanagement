"use client"

import { useState, useMemo } from "react"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
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
import { Textarea } from "@/components/ui/textarea"
import { StatCard } from "@/components/data/StatCard"
import { EmptyState } from "@/components/data/EmptyState"
import { LoadingSkeleton } from "@/components/data/LoadingSkeleton"
import {
  Plus,
  Search,
  Wrench,
  Calendar,
  Home,
  Monitor,
  Sofa,
  Cpu,
  ShieldAlert,
  Tag,
  Filter,
  Trash2,
} from "lucide-react"
import { formatMoney, formatShortDate, cn } from "@/lib/utils"
import { useHousehold } from "@/lib/use-household"
import { CATEGORY_LABELS } from "../schemas"
import { useInventoryItems, useCreateInventoryItem, useDeleteInventoryItem, useAddMaintenance } from "../queries"

const categoryIcons: Record<string, React.ElementType> = {
  appliance: Cpu,
  furniture: Sofa,
  electronics: Monitor,
  other: Home,
}

const categoryBadgeVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  appliance: "secondary",
  furniture: "outline",
  electronics: "default",
  other: "outline",
}

const locationOptions = [
  "Cocina",
  "Sala",
  "Comedor",
  "Lavandería",
  "Dormitorio principal",
  "Estudio",
  "Garaje",
  "Baño",
  "Terraza",
]

export function InventoryPage() {
  const { householdId, isLoading: householdLoading } = useHousehold()
  const { data: items = [], isLoading } = useInventoryItems(householdId || null)
  const createItem = useCreateInventoryItem()
  const deleteItem = useDeleteInventoryItem()
  const addMtn = useAddMaintenance()

  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [locationFilter, setLocationFilter] = useState("all")
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const [openForm, setOpenForm] = useState(false)
  const [formName, setFormName] = useState("")
  const [formCategory, setFormCategory] = useState<"appliance" | "furniture" | "electronics" | "other">("appliance")
  const [formLocation, setFormLocation] = useState("")
  const [formBrand, setFormBrand] = useState("")
  const [formModel, setFormModel] = useState("")
  const [formSerial, setFormSerial] = useState("")
  const [formPurchaseDate, setFormPurchaseDate] = useState("")
  const [formPurchasePrice, setFormPurchasePrice] = useState("")
  const [formEstimatedValue, setFormEstimatedValue] = useState("")
  const [formWarrantyExpires, setFormWarrantyExpires] = useState("")
  const [formNotes, setFormNotes] = useState("")

  const [maintenanceTarget, setMaintenanceTarget] = useState<{ id: string; name: string } | null>(null)
  const [maintenanceDate, setMaintenanceDate] = useState("")
  const [maintenanceDesc, setMaintenanceDesc] = useState("")
  const [maintenanceCost, setMaintenanceCost] = useState("")
  const [maintenanceProvider, setMaintenanceProvider] = useState("")

  const filtered = useMemo(() => {
    return items.filter((item: any) => {
      const q = search.toLowerCase()
      if (
        q &&
        !item.name.toLowerCase().includes(q) &&
        !(item.brand ?? "").toLowerCase().includes(q) &&
        !(item.model ?? "").toLowerCase().includes(q) &&
        !item.location.toLowerCase().includes(q)
      )
        return false
      if (categoryFilter !== "all" && item.category !== categoryFilter) return false
      if (locationFilter !== "all" && item.location !== locationFilter) return false
      return true
    })
  }, [items, search, categoryFilter, locationFilter])

  const uniqueLocations = useMemo(() => {
    return [...new Set(items.map((i: any) => i.location))].sort()
  }, [items])

  const now = new Date()
  const ninetyDaysFromNow = new Date()
  ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90)

  const totalItems = items.length
  const totalEstimatedValue = items.reduce((sum: number, i: any) => sum + (i.estimated_value ?? 0), 0)
  const warrantiesExpiring = items.filter(
    (i: any) => i.warranty_expires_at && new Date(i.warranty_expires_at) >= now && new Date(i.warranty_expires_at) <= ninetyDaysFromNow
  ).length
  const pendingMaintenance = items.filter((i: any) => (i.maintenance_history ?? []).length === 0).length

  const handleAdd = () => {
    if (!formName.trim() || !formLocation.trim()) return
    createItem.mutate({
      name: formName,
      category: formCategory,
      location: formLocation,
      brand: formBrand,
      model: formModel,
      serial: formSerial,
      purchase_date: formPurchaseDate,
      purchase_price: formPurchasePrice ? Number(formPurchasePrice) : null,
      estimated_value: formEstimatedValue ? Number(formEstimatedValue) : null,
      warranty_expires_at: formWarrantyExpires || null,
      notes: formNotes,
    }, {
      onSuccess: () => {
        setOpenForm(false)
        resetForm()
      },
    })
  }

  const resetForm = () => {
    setFormName("")
    setFormCategory("appliance")
    setFormLocation("")
    setFormBrand("")
    setFormModel("")
    setFormSerial("")
    setFormPurchaseDate("")
    setFormPurchasePrice("")
    setFormEstimatedValue("")
    setFormWarrantyExpires("")
    setFormNotes("")
  }

  const handleAddMaintenance = () => {
    if (!maintenanceTarget || !maintenanceDate || !maintenanceDesc.trim()) return
    addMtn.mutate({
      itemId: maintenanceTarget.id,
      data: {
        item_id: maintenanceTarget.id,
        date: maintenanceDate,
        description: maintenanceDesc,
        cost: maintenanceCost ? Number(maintenanceCost) : null,
        provider: maintenanceProvider,
      },
    }, {
      onSuccess: () => {
        setMaintenanceTarget(null)
        resetMaintenanceForm()
      },
    })
  }

  const resetMaintenanceForm = () => {
    setMaintenanceDate("")
    setMaintenanceDesc("")
    setMaintenanceCost("")
    setMaintenanceProvider("")
  }

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    deleteItem.mutate(id)
  }

  const isExpired = (date: string | null | undefined) => date && new Date(date) < now
  const isExpiringSoon = (date: string | null | undefined) => date && new Date(date) >= now && new Date(date) <= ninetyDaysFromNow

  const isReady = !householdLoading && !isLoading

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inventario del hogar</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Electrodomésticos, muebles, electrónicos y más
          </p>
        </div>
        <Button size="sm" onClick={() => setOpenForm(true)}>
          <Plus className="h-4 w-4 mr-1" /> Agregar artículo
        </Button>
      </div>

      {!isReady ? (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
          <LoadingSkeleton rows={2} />
          <LoadingSkeleton rows={2} />
          <LoadingSkeleton rows={2} />
          <LoadingSkeleton rows={2} />
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
          <StatCard title="Total artículos" value={String(totalItems)} icon={Tag} />
          <StatCard
            title="Valor estimado"
            value={formatMoney(totalEstimatedValue)}
            icon={Home}
            subtitle="Valor actual"
          />
          <StatCard
            title="Garantías por vencer"
            value={String(warrantiesExpiring)}
            icon={ShieldAlert}
            trend={warrantiesExpiring > 0 ? "down" : "neutral"}
            subtitle="Próximos 90 días"
          />
          <StatCard
            title="Sin mantenimiento"
            value={String(pendingMaintenance)}
            icon={Wrench}
            trend={pendingMaintenance > 0 ? "neutral" : "up"}
            subtitle="Artículos sin registro"
          />
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, marca, modelo o ubicación..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v ?? "all")}>
          <SelectTrigger className="w-full sm:w-44">
            <Filter className="h-4 w-4" />
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={locationFilter} onValueChange={(v) => setLocationFilter(v ?? "all")}>
          <SelectTrigger className="w-full sm:w-44">
            <Home className="h-4 w-4" />
            <SelectValue placeholder="Ubicación" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {uniqueLocations.map((loc: string) => (
              <SelectItem key={loc} value={loc}>
                {loc}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!isReady ? (
        <LoadingSkeleton rows={6} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Tag}
          title="Sin artículos"
          description="No se encontraron artículos con los filtros actuales"
          actionLabel="Agregar artículo"
          onAction={() => setOpenForm(true)}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item: any) => {
            const Icon = categoryIcons[item.category] || Home
            const expanded = expandedId === item.id
            const warrantyExpired = isExpired(item.warranty_expires_at)
            const warrantySoon = isExpiringSoon(item.warranty_expires_at)
            const history = item.maintenance_history ?? []

            return (
              <div key={item.id}>
                <Card
                  className={cn(
                    "hover:shadow-md transition-shadow cursor-pointer",
                    expanded && "ring-2 ring-primary"
                  )}
                  onClick={() => setExpandedId(expanded ? null : item.id)}
                >
                  <CardContent className="py-4 px-5">
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0",
                          item.category === "appliance" && "bg-sky-100 dark:bg-sky-900/30 text-sky-600",
                          item.category === "furniture" && "bg-amber-100 dark:bg-amber-900/30 text-amber-600",
                          item.category === "electronics" && "bg-violet-100 dark:bg-violet-900/30 text-violet-600",
                          item.category === "other" && "bg-muted text-muted-foreground"
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium">{item.name}</p>
                          <Badge variant={categoryBadgeVariants[item.category]} className="text-[10px]">
                            {CATEGORY_LABELS[item.category]}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1">
                            <Home className="h-3 w-3" /> {item.location}
                          </span>
                          {item.brand && <span>{item.brand}</span>}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          {item.purchase_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" /> {formatShortDate(item.purchase_date)}
                            </span>
                          )}
                          {item.estimated_value != null && (
                            <span className="font-medium text-foreground">
                              {formatMoney(item.estimated_value)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          {warrantyExpired && (
                            <Badge variant="destructive" className="text-[10px] gap-1">
                              <ShieldAlert className="h-3 w-3" /> Garantía vencida
                            </Badge>
                          )}
                          {warrantySoon && !warrantyExpired && (
                            <Badge
                              className="text-[10px] gap-1 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0"
                            >
                              <Calendar className="h-3 w-3" /> Vence {formatShortDate(item.warranty_expires_at!)}
                            </Badge>
                          )}
                          {history.length === 0 && (
                            <Badge variant="outline" className="text-[10px] text-muted-foreground">
                              Sin mantenimiento
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        className="text-muted-foreground hover:text-destructive flex-shrink-0"
                        onClick={(e) => handleDelete(e, item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {expanded && (
                      <div className="mt-4 pt-4 border-t space-y-3">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {item.brand && (
                            <div>
                              <span className="text-muted-foreground">Marca</span>
                              <p className="font-medium">{item.brand}</p>
                            </div>
                          )}
                          {item.model && (
                            <div>
                              <span className="text-muted-foreground">Modelo</span>
                              <p className="font-medium truncate">{item.model}</p>
                            </div>
                          )}
                          {item.serial && (
                            <div>
                              <span className="text-muted-foreground">Serial</span>
                              <p className="font-medium text-[11px]">{item.serial}</p>
                            </div>
                          )}
                          {item.purchase_price != null && (
                            <div>
                              <span className="text-muted-foreground">Precio original</span>
                              <p className="font-medium">{formatMoney(item.purchase_price)}</p>
                            </div>
                          )}
                          {item.purchase_price != null && item.estimated_value != null && (
                            <div>
                              <span className="text-muted-foreground">Depreciación</span>
                              <p className="font-medium text-muted-foreground">
                                {formatMoney(item.purchase_price - item.estimated_value)}
                              </p>
                            </div>
                          )}
                          {item.warranty_expires_at && (
                            <div>
                              <span className="text-muted-foreground">Garantía</span>
                              <p
                                className={cn(
                                  "font-medium",
                                  warrantyExpired && "text-destructive",
                                  warrantySoon && "text-amber-600"
                                )}
                              >
                                {formatShortDate(item.warranty_expires_at)}
                                {warrantyExpired ? " (vencida)" : warrantySoon ? " (pronto)" : ""}
                              </p>
                            </div>
                          )}
                        </div>

                        {item.notes && (
                          <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-2">
                            {item.notes}
                          </div>
                        )}

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium">Historial de mantenimiento</span>
                            <Button
                              variant="ghost"
                              size="xs"
                              onClick={(e) => {
                                e.stopPropagation()
                                setMaintenanceTarget(item)
                              }}
                            >
                              <Plus className="h-3 w-3 mr-1" /> Registrar
                            </Button>
                          </div>
                          {history.length === 0 ? (
                            <p className="text-xs text-muted-foreground">Sin registros de mantenimiento</p>
                          ) : (
                            <div className="space-y-2">
                              {history.map((m: any, idx: number) => (
                                <div key={m.id ?? idx} className="text-xs border rounded-lg p-2">
                                  <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-1 font-medium">
                                      <Wrench className="h-3 w-3" /> {m.description}
                                    </span>
                                    <span className="text-muted-foreground">{formatShortDate(m.date)}</span>
                                  </div>
                                  <div className="flex items-center gap-2 mt-0.5 text-muted-foreground">
                                    {m.provider && <span>{m.provider}</span>}
                                    {m.cost != null && <span>{formatMoney(m.cost)}</span>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )
          })}
        </div>
      )}

      <Dialog open={openForm} onOpenChange={setOpenForm}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Agregar artículo</DialogTitle>
            <DialogDescription>Registra un nuevo artículo en el inventario del hogar</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2 max-h-[60vh] overflow-y-auto pr-1">
            <div className="grid gap-2">
              <Label htmlFor="item-name">Nombre del artículo</Label>
              <Input
                id="item-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Ej: Lavadora Samsung"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Categoría</Label>
                <Select
                  value={formCategory}
                  onValueChange={(v) =>
                    setFormCategory(v as "appliance" | "furniture" | "electronics" | "other")
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Ubicación</Label>
                <Select value={formLocation} onValueChange={(v) => setFormLocation(v ?? "")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {locationOptions.map((loc) => (
                      <SelectItem key={loc} value={loc}>
                        {loc}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="item-brand">Marca</Label>
                <Input
                  id="item-brand"
                  value={formBrand}
                  onChange={(e) => setFormBrand(e.target.value)}
                  placeholder="Samsung, LG..."
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="item-model">Modelo</Label>
                <Input
                  id="item-model"
                  value={formModel}
                  onChange={(e) => setFormModel(e.target.value)}
                  placeholder="WW90T554DAW"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="item-serial">Número de serie</Label>
              <Input
                id="item-serial"
                value={formSerial}
                onChange={(e) => setFormSerial(e.target.value)}
                placeholder="SN-2024-8821"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="item-purchase-date">Fecha de compra</Label>
                <Input
                  id="item-purchase-date"
                  type="date"
                  value={formPurchaseDate}
                  onChange={(e) => setFormPurchaseDate(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="item-purchase-price">Precio de compra</Label>
                <Input
                  id="item-purchase-price"
                  type="number"
                  value={formPurchasePrice}
                  onChange={(e) => setFormPurchasePrice(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="item-estimated-value">Valor estimado actual</Label>
                <Input
                  id="item-estimated-value"
                  type="number"
                  value={formEstimatedValue}
                  onChange={(e) => setFormEstimatedValue(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="item-warranty">Garantía hasta</Label>
                <Input
                  id="item-warranty"
                  type="date"
                  value={formWarrantyExpires}
                  onChange={(e) => setFormWarrantyExpires(e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="item-notes">Notas</Label>
              <Textarea
                id="item-notes"
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="Detalles adicionales..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setOpenForm(false); resetForm() }}>
              Cancelar
            </Button>
            <Button onClick={handleAdd} disabled={!formName.trim() || !formLocation.trim() || createItem.isPending}>
              <Plus className="h-4 w-4 mr-1" /> {createItem.isPending ? "Agregando..." : "Agregar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={maintenanceTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setMaintenanceTarget(null)
            resetMaintenanceForm()
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar mantenimiento</DialogTitle>
            <DialogDescription>
              {maintenanceTarget ? (
                <>
                  Agrega un registro de mantenimiento para{" "}
                  <span className="font-medium text-foreground">{maintenanceTarget.name}</span>
                </>
              ) : (
                "Agrega un registro de mantenimiento"
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="maintenance-date">Fecha</Label>
              <Input
                id="maintenance-date"
                type="date"
                value={maintenanceDate}
                onChange={(e) => setMaintenanceDate(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="maintenance-desc">Descripción</Label>
              <Input
                id="maintenance-desc"
                value={maintenanceDesc}
                onChange={(e) => setMaintenanceDesc(e.target.value)}
                placeholder="Ej: Cambio de filtro, limpieza general..."
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="maintenance-cost">Costo</Label>
                <Input
                  id="maintenance-cost"
                  type="number"
                  value={maintenanceCost}
                  onChange={(e) => setMaintenanceCost(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="maintenance-provider">Proveedor</Label>
                <Input
                  id="maintenance-provider"
                  value={maintenanceProvider}
                  onChange={(e) => setMaintenanceProvider(e.target.value)}
                  placeholder="Técnico autorizado..."
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setMaintenanceTarget(null)
                resetMaintenanceForm()
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAddMaintenance}
              disabled={!maintenanceDate || !maintenanceDesc.trim() || addMtn.isPending}
            >
              <Wrench className="h-4 w-4 mr-1" /> {addMtn.isPending ? "Registrando..." : "Registrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
