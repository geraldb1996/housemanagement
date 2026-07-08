"use client"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Bell, Moon, Search, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"

const quickActions = [
  { label: "Nueva transacci\u00f3n", url: "/finance/transactions" },
  { label: "Nueva lista de compras", url: "/shopping" },
  { label: "Agregar suscripci\u00f3n", url: "/entertainment/subscriptions" },
  { label: "Subir documento", url: "/documents" },
  { label: "Agregar cuenta", url: "/finance/accounts" },
  { label: "Ver presupuestos", url: "/finance/budgets" },
]

export function Topbar({ user }: { user: { email?: string | null; name?: string | null } }) {
  const [cmdOpen, setCmdOpen] = useState(false)
  const { setTheme, theme } = useTheme()
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b bg-background px-3 md:px-4">
      <SidebarTrigger className="-ml-1" />

      <div className="flex-1" />

      <Button
        variant="outline"
        size="sm"
        className="hidden md:flex w-64 lg:w-80 h-8 justify-between text-xs text-muted-foreground font-normal"
        onClick={() => setCmdOpen(true)}
      >
        <div className="flex items-center gap-1.5">
          <Search className="h-3.5 w-3.5" />
          Buscar...
        </div>
        <kbd className="text-[10px] px-1 py-0.5 rounded bg-muted border">Ctrl+K</kbd>
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 md:hidden"
        onClick={() => setCmdOpen(true)}
      >
        <Search className="h-4 w-4" />
      </Button>

      <Button variant="ghost" size="icon" className="h-8 w-8">
        <Bell className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      >
        <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" />
          }
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">
              {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
            {user.email || "Mi cuenta"}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => router.push("/settings")}>
            Ajustes
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive" onClick={handleLogout}>
            Cerrar sesi\u00f3n
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CommandDialog open={cmdOpen} onOpenChange={setCmdOpen}>
        <CommandInput placeholder="Buscar en toda la app..." />
        <CommandList>
          <CommandEmpty>Sin resultados.</CommandEmpty>
          <CommandGroup heading="Acciones r\u00e1pidas">
            {quickActions.map((a) => (
              <CommandItem
                key={a.url}
                onSelect={() => {
                  router.push(a.url)
                  setCmdOpen(false)
                }}
              >
                {a.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </header>
  )
}
