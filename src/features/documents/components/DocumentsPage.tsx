"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
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
import { StatCard } from "@/components/data/StatCard"
import { EmptyState } from "@/components/data/EmptyState"
import { LoadingSkeleton } from "@/components/data/LoadingSkeleton"
import {
  FileText,
  Search,
  Upload,
  FolderOpen,
  FileWarning,
  Calendar,
  Download,
  Filter,
  Receipt,
  ShieldCheck,
  FileSignature,
  Star,
  FileArchive,
  Trash2,
} from "lucide-react"
import { formatShortDate, cn } from "@/lib/utils"
import { useHousehold } from "@/lib/use-household"
import { KIND_LABELS, FOLDER_LABELS, type DocumentKind, type DocumentFolder } from "../schemas"
import { useDocuments, useCreateDocument, useDeleteDocument } from "../queries"

const kindIcons: Record<string, React.ElementType> = {
  bill: Receipt,
  warranty: ShieldCheck,
  contract: FileSignature,
  important: Star,
  other: FileArchive,
}

const kindBadgeVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  bill: "outline",
  warranty: "secondary",
  contract: "destructive",
  important: "default",
  other: "outline",
}

function formatSize(kb: number): string {
  if (kb >= 1024) return `${(kb / 1024).toFixed(1)} MB`
  return `${kb.toFixed(0)} KB`
}

