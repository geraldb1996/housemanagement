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
import { StatCard } from "@/components/data/StatCard"
import { EmptyState } from "@/components/data/EmptyState"
import { LoadingSkeleton } from "@/components/data/LoadingSkeleton"
import {
  Plus,
  TrendingDown,
  TrendingUp,
  Target,
  Search,
  Users,
  UserRound,
  ArrowDownToLine,
  ArrowUpFromLine,
} from "lucide-react"
import { formatMoney, cn } from "@/lib/utils"
import { useHousehold } from "@/lib/use-household"
import { usePeople, useCreatePerson } from "@/features/finance/queries"
import { useObligations } from "@/features/finance/queries"
import type { PersonForm } from "@/features/finance/schemas"

const relationshipLabels: Record<string, string> = {
  familia: "Familia",
  amigo: "Amigo/a",
  compañero: "Compañero/a",
  otro: "Otro",
}

const relationshipColors: Record<string, string> = {
  familia:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  amigo:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  compañero:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  otro: "bg-muted text-muted-foreground",
}

export function PeoplePage() {
  const { householdId } = useHousehold()
  const { data: people = [], isLoading } = usePeople(householdId || null)
  const { data: obligations = [] } = useObligations(householdId || null)
  const createPerson = useCreatePerson()

  const [search, setSearch] = useState("")
  const [relationshipFilter, setRelationshipFilter] = useState("all")
  const [openForm, setOpenForm] = useState(false)

  const [formName, setFormName] = useState("")
  const [formRelationship, setFormRelationship] = useState("")

  const personBalances = useMemo(() => {
    const map = new Map<
      string,
      { owedToUs: number; owedByUs: number; count: number }
    >()
    for (const o of obligations) {
      const entry = map.get(o.person_id) ?? {
        owedToUs: 0,
        owedByUs: 0,
        count: 0,
      }
      entry.count += 1
      if (o.direction === "owed_to_us") {
        entry.owedToUs += o.total_amount - o.paid_amount
      } else {
        entry.owedByUs += o.total_amount - o.paid_amount
      }
      map.set(o.person_id, entry)
    }
    return map
  }, [obligations])

  const totalOwedToUs = [...personBalances.values()].reduce(
    (s, b) => s + b.owedToUs,
    0
  )
  const totalOwedByUs = [...personBalances.values()].reduce(
    (s, b) => s + b.owedByUs,
    0
  )
  const totalObligations = obligations.length

  const filtered = useMemo(() => {
    return people.filter((p) => {
      if (
        search &&
        !p.name.toLowerCase().includes(search.toLowerCase())
      )
        return false
      if (
        relationshipFilter !== "all" &&
        p.relationship !== relationshipFilter
      )
        return false
      return true
    })
  }, [people, search, relationshipFilter])

  const handleSubmit = () => {
    if (!formName) return
    const data: PersonForm = {
      name: formName,
      relationship: formRelationship || null,
    }
    createPerson.mutate(data, {
      onSuccess: () => {
        setOpenForm(false)
        setFormName("")
        setFormRelationship("")
      },
    })
  }

  const openDialog = () => {
    setFormName("")
    setFormRelationship("")
    setOpenForm(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Personas</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gestiona deudas y préstamos personales
          </p>
        </div>
        <Dialog open={openForm} onOpenChange={setOpenForm}>
          <DialogTrigger
            render={<Button size="sm" onClick={openDialog} />}
          >
            <Plus className="h-4 w-4 mr-1" /> Agregar persona
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Agregar persona</DialogTitle>
              <DialogDescription>
                Registra una nueva persona con la que tienes deudas o
                préstamos
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="space-y-1">
                <Label htmlFor="person-name">Nombre</Label>
                <Input
                  id="person-name"
                  placeholder="Ej: Juan Pérez"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="person-relationship">Relación</Label>
                <Select
                  value={formRelationship}
                  onValueChange={(v) =>
                    setFormRelationship(v ?? "")
                  }
                >
                  <SelectTrigger id="person-relationship">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="familia">Familia</SelectItem>
                    <SelectItem value="amigo">Amigo/a</SelectItem>
                    <SelectItem value="compañero">
                      Compañero/a
                    </SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setOpenForm(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createPerson.isPending}
              >
                {createPerson.isPending
                  ? "Guardando..."
                  : "Guardar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Nos deben"
          value={formatMoney(totalOwedToUs, "NIO")}
          icon={TrendingUp}
          trend="up"
        />
        <StatCard
          title="Debemos"
          value={formatMoney(totalOwedByUs, "NIO")}
          icon={TrendingDown}
          trend="down"
        />
        <StatCard
          title="Personas"
          value={String(people.length)}
          icon={Users}
        />
        <StatCard
          title="Obligaciones"
          value={String(totalObligations)}
          icon={Target}
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          value={relationshipFilter}
          onValueChange={(v) =>
            setRelationshipFilter(v ?? "all")
          }
        >
          <SelectTrigger className="w-[180px] h-9 text-xs">
            <Users className="h-3 w-3 mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              Todas las relaciones
            </SelectItem>
            <SelectItem value="familia">Familia</SelectItem>
            <SelectItem value="amigo">Amigo/a</SelectItem>
            <SelectItem value="compañero">
              Compañero/a
            </SelectItem>
            <SelectItem value="otro">Otro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <LoadingSkeleton rows={6} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={UserRound}
          title="Sin personas"
          description={
            search || relationshipFilter !== "all"
              ? "Intenta con otros filtros"
              : "Agrega tu primera persona"
          }
          actionLabel={
            !search && relationshipFilter === "all"
              ? "Agregar persona"
              : undefined
          }
          onAction={openDialog}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((person) => {
            const balance = personBalances.get(person.id)
            const owedToUs =
              balance?.owedToUs ?? 0
            const owedByUs =
              balance?.owedByUs ?? 0
            const obligationsCount =
              balance?.count ?? 0
            const hasOwedToUs = owedToUs > 0
            const hasOwedByUs = owedByUs > 0
            const direction =
              hasOwedToUs && hasOwedByUs
                ? owedToUs >= owedByUs
                  ? "owed_to_us"
                  : "owed_by_us"
                : hasOwedToUs
                  ? "owed_to_us"
                  : hasOwedByUs
                    ? "owed_by_us"
                    : null
            const netBalance = owedToUs - owedByUs

            return (
              <Card
                key={person.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0",
                        netBalance >= 0
                          ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30"
                          : "bg-red-100 text-red-600 dark:bg-red-900/30"
                      )}
                    >
                      {netBalance >= 0 ? (
                        <ArrowDownToLine className="h-4 w-4" />
                      ) : (
                        <ArrowUpFromLine className="h-4 w-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="text-sm truncate">
                        {person.name}
                      </CardTitle>
                      {person.relationship && (
                        <span
                          className={cn(
                            "text-[10px] px-1.5 py-0.5 rounded-full font-medium inline-block mt-0.5",
                            relationshipColors[
                              person.relationship
                            ] ?? "bg-muted text-muted-foreground"
                          )}
                        >
                          {
                            relationshipLabels[
                              person.relationship
                            ] ?? person.relationship
                          }
                        </span>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {direction ? (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {hasOwedToUs && hasOwedByUs
                            ? "Neto"
                            : direction === "owed_to_us"
                              ? "Nos debe"
                              : "Debemos"}
                        </span>
                        <span
                          className={cn(
                            "text-lg font-bold",
                            netBalance >= 0
                              ? "text-emerald-600"
                              : "text-red-600"
                          )}
                        >
                          {formatMoney(
                            Math.abs(netBalance),
                            "NIO"
                          )}
                        </span>
                      </div>
                      {owedToUs > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Nos debe:{" "}
                          <span className="text-emerald-600 font-medium">
                            {formatMoney(
                              owedToUs,
                              "NIO"
                            )}
                          </span>
                        </p>
                      )}
                      {owedByUs > 0 && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Debemos:{" "}
                          <span className="text-red-600 font-medium">
                            {formatMoney(
                              owedByUs,
                              "NIO"
                            )}
                          </span>
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Sin obligaciones
                      </span>
                      <span className="text-lg font-bold text-muted-foreground">
                        {formatMoney(0, "NIO")}
                      </span>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    {obligationsCount} obligaci
                    {obligationsCount !== 1
                      ? "ones"
                      : "\u00f3n"}{" "}
                    activa
                    {obligationsCount !== 1 ? "s" : ""}
                  </p>
                </CardContent>
                <CardFooter>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs"
                  >
                    Ver obligaciones
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
