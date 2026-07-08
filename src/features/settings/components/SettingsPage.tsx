"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useTheme } from "next-themes"
import { useRouter } from "next/navigation"
import {
  Users,
  Tag,
  Wallet,
  RefreshCw,
  Bell,
  Download,
  Moon,
  Sun,
  ArrowLeftRight,
} from "lucide-react"

export function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const router = useRouter()

  const links = [
    { icon: Users, label: "Usuarios", desc: "Gestiona los miembros del hogar", url: "/settings/users" },
    { icon: Tag, label: "Categorías", desc: "Categorías de ingresos y gastos", url: "/settings/categories" },
    { icon: Wallet, label: "Cuentas", desc: "Configura tus cuentas", url: "/settings/accounts" },
    { icon: ArrowLeftRight, label: "Moneda", desc: "Tasas de cambio para conversión", url: "/settings/currency" },
    { icon: RefreshCw, label: "Ciclos de pago", desc: "Configura quincenas 15/30", url: "/settings/cycles" },
    { icon: Bell, label: "Notificaciones", desc: "Preferencias de avisos", url: "/settings/notifications" },
    { icon: Download, label: "Exportar / Backup", desc: "Descarga tus datos", url: "/settings/export" },
  ]

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Ajustes</h1>
        <p className="text-muted-foreground text-sm mt-1">Configura tu hogar y preferencias</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Apariencia</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {theme === "dark" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              <div>
                <p className="text-sm font-medium">Modo oscuro</p>
                <p className="text-xs text-muted-foreground">
                  {theme === "dark" ? "Activado" : "Desactivado"}
                </p>
              </div>
            </div>
            <Switch
              checked={theme === "dark"}
              onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Configuraci&oacute;n del hogar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {links.map((link, i) => (
            <div key={link.url}>
              <Button
                variant="ghost"
                className="w-full justify-start h-auto py-3 px-2"
                onClick={() => router.push(link.url)}
              >
                <link.icon className="h-5 w-5 mr-3 text-muted-foreground" />
                <div className="text-left">
                  <p className="text-sm font-medium">{link.label}</p>
                  <p className="text-xs text-muted-foreground">{link.desc}</p>
                </div>
              </Button>
              {i < links.length - 1 && <Separator className="ml-10" />}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
