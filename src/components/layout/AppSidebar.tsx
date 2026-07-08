"use client"

import {
  Home,
  PiggyBank,
  ShoppingCart,
  Gamepad2,
  FileText,
  House,
  Calendar,
  Settings,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import Link from "next/link"
import { usePathname } from "next/navigation"

const mainModules = [
  { icon: Home, label: "Inicio", url: "/", activePaths: ["/"] },
  {
    icon: PiggyBank,
    label: "Finanzas",
    url: "/finance",
    activePaths: ["/finance"],
    sub: [
      { label: "Dashboard", url: "/finance" },
      { label: "Transacciones", url: "/finance/transactions" },
      { label: "Obligaciones", url: "/finance/obligations" },
      { label: "Cuentas", url: "/finance/accounts" },
      { label: "Presupuestos", url: "/finance/budgets" },
      { label: "Personas", url: "/finance/people" },
      { label: "Reportes", url: "/finance/reports" },
    ],
  },
  {
    icon: ShoppingCart,
    label: "Compras",
    url: "/shopping",
    activePaths: ["/shopping"],
    sub: [
      { label: "Listas", url: "/shopping" },
      { label: "Productos", url: "/shopping/products" },
    ],
  },
  {
    icon: Gamepad2,
    label: "Entretenimiento",
    url: "/entertainment",
    activePaths: ["/entertainment"],
    sub: [
      { label: "Suscripciones", url: "/entertainment/subscriptions" },
      { label: "Juegos", url: "/entertainment/games" },
      { label: "Watchlist", url: "/entertainment/watchlist" },
    ],
  },
  {
    icon: FileText,
    label: "Documentos",
    url: "/documents",
    activePaths: ["/documents"],
  },
  {
    icon: House,
    label: "Hogar",
    url: "/home",
    activePaths: ["/home"],
  },
  {
    icon: Calendar,
    label: "Calendario",
    url: "/calendar",
    activePaths: ["/calendar"],
  },
  {
    icon: Settings,
    label: "Ajustes",
    url: "/settings",
    activePaths: ["/settings"],
  },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="bg-sidebar px-0">
        <SidebarGroup>
          <SidebarGroupLabel className="text-lg font-bold py-4 px-3 text-sidebar-foreground">
            HOUSE
          </SidebarGroupLabel>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainModules.map((mod) => {
                const isActive =
                  mod.activePaths.length === 1 && mod.activePaths[0] === "/"
                    ? pathname === "/"
                    : mod.activePaths.some((p) => p !== "/" && pathname.startsWith(p))

                return (
                  <SidebarMenuItem key={mod.url}>
                    <SidebarMenuButton
                      render={<Link href={mod.url} />}
                      isActive={isActive}
                      tooltip={mod.label}
                    >
                      <mod.icon />
                      <span>{mod.label}</span>
                    </SidebarMenuButton>
                    {mod.sub && isActive && (
                      <SidebarMenuSub>
                        {mod.sub.map((s) => (
                          <SidebarMenuSubItem key={s.url}>
                            <SidebarMenuSubButton
                              render={<Link href={s.url} />}
                              isActive={pathname === s.url}
                            >
                              {s.label}
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    )}
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
