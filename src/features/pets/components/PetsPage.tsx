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
  Dog,
  Cat,
  Bird,
  Fish,
  Syringe,
  Stethoscope,
  Calendar,
  Trash2,
  Filter,
  PawPrint,
  Weight,
  Pencil,
} from "lucide-react"
import { formatShortDate, formatMoney, cn } from "@/lib/utils"
import { useHousehold } from "@/lib/use-household"
import { SPECIES_LABELS } from "../schemas"
import { usePets, useCreatePet, useUpdatePet, useDeletePet, useAddMedicalRecord, useAddVaccination, useDeleteMedicalRecord, useDeleteVaccination } from "../queries"

const speciesIcons: Record<string, React.ElementType> = {
  dog: Dog,
  cat: Cat,
  bird: Bird,
  fish: Fish,
  rodent: PawPrint,
  reptile: PawPrint,
  other: PawPrint,
}

const speciesBadgeVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  dog: "default",
  cat: "secondary",
  bird: "outline",
  fish: "outline",
  rodent: "outline",
  reptile: "destructive",
  other: "outline",
}

const speciesColors: Record<string, string> = {
  dog: "bg-amber-100 dark:bg-amber-900/30 text-amber-600",
  cat: "bg-orange-100 dark:bg-orange-900/30 text-orange-600",
  bird: "bg-sky-100 dark:bg-sky-900/30 text-sky-600",
  fish: "bg-blue-100 dark:bg-blue-900/30 text-blue-600",
  rodent: "bg-green-100 dark:bg-green-900/30 text-green-600",
  reptile: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600",
  other: "bg-muted text-muted-foreground",
}

