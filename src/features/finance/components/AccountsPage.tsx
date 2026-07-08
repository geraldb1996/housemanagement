"use client"

import { StatCard } from "@/components/data/StatCard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { EmptyState } from "@/components/data/EmptyState"
import { LoadingSkeleton } from "@/components/data/LoadingSkeleton"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, PiggyBank, Wallet, CreditCard, Search, Pencil } from "lucide-react"
import { formatMoney, cn } from "@/lib/utils"
import { useHousehold } from "@/lib/use-household"
import { useAccounts, useCreateAccount, useCorrectAccountBalance } from "@/features/finance/queries"
import { useState } from "react"

const types = ["all", "bank", "cash", "savings", "credit_card"] as const

const typeIcons: Record<string, typeof Wallet> = { bank: Wallet, cash: Wallet, savings: PiggyBank, credit_card: CreditCard }

export function AccountsPage() {
  const { householdId } = useHousehold()
  const { data: accounts, isLoading, isError, error } = useAccounts(householdId)
  const createAccount = useCreateAccount()
  const correctBalance = useCorrectAccountBalance()

  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [openForm, setOpenForm] = useState(false)
  const [balanceDialog, setBalanceDialog] = useState<string | null>(null)
  const [newBalance, setNewBalance] = useState("")
  const [createCorrectionTx, setCreateCorrectionTx] = useState(true)

  const [formName, setFormName] = useState("")
  const [formType, setFormType] = useState<"cash" | "bank" | "savings" | "credit_card">("bank")
  const [formInstitution, setFormInstitution] = useState("")
  const [formBalance, setFormBalance] = useState("")
  const [formCurrency, setFormCurrency] = useState("NIO")

  const list = accounts ?? []

  const filtered = list.filter(a => {
    if (search && !a.name.toLowerCase().includes(search.toLowerCase())) return false
    if (typeFilter !== "all" && a.account_type !== typeFilter) return false
    return true
  })

  const total = list.reduce((s, a) => s + Number(a.current_balance ?? a.opening_balance), 0)

  function handleSubmit() {
    createAccount.mutate({
      name: formName,
      account_type: formType,
      institution: formInstitution || undefined,
      opening_balance: Number(formBalance) || 0,
      currency: formCurrency,
      is_archived: false,
      include_in_net_worth: true,
    }, {
      onSuccess: () => {
        setOpenForm(false)
        setFormName("")
        setFormType("bank")
        setFormInstitution("")
        setFormBalance("")
        setFormCurrency("NIO")
      },
    })
  }

  function openDialog() {
    setFormName("")
    setFormType("bank")
    setFormInstitution("")
    setFormBalance("")
    setFormCurrency("NIO")
    setOpenForm(true)
  }

  function openBalanceDialog(accountId: string, currentBalance: number) {
    setNewBalance(String(Math.round(currentBalance * 100) / 100))
    setCreateCorrectionTx(true)
    setBalanceDialog(accountId)
  }

  function handleBalanceCorrection() {
    if (!balanceDialog || !newBalance) return
    correctBalance.mutate({
      accountId: balanceDialog,
      newBalance: Number(newBalance),
      createCorrectionTx,
    }, {
      onSuccess: () => {
        setBalanceDialog(null)
        setNewBalance("")
      },
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Cuentas</h1>
            <p className="text-muted-foreground text-sm mt-1">Tus cuentas de banco, efectivo, ahorros y cr&eacute;dito</p>
          </div>
        </div>
        <LoadingSkeleton rows={4} />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Cuentas</h1>
        <EmptyState icon={Wallet} title="Error al cargar" description={error?.message ?? "Intenta de nuevo"} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cuentas</h1>
          <p className="text-muted-foreground text-sm mt-1">Tus cuentas de banco, efectivo, ahorros y cr&eacute;dito</p>
        </div>
        <Button size="sm" onClick={openDialog}>
          <Plus className="h-4 w-4 mr-1" /> Agregar cuenta
        </Button>
      </div>

      <StatCard title="Balance total" value={formatMoney(total, "NIO")} icon={PiggyBank} trend={total >= 0 ? "up" : "down"} />

      <div className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar..." className="pl-8" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v ?? "all")}>
          <SelectTrigger className="w-[130px] h-9 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {types.map(t => <SelectItem key={t} value={t}>{t === "all" ? "Todos" : t.replace("_", " ")}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Wallet} title="Sin cuentas" actionLabel="Agregar cuenta" onAction={openDialog} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map(a => {
            const Icon = typeIcons[a.account_type] || Wallet
            const balance = a.current_balance ?? a.opening_balance
            return (
              <Card key={a.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ backgroundColor: (a.color || "#888") + "20" }}>
                      <Icon className="h-5 w-5" style={{ color: a.color || "#888" }} />
                    </div>
                    <Badge variant="secondary" className="text-[10px] capitalize">{a.account_type.replace("_", " ")}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="font-semibold">{a.name}</p>
                  {a.institution && <p className="text-xs text-muted-foreground mt-0.5">{a.institution}</p>}
                  <p className={cn("text-lg font-bold mt-2", Number(balance) < 0 ? "text-red-600" : "text-emerald-600")}>
                    {formatMoney(Number(balance), a.currency)}
                  </p>
                  <div className="flex justify-end mt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={(e) => {
                        e.stopPropagation()
                        openBalanceDialog(a.id, Number(balance))
                      }}
                    >
                      <Pencil className="h-3 w-3 mr-1" /> Editar balance
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={openForm} onOpenChange={setOpenForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva cuenta</DialogTitle>
            <DialogDescription>Agrega una cuenta de banco, efectivo, ahorros o tarjeta</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="space-y-1"><Label>Nombre</Label><Input placeholder="Ej: Banco Principal" value={formName} onChange={e => setFormName(e.target.value)} /></div>
            <div className="space-y-1">
              <Label>Tipo</Label>
              <Select value={formType} onValueChange={(v) => { if (v) setFormType(v as "cash" | "bank" | "savings" | "credit_card") }}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank">Banco</SelectItem>
                  <SelectItem value="cash">Efectivo</SelectItem>
                  <SelectItem value="savings">Ahorros</SelectItem>
                  <SelectItem value="credit_card">Tarjeta de cr&eacute;dito</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Saldo inicial</Label><Input type="number" placeholder="0.00" value={formBalance} onChange={e => setFormBalance(e.target.value)} /></div>
              <div className="space-y-1"><Label>Moneda</Label><Select value={formCurrency} onValueChange={(v) => { if (v) setFormCurrency(v) }}><SelectTrigger><SelectValue placeholder="NIO" /></SelectTrigger><SelectContent><SelectItem value="NIO">NIO (C$)</SelectItem><SelectItem value="USD">USD</SelectItem></SelectContent></Select></div>
            </div>
            <div className="space-y-1"><Label>Instituci&oacute;n</Label><Input placeholder="Opcional" value={formInstitution} onChange={e => setFormInstitution(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenForm(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={createAccount.isPending || !formName.trim()}>
              {createAccount.isPending ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!balanceDialog} onOpenChange={(open) => { if (!open) setBalanceDialog(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Corregir balance</DialogTitle>
            <DialogDescription>
              {(() => {
                const a = list.find(ac => ac.id === balanceDialog)
                if (!a) return ""
                return `${a.name} · Balance actual: ${formatMoney(Number(a.current_balance ?? a.opening_balance), a.currency)}`
              })()}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-1">
              <Label>Nuevo balance</Label>
              <Input
                type="number"
                step="0.01"
                value={newBalance}
                onChange={(e) => setNewBalance(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo de correcci&oacute;n</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={createCorrectionTx ? "default" : "outline"}
                  size="sm"
                  className="h-auto py-2 flex-col gap-1 text-xs"
                  onClick={() => setCreateCorrectionTx(true)}
                >
                  <span className="font-medium">Con transacción</span>
                  <span className="text-[10px] opacity-70">Queda registrado en el ledger</span>
                </Button>
                <Button
                  variant={!createCorrectionTx ? "default" : "outline"}
                  size="sm"
                  className="h-auto py-2 flex-col gap-1 text-xs"
                  onClick={() => setCreateCorrectionTx(false)}
                >
                  <span className="font-medium">Solo corregir</span>
                  <span className="text-[10px] opacity-70">Ajusta el balance directamente</span>
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBalanceDialog(null)}>Cancelar</Button>
            <Button onClick={handleBalanceCorrection} disabled={correctBalance.isPending || !newBalance}>
              {correctBalance.isPending ? "Corrigiendo..." : "Corregir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