export function DocumentsPage() {
  const router = useRouter()
  const { householdId, isLoading: householdLoading } = useHousehold()
  const { data: documents = [], isLoading } = useDocuments(householdId || null)
  const createDoc = useCreateDocument()
  const deleteDoc = useDeleteDocument()

  const [search, setSearch] = useState("")
  const [kindFilter, setKindFilter] = useState("all")
  const [folderFilter, setFolderFilter] = useState("all")
  const [openForm, setOpenForm] = useState(false)
  const [newName, setNewName] = useState("")
  const [newKind, setNewKind] = useState<DocumentKind>("other")
  const [newFolder, setNewFolder] = useState<DocumentFolder>("Facturas")
  const [newTags, setNewTags] = useState("")
  const [uploadedFile, setUploadedFile] = useState("")

  const filtered = useMemo(() => {
    return documents.filter((d) => {
      if (search && !d.name.toLowerCase().includes(search.toLowerCase()) && !(d.tags ?? []).some((t: string) => t.toLowerCase().includes(search.toLowerCase()))) return false
      if (kindFilter !== "all" && d.kind !== kindFilter) return false
      if (folderFilter !== "all" && d.folder !== folderFilter) return false
      return true
    })
  }, [documents, search, kindFilter, folderFilter])

  const now = new Date()
  const ninetyDaysFromNow = new Date()
  ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90)

  const totalDocs = documents.length
  const warrantiesExpiring = documents.filter(
    (d) => d.kind === "warranty" && d.expires_at && new Date(d.expires_at) >= now && new Date(d.expires_at) <= ninetyDaysFromNow
  ).length
  const billsThisMonth = documents.filter((d) => {
    if (d.kind !== "bill") return false
    const dDate = new Date(d.date)
    return dDate.getMonth() === now.getMonth() && dDate.getFullYear() === now.getFullYear()
  }).length

  const handleCreate = () => {
    if (!newName.trim()) return
    createDoc.mutate({
      name: newName,
      kind: newKind,
      folder: newFolder,
      size_kb: Math.floor(Math.random() * 3000) + 50,
      date: new Date().toISOString().split("T")[0],
      expires_at: null,
      tags: newTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    }, {
      onSuccess: () => {
        setOpenForm(false)
        setNewName("")
        setNewKind("other")
        setNewFolder("Facturas")
        setNewTags("")
        setUploadedFile("")
      },
    })
  }

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    deleteDoc.mutate(id)
  }

  const isReady = !householdLoading && !isLoading

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Documentos</h1>
          <p className="text-muted-foreground text-sm mt-1">Gestiona facturas, garantías, contratos y archivos importantes</p>
        </div>
        <Button size="sm" onClick={() => setOpenForm(true)}>
          <Upload className="h-4 w-4 mr-1" /> Subir documento
        </Button>

        <Dialog open={openForm} onOpenChange={setOpenForm}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Subir documento</DialogTitle>
              <DialogDescription>Carga un nuevo documento a tu archivo digital</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label htmlFor="doc-name">Nombre del documento</Label>
                <Input
                  id="doc-name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ej: Factura electricidad julio.pdf"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label>Tipo</Label>
                  <Select value={newKind} onValueChange={(v) => v && setNewKind(v as DocumentKind)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(KIND_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Carpeta</Label>
                  <Select value={newFolder} onValueChange={(v) => v && setNewFolder(v as DocumentFolder)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(FOLDER_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="doc-tags">Etiquetas</Label>
                <Input
                  id="doc-tags"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  placeholder="electricidad, servicio (separar con coma)"
                />
              </div>
              <div className="grid gap-2">
                <Label>Archivo</Label>
                <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-2 text-muted-foreground transition-colors hover:border-primary/50 cursor-pointer bg-muted/30">
                  <Upload className="h-8 w-8" />
                  <p className="text-sm font-medium">{uploadedFile || "Arrastra un archivo o haz clic para seleccionar"}</p>
                  <p className="text-xs">PDF, JPG, PNG, DOCX (máx. 10 MB)</p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenForm(false)}>Cancelar</Button>
              <Button onClick={handleCreate} disabled={!newName.trim() || createDoc.isPending}>
                <Upload className="h-4 w-4 mr-1" /> {createDoc.isPending ? "Subiendo..." : "Subir"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {!isReady ? (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3">
          <LoadingSkeleton rows={2} />
          <LoadingSkeleton rows={2} />
          <LoadingSkeleton rows={2} />
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3">
          <StatCard title="Documentos totales" value={String(totalDocs)} icon={FolderOpen} />
          <StatCard
            title="Garantías por vencer"
            value={String(warrantiesExpiring)}
            subtitle="Próximos 90 días"
            icon={FileWarning}
            trend={warrantiesExpiring > 0 ? "down" : "neutral"}
          />
          <StatCard
            title="Facturas este mes"
            value={String(billsThisMonth)}
            subtitle={now.toLocaleDateString("es-DO", { month: "long", year: "numeric" })}
            icon={Receipt}
          />
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o etiqueta..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={kindFilter} onValueChange={(v) => setKindFilter(v ?? "all")}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {Object.entries(KIND_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={folderFilter} onValueChange={(v) => setFolderFilter(v ?? "all")}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Carpeta" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {Object.entries(FOLDER_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!isReady ? (
        <LoadingSkeleton rows={6} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No hay documentos"
          description="No se encontraron documentos con los filtros actuales"
          actionLabel="Subir documento"
          onAction={() => setOpenForm(true)}
        />
      ) : (
        <div className="grid gap-3">
          {filtered.map((doc) => {
            const Icon = kindIcons[doc.kind] || FileText
            const isExpiringSoon =
              doc.expires_at && new Date(doc.expires_at) >= now && new Date(doc.expires_at) <= ninetyDaysFromNow
            const isExpired = doc.expires_at && new Date(doc.expires_at) < now

            return (
              <Card
                key={doc.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push(`/documents/${doc.id}`)}
              >
                <CardContent className="flex items-center gap-4 py-4 px-5">
                  <div
                    className={cn(
                      "h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0",
                      doc.kind === "bill" && "bg-blue-100 dark:bg-blue-900/30 text-blue-600",
                      doc.kind === "warranty" && "bg-amber-100 dark:bg-amber-900/30 text-amber-600",
                      doc.kind === "contract" && "bg-rose-100 dark:bg-rose-900/30 text-rose-600",
                      doc.kind === "important" && "bg-violet-100 dark:bg-violet-900/30 text-violet-600",
                      doc.kind === "other" && "bg-muted text-muted-foreground",
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium truncate">{doc.name}</p>
                      <Badge variant={kindBadgeVariants[doc.kind]} className="text-[10px]">
                        {KIND_LABELS[doc.kind]}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        {doc.folder}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> {formatShortDate(doc.date)}
                      </span>
                      <span>{formatSize(doc.size_kb)}</span>
                      {(doc.tags ?? []).length > 0 && (
                        <span className="flex items-center gap-1">
                          <Filter className="h-3 w-3" />
                          {(doc.tags ?? []).slice(0, 3).join(", ")}
                          {(doc.tags ?? []).length > 3 && ` +${(doc.tags ?? []).length - 3}`}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isExpired && (
                      <Badge variant="destructive" className="text-[10px] gap-1">
                        <FileWarning className="h-3 w-3" /> Vencido
                      </Badge>
                    )}
                    {isExpiringSoon && !isExpired && (
                      <Badge variant="secondary" className="text-[10px] gap-1 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0">
                        <Calendar className="h-3 w-3" /> Vence {formatShortDate(doc.expires_at!)}
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="text-muted-foreground hover:text-primary"
                      onClick={(e) => {
                        e.stopPropagation()
                      }}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={(e) => handleDelete(e, doc.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
