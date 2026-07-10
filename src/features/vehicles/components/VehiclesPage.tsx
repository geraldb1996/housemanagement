"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
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
  Car,
  Trash2,
  Filter,
  ShieldCheck,
  Calendar,
  Wrench,
  Hash,
  Pencil,
} from "lucide-react"
import { formatMoney, formatShortDate, cn } from "@/lib/utils"
import { useHousehold } from "@/lib/use-household"
import { FUEL_LABELS } from "../schemas"
import { useVehicles, useCreateVehicle, useUpdateVehicle, useDeleteVehicle, useAddServiceRecord, useDeleteServiceRecord } from "../queries"

export function VehiclesPage() {
  const { householdId, isLoading: householdLoading } = useHousehold()
  const { data: vehicles = [], isLoading } = useVehicles(householdId || null)
  const createVehicle = useCreateVehicle()
  const updateVehicle = useUpdateVehicle()
  const deleteVehicle = useDeleteVehicle()
  const addService = useAddServiceRecord()
  const deleteService = useDeleteServiceRecord()

  const [search, setSearch] = useState("")
  const [fuelFilter, setFuelFilter] = useState("all")
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const [openForm, setOpenForm] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<any | null>(null)
  const [formName, setFormName] = useState("")
  const [formBrand, setFormBrand] = useState("")
  const [formModel, setFormModel] = useState("")
  const [formYear, setFormYear] = useState("")
  const [formPlate, setFormPlate] = useState("")
  const [formVin, setFormVin] = useState("")
  const [formColor, setFormColor] = useState("")
  const [formFuel, setFormFuel] = useState<"gasoline" | "diesel" | "electric" | "hybrid" | "other">("gasoline")
  const [formInsCo, setFormInsCo] = useState("")
  const [formInsPolicy, setFormInsPolicy] = useState("")
  const [formInsExpires, setFormInsExpires] = useState("")
  const [formPurchaseDate, setFormPurchaseDate] = useState("")
  const [formPurchasePrice, setFormPurchasePrice] = useState("")
  const [formNotes, setFormNotes] = useState("")

  const [serviceTarget, setServiceTarget] = useState<{ id: string; name: string } | null>(null)
  const [serviceDate, setServiceDate] = useState("")
  const [serviceDesc, setServiceDesc] = useState("")
  const [serviceMileage, setServiceMileage] = useState("")
  const [serviceCost, setServiceCost] = useState("")
  const [serviceProvider, setServiceProvider] = useState("")
  const [serviceNotes, setServiceNotes] = useState("")

  const filtered = useMemo(() => {
    return vehicles.filter((v: any) => {
      const q = search.toLowerCase()
      if (
        q &&
        !v.name.toLowerCase().includes(q) &&
        !(v.brand ?? "").toLowerCase().includes(q) &&
        !(v.model ?? "").toLowerCase().includes(q) &&
        !(v.plate ?? "").toLowerCase().includes(q)
      )
        return false
      if (fuelFilter !== "all" && v.fuel_type !== fuelFilter) return false
      return true
    })
  }, [vehicles, search, fuelFilter])

  const total = vehicles.length
  const insuranceExpiring = vehicles.filter(
    (v: any) => v.insurance_expires_at && new Date(v.insurance_expires_at) >= new Date() && new Date(v.insurance_expires_at) <= new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
  ).length
  const needsService = vehicles.filter((v: any) => (v.service_records ?? []).length === 0).length
  const totalValue = vehicles.reduce((sum: number, v: any) => sum + (v.purchase_price ?? 0), 0)

  const handleSave = () => {
    if (!formName.trim()) return
    const data = {
      name: formName,
      brand: formBrand,
      model: formModel,
      year: formYear ? Number(formYear) : null,
      plate: formPlate,
      vin: formVin,
      color: formColor,
      fuel_type: formFuel,
      insurance_company: formInsCo,
      insurance_policy: formInsPolicy,
      insurance_expires_at: formInsExpires || null,
      purchase_date: formPurchaseDate,
      purchase_price: formPurchasePrice ? Number(formPurchasePrice) : null,
      notes: formNotes,
    }
    if (editingVehicle) {
      updateVehicle.mutate({ id: editingVehicle.id, data }, {
        onSuccess: () => {
          setOpenForm(false)
          setEditingVehicle(null)
          resetForm()
        },
      })
    } else {
      createVehicle.mutate(data, {
        onSuccess: () => {
          setOpenForm(false)
          resetForm()
        },
      })
    }
  }

  const openEditForm = (v: any) => {
    setEditingVehicle(v)
    setFormName(v.name)
    setFormBrand(v.brand ?? "")
    setFormModel(v.model ?? "")
    setFormYear(v.year ? String(v.year) : "")
    setFormPlate(v.plate ?? "")
    setFormVin(v.vin ?? "")
    setFormColor(v.color ?? "")
    setFormFuel(v.fuel_type ?? "gasoline")
    setFormInsCo(v.insurance_company ?? "")
    setFormInsPolicy(v.insurance_policy ?? "")
    setFormInsExpires(v.insurance_expires_at ?? "")
    setFormPurchaseDate(v.purchase_date ?? "")
    setFormPurchasePrice(v.purchase_price != null ? String(v.purchase_price) : "")
    setFormNotes(v.notes ?? "")
    setOpenForm(true)
  }

  const handleCloseForm = () => {
    setOpenForm(false)
    setEditingVehicle(null)
    resetForm()
  }

  const resetForm = () => {
    setFormName("")
    setFormBrand("")
    setFormModel("")
    setFormYear("")
    setFormPlate("")
    setFormVin("")
    setFormColor("")
    setFormFuel("gasoline")
    setFormInsCo("")
    setFormInsPolicy("")
    setFormInsExpires("")
    setFormPurchaseDate("")
    setFormPurchasePrice("")
    setFormNotes("")
  }

  const handleAddService = () => {
    if (!serviceTarget || !serviceDate || !serviceDesc.trim()) return
    addService.mutate({
      vehicleId: serviceTarget.id,
      data: {
        vehicle_id: serviceTarget.id,
        date: serviceDate,
        description: serviceDesc,
        mileage: serviceMileage ? Number(serviceMileage) : null,
        cost: serviceCost ? Number(serviceCost) : null,
        provider: serviceProvider,
        notes: serviceNotes,
      },
    }, {
      onSuccess: () => {
        setServiceTarget(null)
        resetServiceForm()
      },
    })
  }

  const resetServiceForm = () => {
    setServiceDate("")
    setServiceDesc("")
    setServiceMileage("")
    setServiceCost("")
    setServiceProvider("")
    setServiceNotes("")
  }

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    deleteVehicle.mutate(id)
  }

  const isReady = !householdLoading && !isLoading

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Vehículos</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Perfiles de tus vehículos, seguro y servicio
          </p>
        </div>
        <Button size="sm" onClick={() => setOpenForm(true)}>
          <Plus className="h-4 w-4 mr-1" /> Agregar vehículo
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
          <StatCard title="Total vehículos" value={String(total)} icon={Car} />
          <StatCard title="Valor total" value={formatMoney(totalValue)} icon={Hash} subtitle="Precio de compra" />
          <StatCard title="Seguro por vencer" value={String(insuranceExpiring)} icon={ShieldCheck} trend={insuranceExpiring > 0 ? "down" : "neutral"} subtitle="Próximos 90 días" />
          <StatCard title="Sin servicio" value={String(needsService)} icon={Wrench} trend={needsService > 0 ? "neutral" : "up"} subtitle="Sin registros" />
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, marca, modelo o placa..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={fuelFilter} onValueChange={(v) => setFuelFilter(v ?? "all")}>
          <SelectTrigger className="w-full sm:w-44">
            <Filter className="h-4 w-4" />
            <SelectValue placeholder="Combustible" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {Object.entries(FUEL_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!isReady ? (
        <LoadingSkeleton rows={6} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Car}
          title="Sin vehículos"
          description={search || fuelFilter !== "all" ? "No se encontraron vehículos con los filtros actuales" : "Agrega tu primer vehículo"}
          actionLabel="Agregar vehículo"
          onAction={() => setOpenForm(true)}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((v: any) => {
            const expanded = expandedId === v.id
            const services = v.service_records ?? []
            const insExpired = v.insurance_expires_at && new Date(v.insurance_expires_at) < new Date()
            const insSoon = v.insurance_expires_at && new Date(v.insurance_expires_at) >= new Date() && new Date(v.insurance_expires_at) <= new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)

            return (
              <div key={v.id}>
                <Card
                  className={cn(
                    "hover:shadow-md transition-shadow cursor-pointer",
                    expanded && "ring-2 ring-primary"
                  )}
                  onClick={() => setExpandedId(expanded ? null : v.id)}
                >
                  <CardContent className="py-4 px-5">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center flex-shrink-0">
                        <Car className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium">{v.name}</p>
                          <Badge variant="outline" className="text-[10px]">
                            {FUEL_LABELS[v.fuel_type]}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground flex-wrap">
                          {v.brand && <span>{v.brand}</span>}
                          {v.model && <span>· {v.model}</span>}
                          {v.year && <span>· {v.year}</span>}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          {v.plate && <span>{v.plate}</span>}
                          {v.color && <span>· {v.color}</span>}
                          {v.purchase_price != null && <span className="font-medium text-foreground">{formatMoney(v.purchase_price)}</span>}
                        </div>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          {insExpired && (
                            <Badge variant="destructive" className="text-[10px] gap-1">
                              <ShieldCheck className="h-3 w-3" /> Seguro vencido
                            </Badge>
                          )}
                          {insSoon && !insExpired && (
                            <Badge className="text-[10px] gap-1 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0">
                              <Calendar className="h-3 w-3" /> Seguro vence {formatShortDate(v.insurance_expires_at!)}
                            </Badge>
                          )}
                          {services.length === 0 && (
                            <Badge variant="outline" className="text-[10px] text-muted-foreground">
                              Sin servicio
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        className="text-muted-foreground hover:text-destructive flex-shrink-0"
                        onClick={(e) => handleDelete(e, v.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {expanded && (
                      <div className="mt-4 pt-4 border-t space-y-3">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {v.brand && (
                            <div>
                              <span className="text-muted-foreground">Marca</span>
                              <p className="font-medium">{v.brand}</p>
                            </div>
                          )}
                          {v.model && (
                            <div>
                              <span className="text-muted-foreground">Modelo</span>
                              <p className="font-medium">{v.model}</p>
                            </div>
                          )}
                          {v.year && (
                            <div>
                              <span className="text-muted-foreground">Año</span>
                              <p className="font-medium">{v.year}</p>
                            </div>
                          )}
                          {v.vin && (
                            <div>
                              <span className="text-muted-foreground">VIN</span>
                              <p className="font-medium text-[11px]">{v.vin}</p>
                            </div>
                          )}
                          {v.insurance_company && (
                            <div>
                              <span className="text-muted-foreground">Aseguradora</span>
                              <p className="font-medium">{v.insurance_company}</p>
                            </div>
                          )}
                          {v.insurance_policy && (
                            <div>
                              <span className="text-muted-foreground">Póliza</span>
                              <p className="font-medium">{v.insurance_policy}</p>
                            </div>
                          )}
                          {v.insurance_expires_at && (
                            <div>
                              <span className="text-muted-foreground">Seguro vence</span>
                              <p className={cn("font-medium", insExpired && "text-destructive", insSoon && "text-amber-600")}>
                                {formatShortDate(v.insurance_expires_at)}
                              </p>
                            </div>
                          )}
                          {v.purchase_date && (
                            <div>
                              <span className="text-muted-foreground">Compra</span>
                              <p className="font-medium">{formatShortDate(v.purchase_date)}</p>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="xs"
                            className="flex-1"
                            onClick={(e) => {
                              e.stopPropagation()
                              openEditForm(v)
                            }}
                          >
                            <Pencil className="h-3 w-3 mr-1" /> Editar
                          </Button>
                          <Button
                            variant="outline"
                            size="xs"
                            className="flex-1 text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(e as any, v.id)
                            }}
                          >
                            <Trash2 className="h-3 w-3 mr-1" /> Eliminar
                          </Button>
                        </div>

                        {v.notes && (
                          <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-2">
                            {v.notes}
                          </div>
                        )}

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium">Historial de servicio</span>
                            <Button
                              variant="ghost"
                              size="xs"
                              onClick={(e) => {
                                e.stopPropagation()
                                setServiceTarget(v)
                              }}
                            >
                              <Plus className="h-3 w-3 mr-1" /> Registrar
                            </Button>
                          </div>
                          {services.length === 0 ? (
                            <p className="text-xs text-muted-foreground">Sin registros de servicio</p>
                          ) : (
                            <div className="space-y-2">
                              {services.map((s: any, idx: number) => (
                                <div key={s.id ?? idx} className="text-xs border rounded-lg p-2">
                                  <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-1 font-medium">
                                      <Wrench className="h-3 w-3" /> {s.description}
                                    </span>
                                    <div className="flex items-center gap-1">
                                      <span className="text-muted-foreground">{formatShortDate(s.date)}</span>
                                      <button
                                        className="text-muted-foreground hover:text-destructive"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          deleteService.mutate(s.id)
                                        }}
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </button>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 mt-0.5 text-muted-foreground">
                                    {s.mileage != null && <span>{s.mileage.toLocaleString()} km</span>}
                                    {s.provider && <span>· {s.provider}</span>}
                                    {s.cost != null && <span>· {formatMoney(s.cost)}</span>}
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

      <Dialog open={openForm} onOpenChange={(open) => { if (!open) handleCloseForm() }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingVehicle ? "Editar vehículo" : "Agregar vehículo"}</DialogTitle>
            <DialogDescription>{editingVehicle ? `Modifica los datos de ${editingVehicle.name}` : "Registra un nuevo vehículo en tu hogar"}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2 max-h-[60vh] overflow-y-auto pr-1">
            <div className="grid gap-2">
              <Label htmlFor="vehicle-name">Nombre</Label>
              <Input id="vehicle-name" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Ej: El Honda, Camioneta..." />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="vehicle-brand">Marca</Label>
                <Input id="vehicle-brand" value={formBrand} onChange={(e) => setFormBrand(e.target.value)} placeholder="Honda" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="vehicle-model">Modelo</Label>
                <Input id="vehicle-model" value={formModel} onChange={(e) => setFormModel(e.target.value)} placeholder="Civic" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="vehicle-year">Año</Label>
                <Input id="vehicle-year" type="number" value={formYear} onChange={(e) => setFormYear(e.target.value)} placeholder="2024" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="vehicle-plate">Placa</Label>
                <Input id="vehicle-plate" value={formPlate} onChange={(e) => setFormPlate(e.target.value)} placeholder="ABC-1234" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="vehicle-color">Color</Label>
                <Input id="vehicle-color" value={formColor} onChange={(e) => setFormColor(e.target.value)} placeholder="Blanco" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="vehicle-vin">VIN (Número de serie)</Label>
              <Input id="vehicle-vin" value={formVin} onChange={(e) => setFormVin(e.target.value)} placeholder="1HGCM82633A004352" />
            </div>
            <div className="grid gap-2">
              <Label>Combustible</Label>
              <Select value={formFuel} onValueChange={(v) => setFormFuel(v as "gasoline" | "diesel" | "electric" | "hybrid" | "other")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(FUEL_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="vehicle-ins-co">Aseguradora</Label>
                <Input id="vehicle-ins-co" value={formInsCo} onChange={(e) => setFormInsCo(e.target.value)} placeholder="Quálitas, GNP..." />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="vehicle-ins-policy">Póliza</Label>
                <Input id="vehicle-ins-policy" value={formInsPolicy} onChange={(e) => setFormInsPolicy(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="vehicle-ins-expires">Seguro vence</Label>
                <Input id="vehicle-ins-expires" type="date" value={formInsExpires} onChange={(e) => setFormInsExpires(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="vehicle-purchase-date">Fecha de compra</Label>
                <Input id="vehicle-purchase-date" type="date" value={formPurchaseDate} onChange={(e) => setFormPurchaseDate(e.target.value)} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="vehicle-purchase-price">Precio de compra</Label>
              <Input id="vehicle-purchase-price" type="number" value={formPurchasePrice} onChange={(e) => setFormPurchasePrice(e.target.value)} placeholder="0.00" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="vehicle-notes">Notas</Label>
              <Textarea id="vehicle-notes" value={formNotes} onChange={(e) => setFormNotes(e.target.value)} placeholder="Detalles adicionales..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseForm}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!formName.trim() || createVehicle.isPending || updateVehicle.isPending}>
              {editingVehicle ? (
                <>{updateVehicle.isPending ? "Guardando..." : "Guardar cambios"}</>
              ) : (
                <><Plus className="h-4 w-4 mr-1" /> {createVehicle.isPending ? "Agregando..." : "Agregar"}</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={serviceTarget !== null}
        onOpenChange={(open) => {
          if (!open) { setServiceTarget(null); resetServiceForm() }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar servicio</DialogTitle>
            <DialogDescription>
              {serviceTarget ? (
                <>Nuevo servicio para <span className="font-medium text-foreground">{serviceTarget.name}</span></>
              ) : "Nuevo servicio"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="service-date">Fecha</Label>
              <Input id="service-date" type="date" value={serviceDate} onChange={(e) => setServiceDate(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="service-desc">Descripción</Label>
              <Input id="service-desc" value={serviceDesc} onChange={(e) => setServiceDesc(e.target.value)} placeholder="Ej: Cambio de aceite, afinación..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="service-mileage">Kilometraje</Label>
                <Input id="service-mileage" type="number" value={serviceMileage} onChange={(e) => setServiceMileage(e.target.value)} placeholder="0" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="service-cost">Costo</Label>
                <Input id="service-cost" type="number" value={serviceCost} onChange={(e) => setServiceCost(e.target.value)} placeholder="0.00" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="service-provider">Proveedor / Taller</Label>
              <Input id="service-provider" value={serviceProvider} onChange={(e) => setServiceProvider(e.target.value)} placeholder="Nombre del taller" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="service-notes">Notas</Label>
              <Textarea id="service-notes" value={serviceNotes} onChange={(e) => setServiceNotes(e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setServiceTarget(null); resetServiceForm() }}>Cancelar</Button>
            <Button onClick={handleAddService} disabled={!serviceDate || !serviceDesc.trim() || addService.isPending}>
              <Wrench className="h-4 w-4 mr-1" /> {addService.isPending ? "Registrando..." : "Registrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
