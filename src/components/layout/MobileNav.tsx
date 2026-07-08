"use client"

import { Home, PiggyBank, ShoppingCart, Gamepad2, Ellipsis } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

const mainTabs = [
  { icon: Home, label: "Inicio", url: "/" },
  { icon: PiggyBank, label: "Finanzas", url: "/finance" },
  { icon: ShoppingCart, label: "Compras", url: "/shopping" },
  { icon: Gamepad2, label: "Entretenimiento", url: "/entertainment" },
]

const moreTabs = [
  { label: "Documentos", url: "/documents" },
  { label: "Hogar", url: "/home" },
  { label: "Calendario", url: "/calendar" },
  { label: "Ajustes", url: "/settings" },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t bg-background safe-bottom">
      <div className="flex items-center justify-around h-14">
        {mainTabs.map((tab) => {
          const active =
            tab.url === "/" ? pathname === "/" : pathname.startsWith(tab.url)
          return (
            <Link
              key={tab.url}
              href={tab.url}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 py-1 text-xs transition-colors",
                active
                  ? "text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <tab.icon className={cn("h-5 w-5", active && "text-primary")} />
              <span>{tab.label}</span>
            </Link>
          )
        })}
        <Sheet>
          <SheetTrigger
            render={
              <button
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 flex-1 py-1 text-xs transition-colors",
                  moreTabs.some((t) => pathname.startsWith(t.url))
                    ? "text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground"
                )}
              />
            }
          >
            <Ellipsis className="h-5 w-5" />
            <span>M&aacute;s</span>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[40vh] rounded-t-xl">
            <SheetHeader>
              <SheetTitle>M&aacute;s opciones</SheetTitle>
            </SheetHeader>
            <div className="grid grid-cols-2 gap-3 mt-6">
              {moreTabs.map((tab) => (
                <Link
                  key={tab.url}
                  href={tab.url}
                  className={cn(
                    "flex items-center justify-center h-14 rounded-lg border text-sm font-medium transition-colors",
                    pathname.startsWith(tab.url)
                      ? "bg-primary/10 border-primary text-primary"
                      : "bg-muted/50 border-border hover:bg-muted"
                  )}
                >
                  {tab.label}
                </Link>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  )
}