export function PetsPage() {
  const { householdId, isLoading: householdLoading } = useHousehold()
  const { data: pets = [], isLoading } = usePets(householdId || null)
  const createPet = useCreatePet()
  const updatePet = useUpdatePet()
  const deletePet = useDeletePet()
  const addMedRec = useAddMedicalRecord()
  const deleteMedRec = useDeleteMedicalRecord()
  const addVax = useAddVaccination()
  const deleteVax = useDeleteVaccination()

  const [search, setSearch] = useState("")
  const [speciesFilter, setSpeciesFilter] = useState("all")
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const [openForm, setOpenForm] = useState(false)
  const [editingPet, setEditingPet] = useState<any | null>(null)
  const [formName, setFormName] = useState("")
  const [formSpecies, setFormSpecies] = useState<"dog" | "cat" | "bird" | "fish" | "rodent" | "reptile" | "other">("dog")
  const [formBreed, setFormBreed] = useState("")
  const [formColor, setFormColor] = useState("")
  const [formBirthDate, setFormBirthDate] = useState("")
  const [formWeight, setFormWeight] = useState("")
  const [formMicrochip, setFormMicrochip] = useState("")
  const [formVetName, setFormVetName] = useState("")
  const [formVetPhone, setFormVetPhone] = useState("")
  const [formNotes, setFormNotes] = useState("")

  const [medRecTarget, setMedRecTarget] = useState<{ id: string; name: string } | null>(null)
  const [medRecDate, setMedRecDate] = useState("")
  const [medRecDesc, setMedRecDesc] = useState("")
  const [medRecVet, setMedRecVet] = useState("")
  const [medRecCost, setMedRecCost] = useState("")
  const [medRecNotes, setMedRecNotes] = useState("")

  const [vaxTarget, setVaxTarget] = useState<{ id: string; name: string } | null>(null)
  const [vaxName, setVaxName] = useState("")
  const [vaxDate, setVaxDate] = useState("")
  const [vaxNextDue, setVaxNextDue] = useState("")
  const [vaxVet, setVaxVet] = useState("")
  const [vaxBatch, setVaxBatch] = useState("")
  const [vaxNotes, setVaxNotes] = useState("")

  const filtered = useMemo(() => {
    return pets.filter((pet: any) => {
      const q = search.toLowerCase()
      if (
        q &&
        !pet.name.toLowerCase().includes(q) &&
        !(pet.breed ?? "").toLowerCase().includes(q) &&
        !(pet.color ?? "").toLowerCase().includes(q)
      )
        return false
      if (speciesFilter !== "all" && pet.species !== speciesFilter) return false
      return true
    })
  }, [pets, search, speciesFilter])

  const totalPets = pets.length
  const overdueVaccines = pets.filter((p: any) =>
    (p.vaccinations ?? []).some((v: any) => v.next_due_date && new Date(v.next_due_date) < new Date())
  ).length
  const upcomingVaccines = pets.filter((p: any) =>
    (p.vaccinations ?? []).some((v: any) => {
      if (!v.next_due_date) return false
      const d = new Date(v.next_due_date)
      const future = new Date()
      future.setDate(future.getDate() + 90)
      return d >= new Date() && d <= future
    })
  ).length

  const handleSave = () => {
    if (!formName.trim()) return
    const data = {
      name: formName,
      species: formSpecies,
      breed: formBreed,
      color: formColor,
      birth_date: formBirthDate,
      weight_kg: formWeight ? Number(formWeight) : null,
      microchip_id: formMicrochip,
      vet_name: formVetName,
      vet_phone: formVetPhone,
      notes: formNotes,
    }
    if (editingPet) {
      updatePet.mutate({ id: editingPet.id, data }, {
        onSuccess: () => {
          setOpenForm(false)
          setEditingPet(null)
          resetForm()
        },
      })
    } else {
      createPet.mutate(data, {
        onSuccess: () => {
          setOpenForm(false)
          resetForm()
        },
      })
    }
  }

  const openEditForm = (pet: any) => {
    setEditingPet(pet)
    setFormName(pet.name)
    setFormSpecies(pet.species)
    setFormBreed(pet.breed ?? "")
    setFormColor(pet.color ?? "")
    setFormBirthDate(pet.birth_date ?? "")
    setFormWeight(pet.weight_kg != null ? String(pet.weight_kg) : "")
    setFormMicrochip(pet.microchip_id ?? "")
    setFormVetName(pet.vet_name ?? "")
    setFormVetPhone(pet.vet_phone ?? "")
    setFormNotes(pet.notes ?? "")
    setOpenForm(true)
  }

  const handleCloseForm = () => {
    setOpenForm(false)
    setEditingPet(null)
    resetForm()
  }

  const resetForm = () => {
    setFormName("")
    setFormSpecies("dog")
    setFormBreed("")
    setFormColor("")
    setFormBirthDate("")
    setFormWeight("")
    setFormMicrochip("")
    setFormVetName("")
    setFormVetPhone("")
    setFormNotes("")
  }

  const handleAddMedRec = () => {
    if (!medRecTarget || !medRecDate || !medRecDesc.trim()) return
    addMedRec.mutate({
      petId: medRecTarget.id,
      data: {
        pet_id: medRecTarget.id,
        date: medRecDate,
        description: medRecDesc,
        vet_name: medRecVet,
        cost: medRecCost ? Number(medRecCost) : null,
        notes: medRecNotes,
      },
    }, {
      onSuccess: () => {
        setMedRecTarget(null)
        resetMedRecForm()
      },
    })
  }

  const resetMedRecForm = () => {
    setMedRecDate("")
    setMedRecDesc("")
    setMedRecVet("")
    setMedRecCost("")
    setMedRecNotes("")
  }

  const handleAddVax = () => {
    if (!vaxTarget || !vaxName.trim() || !vaxDate) return
    addVax.mutate({
      petId: vaxTarget.id,
      data: {
        pet_id: vaxTarget.id,
        vaccine_name: vaxName,
        date_administered: vaxDate,
        next_due_date: vaxNextDue || null,
        vet_name: vaxVet,
        batch_number: vaxBatch,
        notes: vaxNotes,
      },
    }, {
      onSuccess: () => {
        setVaxTarget(null)
        resetVaxForm()
      },
    })
  }

  const resetVaxForm = () => {
    setVaxName("")
    setVaxDate("")
    setVaxNextDue("")
    setVaxVet("")
    setVaxBatch("")
    setVaxNotes("")
  }

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    deletePet.mutate(id)
  }

  const isReady = !householdLoading && !isLoading

  const getAge = (birthDate: string | null) => {
    if (!birthDate) return null
    const diff = Date.now() - new Date(birthDate).getTime()
    const years = Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000))
    if (years > 0) return `${years} año${years > 1 ? "s" : ""}`
    const months = Math.floor(diff / (30.44 * 24 * 60 * 60 * 1000))
    if (months > 0) return `${months} mes${months > 1 ? "es" : ""}`
    return "Recién nacido"
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mascotas</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Perfiles de tus mascotas, vacunas y registros médicos
          </p>
        </div>
        <Button size="sm" onClick={() => setOpenForm(true)}>
          <Plus className="h-4 w-4 mr-1" /> Agregar mascota
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
          <StatCard title="Total mascotas" value={String(totalPets)} icon={PawPrint} />
          <StatCard title="Vacunas vencidas" value={String(overdueVaccines)} icon={Syringe} trend={overdueVaccines > 0 ? "down" : "neutral"} subtitle="Requieren atención" />
          <StatCard title="Próximas vacunas" value={String(upcomingVaccines)} icon={Calendar} subtitle="Próximos 90 días" />
          <StatCard title="Veterinario" value={formVetName || "—"} icon={Stethoscope} subtitle="Contacto" />
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, raza o color..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={speciesFilter} onValueChange={(v) => setSpeciesFilter(v ?? "all")}>
          <SelectTrigger className="w-full sm:w-44">
            <Filter className="h-4 w-4" />
            <SelectValue placeholder="Especie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {Object.entries(SPECIES_LABELS).map(([key, label]) => (
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
          icon={PawPrint}
          title="Sin mascotas"
          description={search || speciesFilter !== "all" ? "No se encontraron mascotas con los filtros actuales" : "Agrega tu primera mascota"}
          actionLabel="Agregar mascota"
          onAction={() => setOpenForm(true)}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((pet: any) => {
            const Icon = speciesIcons[pet.species] || PawPrint
            const expanded = expandedId === pet.id
            const medRecs = pet.medical_records ?? []
            const vaxes = pet.vaccinations ?? []

            return (
              <div key={pet.id}>
                <Card
                  className={cn(
                    "hover:shadow-md transition-shadow cursor-pointer",
                    expanded && "ring-2 ring-primary"
                  )}
                  onClick={() => setExpandedId(expanded ? null : pet.id)}
                >
                  <CardContent className="py-4 px-5">
                    <div className="flex items-start gap-3">
                      <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0", speciesColors[pet.species] || "bg-muted text-muted-foreground")}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium">{pet.name}</p>
                          <Badge variant={speciesBadgeVariants[pet.species]} className="text-[10px]">
                            {SPECIES_LABELS[pet.species]}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground flex-wrap">
                          {pet.breed && <span>{pet.breed}</span>}
                          {pet.color && <span>· {pet.color}</span>}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          {getAge(pet.birth_date) && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" /> {getAge(pet.birth_date)}
                            </span>
                          )}
                          {pet.weight_kg != null && (
                            <span className="flex items-center gap-1">
                              <Weight className="h-3 w-3" /> {pet.weight_kg} kg
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          {vaxes.length === 0 && (
                            <Badge variant="outline" className="text-[10px] text-muted-foreground">
                              Sin vacunas
                            </Badge>
                          )}
                          {vaxes.some((v: any) => v.next_due_date && new Date(v.next_due_date) < new Date()) && (
                            <Badge variant="destructive" className="text-[10px] gap-1">
                              <Syringe className="h-3 w-3" /> Vacuna vencida
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        className="text-muted-foreground hover:text-destructive flex-shrink-0"
                        onClick={(e) => handleDelete(e, pet.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {expanded && (
                      <div className="mt-4 pt-4 border-t space-y-3">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {pet.breed && (
                            <div>
                              <span className="text-muted-foreground">Raza</span>
                              <p className="font-medium">{pet.breed}</p>
                            </div>
                          )}
                          {pet.color && (
                            <div>
                              <span className="text-muted-foreground">Color</span>
                              <p className="font-medium">{pet.color}</p>
                            </div>
                          )}
                          {pet.birth_date && (
                            <div>
                              <span className="text-muted-foreground">Fecha de nacimiento</span>
                              <p className="font-medium">{formatShortDate(pet.birth_date)}</p>
                            </div>
                          )}
                          {pet.weight_kg != null && (
                            <div>
                              <span className="text-muted-foreground">Peso</span>
                              <p className="font-medium">{pet.weight_kg} kg</p>
                            </div>
                          )}
                          {pet.microchip_id && (
                            <div>
                              <span className="text-muted-foreground">Microchip</span>
                              <p className="font-medium text-[11px]">{pet.microchip_id}</p>
                            </div>
                          )}
                          {(pet.vet_name || pet.vet_phone) && (
                            <div>
                              <span className="text-muted-foreground">Veterinario</span>
                              <p className="font-medium">{pet.vet_name}{pet.vet_phone ? ` · ${pet.vet_phone}` : ""}</p>
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
                              openEditForm(pet)
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
                              handleDelete(e as any, pet.id)
                            }}
                          >
                            <Trash2 className="h-3 w-3 mr-1" /> Eliminar
                          </Button>
                        </div>

                        {pet.notes && (
                          <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-2">
                            {pet.notes}
                          </div>
                        )}

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium">Vacunas</span>
                            <Button
                              variant="ghost"
                              size="xs"
                              onClick={(e) => {
                                e.stopPropagation()
                                setVaxTarget(pet)
                              }}
                            >
                              <Plus className="h-3 w-3 mr-1" /> Agregar
                            </Button>
                          </div>
                          {vaxes.length === 0 ? (
                            <p className="text-xs text-muted-foreground">Sin vacunas registradas</p>
                          ) : (
                            <div className="space-y-2">
                              {vaxes.map((v: any, idx: number) => (
                                <div key={v.id ?? idx} className="text-xs border rounded-lg p-2">
                                  <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-1 font-medium">
                                      <Syringe className="h-3 w-3" /> {v.vaccine_name}
                                    </span>
                                    <div className="flex items-center gap-1">
                                      <span className="text-muted-foreground">{formatShortDate(v.date_administered)}</span>
                                      <button
                                        className="text-muted-foreground hover:text-destructive"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          deleteVax.mutate(v.id)
                                        }}
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </button>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 mt-0.5 text-muted-foreground">
                                    {v.next_due_date && (
                                      <span className={cn(new Date(v.next_due_date) < new Date() ? "text-destructive font-medium" : "")}>
                                        Próxima: {formatShortDate(v.next_due_date)}
                                      </span>
                                    )}
                                    {v.vet_name && <span>· {v.vet_name}</span>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium">Historial médico</span>
                            <Button
                              variant="ghost"
                              size="xs"
                              onClick={(e) => {
                                e.stopPropagation()
                                setMedRecTarget(pet)
                              }}
                            >
                              <Plus className="h-3 w-3 mr-1" /> Registrar
                            </Button>
                          </div>
                          {medRecs.length === 0 ? (
                            <p className="text-xs text-muted-foreground">Sin registros médicos</p>
                          ) : (
                            <div className="space-y-2">
                              {medRecs.map((m: any, idx: number) => (
                                <div key={m.id ?? idx} className="text-xs border rounded-lg p-2">
                                  <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-1 font-medium">
                                      <Stethoscope className="h-3 w-3" /> {m.description}
                                    </span>
                                    <div className="flex items-center gap-1">
                                      <span className="text-muted-foreground">{formatShortDate(m.date)}</span>
                                      <button
                                        className="text-muted-foreground hover:text-destructive"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          deleteMedRec.mutate(m.id)
                                        }}
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </button>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 mt-0.5 text-muted-foreground">
                                    {m.vet_name && <span>{m.vet_name}</span>}
                                    {m.cost != null && <span>· {formatMoney(m.cost)}</span>}
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
            <DialogTitle>{editingPet ? "Editar mascota" : "Agregar mascota"}</DialogTitle>
            <DialogDescription>{editingPet ? `Modifica los datos de ${editingPet.name}` : "Registra una nueva mascota en tu hogar"}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2 max-h-[60vh] overflow-y-auto pr-1">
            <div className="grid gap-2">
              <Label htmlFor="pet-name">Nombre</Label>
              <Input
                id="pet-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Ej: Luna, Max..."
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Especie</Label>
                <Select
                  value={formSpecies}
                  onValueChange={(v) => setFormSpecies(v as "dog" | "cat" | "bird" | "fish" | "rodent" | "reptile" | "other")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(SPECIES_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="pet-breed">Raza</Label>
                <Input
                  id="pet-breed"
                  value={formBreed}
                  onChange={(e) => setFormBreed(e.target.value)}
                  placeholder="Ej: Labrador, Persa..."
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="pet-color">Color</Label>
                <Input
                  id="pet-color"
                  value={formColor}
                  onChange={(e) => setFormColor(e.target.value)}
                  placeholder="Ej: Blanco, Café..."
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="pet-birth">Fecha de nacimiento</Label>
                <Input
                  id="pet-birth"
                  type="date"
                  value={formBirthDate}
                  onChange={(e) => setFormBirthDate(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="pet-weight">Peso (kg)</Label>
                <Input
                  id="pet-weight"
                  type="number"
                  value={formWeight}
                  onChange={(e) => setFormWeight(e.target.value)}
                  placeholder="0.00"
                  step="0.1"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="pet-microchip">Microchip</Label>
                <Input
                  id="pet-microchip"
                  value={formMicrochip}
                  onChange={(e) => setFormMicrochip(e.target.value)}
                  placeholder="Número de identificación"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="pet-vet">Veterinario</Label>
                <Input
                  id="pet-vet"
                  value={formVetName}
                  onChange={(e) => setFormVetName(e.target.value)}
                  placeholder="Nombre del vet."
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="pet-vet-phone">Teléfono del vet.</Label>
                <Input
                  id="pet-vet-phone"
                  value={formVetPhone}
                  onChange={(e) => setFormVetPhone(e.target.value)}
                  placeholder="+52 555..."
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pet-notes">Notas</Label>
              <Textarea
                id="pet-notes"
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="Alergias, cuidados especiales..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseForm}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={!formName.trim() || createPet.isPending || updatePet.isPending}>
              {editingPet ? (
                <>{updatePet.isPending ? "Guardando..." : "Guardar cambios"}</>
              ) : (
                <><Plus className="h-4 w-4 mr-1" /> {createPet.isPending ? "Agregando..." : "Agregar"}</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={medRecTarget !== null}
        onOpenChange={(open) => {
          if (!open) { setMedRecTarget(null); resetMedRecForm() }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Registro médico</DialogTitle>
            <DialogDescription>
              {medRecTarget ? (
                <>Nuevo registro médico para <span className="font-medium text-foreground">{medRecTarget.name}</span></>
              ) : "Nuevo registro médico"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="medrec-date">Fecha</Label>
              <Input id="medrec-date" type="date" value={medRecDate} onChange={(e) => setMedRecDate(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="medrec-desc">Descripción</Label>
              <Input id="medrec-desc" value={medRecDesc} onChange={(e) => setMedRecDesc(e.target.value)} placeholder="Ej: Revisión general, cirugía..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="medrec-vet">Veterinario</Label>
                <Input id="medrec-vet" value={medRecVet} onChange={(e) => setMedRecVet(e.target.value)} placeholder="Nombre" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="medrec-cost">Costo</Label>
                <Input id="medrec-cost" type="number" value={medRecCost} onChange={(e) => setMedRecCost(e.target.value)} placeholder="0.00" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="medrec-notes">Notas</Label>
              <Textarea id="medrec-notes" value={medRecNotes} onChange={(e) => setMedRecNotes(e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setMedRecTarget(null); resetMedRecForm() }}>Cancelar</Button>
            <Button onClick={handleAddMedRec} disabled={!medRecDate || !medRecDesc.trim() || addMedRec.isPending}>
              <Stethoscope className="h-4 w-4 mr-1" /> {addMedRec.isPending ? "Registrando..." : "Registrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={vaxTarget !== null}
        onOpenChange={(open) => {
          if (!open) { setVaxTarget(null); resetVaxForm() }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Agregar vacuna</DialogTitle>
            <DialogDescription>
              {vaxTarget ? (
                <>Nueva vacuna para <span className="font-medium text-foreground">{vaxTarget.name}</span></>
              ) : "Nueva vacuna"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="vax-name">Vacuna</Label>
              <Input id="vax-name" value={vaxName} onChange={(e) => setVaxName(e.target.value)} placeholder="Ej: Rabia, Triple felina..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="vax-date">Fecha de aplicación</Label>
                <Input id="vax-date" type="date" value={vaxDate} onChange={(e) => setVaxDate(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="vax-next">Próxima dosis</Label>
                <Input id="vax-next" type="date" value={vaxNextDue} onChange={(e) => setVaxNextDue(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="vax-vet">Veterinario</Label>
                <Input id="vax-vet" value={vaxVet} onChange={(e) => setVaxVet(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="vax-batch">Lote</Label>
                <Input id="vax-batch" value={vaxBatch} onChange={(e) => setVaxBatch(e.target.value)} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="vax-notes">Notas</Label>
              <Textarea id="vax-notes" value={vaxNotes} onChange={(e) => setVaxNotes(e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setVaxTarget(null); resetVaxForm() }}>Cancelar</Button>
            <Button onClick={handleAddVax} disabled={!vaxName.trim() || !vaxDate || addVax.isPending}>
              <Syringe className="h-4 w-4 mr-1" /> {addVax.isPending ? "Agregando..." : "Agregar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
