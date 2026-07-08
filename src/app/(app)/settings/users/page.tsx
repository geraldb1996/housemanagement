"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { EmptyState } from "@/components/data/EmptyState"
import { LoadingSkeleton } from "@/components/data/LoadingSkeleton"
import { Plus, Users, User, Trash2, Shield } from "lucide-react"
import { useHousehold } from "@/lib/use-household"
import {
  useHouseholdMembers,
  useAddHouseholdMember,
  useRemoveHouseholdMember,
} from "@/features/settings/queries"
import { formatShortDate, cn } from "@/lib/utils"

export default function UsersPage() {
  const { householdId, userId: currentUserId, isLoading: hhLoading } = useHousehold()
  const { data: members, isLoading: membersLoading } = useHouseholdMembers(householdId || null)
  const addMember = useAddHouseholdMember()
  const removeMember = useRemoveHouseholdMember()

  const [openInvite, setOpenInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")

  const isLoading = hhLoading || membersLoading
  const list = (members ?? []) as any[]

  const isAdmin = list.find((m) => m.user_id === currentUserId)?.role === "admin"

  function handleInvite() {
    if (!inviteEmail.trim()) return
    addMember.mutate(inviteEmail.trim(), {
      onSuccess: () => {
        setOpenInvite(false)
        setInviteEmail("")
      },
    })
  }

  function handleRemove(id: string) {
    if (!confirm("¿Remover este miembro del hogar?")) return
    removeMember.mutate(id)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Usuarios</h1>
          <p className="text-muted-foreground text-sm mt-1">Miembros de tu hogar</p>
        </div>
        <LoadingSkeleton rows={3} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Usuarios</h1>
          <p className="text-muted-foreground text-sm mt-1">Miembros de tu hogar</p>
        </div>
        {isAdmin && (
          <Button size="sm" onClick={() => setOpenInvite(true)}>
            <Plus className="h-4 w-4 mr-1" /> Invitar
          </Button>
        )}
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Sin miembros"
          description="Invita a alguien para que forme parte del hogar"
          actionLabel={isAdmin ? "Invitar miembro" : undefined}
          onAction={isAdmin ? () => setOpenInvite(true) : undefined}
        />
      ) : (
        <div className="grid gap-3">
          {list.map((m: any) => {
            const isSelf = m.user_id === currentUserId
            const isMemberAdmin = m.role === "admin"

            return (
              <Card key={m.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "h-9 w-9 rounded-full flex items-center justify-center",
                          isMemberAdmin
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        <User className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-sm">
                            {m.display_name ?? "Usuario"}
                          </CardTitle>
                          {isSelf && (
                            <Badge variant="secondary" className="text-[10px] h-4 px-1">
                              Tú
                            </Badge>
                          )}
                          {isMemberAdmin && (
                            <Badge className="text-[10px] h-4 px-1 bg-primary/10 text-primary border-primary/20">
                              <Shield className="h-2.5 w-2.5 mr-0.5" />
                              Admin
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Se unió el {formatShortDate(m.joined_at)} ·{" "}
                          {isMemberAdmin ? "Administrador" : "Miembro"}
                        </p>
                      </div>
                    </div>
                    {isAdmin && !isSelf && !isMemberAdmin && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-destructive hover:text-destructive"
                        disabled={removeMember.isPending}
                        onClick={() => handleRemove(m.id)}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Remover
                      </Button>
                    )}
                  </div>
                </CardHeader>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={openInvite} onOpenChange={setOpenInvite}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Invitar miembro</DialogTitle>
            <DialogDescription>
              La persona debe estar registrada con ese email.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-1">
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="persona@email.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleInvite()
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenInvite(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleInvite}
              disabled={addMember.isPending || !inviteEmail.trim()}
            >
              {addMember.isPending ? "Invitando..." : "Invitar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
