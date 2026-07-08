"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Home, Loader2, AlertCircle, CheckCircle2 } from "lucide-react"

export default function OnboardingPage() {
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<"form" | "sql" | "success">("form")
  const router = useRouter()

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await fetch("/api/seed-household", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name || "Mi Hogar" }),
    })

    const json = await res.json()

    if (!res.ok) {
      if (json.error?.includes("does not exist") || json.error?.includes("42P01")) {
        setStep("sql")
        setLoading(false)
        return
      }
      setError(json.error || "Error desconocido")
      setLoading(false)
      return
    }

    setStep("success")
    setLoading(false)
  }

  if (step === "sql") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-muted/40">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-amber-600" />
            </div>
            <CardTitle>Base de datos no configurada</CardTitle>
            <CardDescription>
              Las tablas no existen todav&iacute;a. Ejecuta el SQL en Supabase.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <ol className="list-decimal pl-5 space-y-2">
              <li>Abre el <strong>SQL Editor</strong> en tu dashboard de Supabase</li>
              <li>Copia todo el contenido de <code className="bg-muted px-1 rounded text-xs">.agents/db.md</code></li>
              <li>P&eacute;galo en el editor y ejec&uacute;talo</li>
              <li>Vuelve a esta p&aacute;gina y presiona el bot&oacute;n</li>
            </ol>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={() => { setStep("form"); setLoading(false) }}>
              Ya ejecut&eacute; el SQL, intentar de nuevo
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (step === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-muted/40">
        <Card className="w-full max-w-sm text-center">
          <CardHeader>
            <div className="mx-auto mb-3 h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
            <CardTitle>&iexcl;Todo listo!</CardTitle>
            <CardDescription>Tu hogar ha sido configurado con categor&iacute;as, ciclos de pago y cuenta de efectivo</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button className="w-full" onClick={() => { router.push("/"); router.refresh() }}>
              Ir al dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/40">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 h-10 w-10 rounded-full bg-primary flex items-center justify-center">
            <Home className="h-5 w-5 text-primary-foreground" />
          </div>
          <CardTitle className="text-xl">Configurar tu hogar</CardTitle>
          <CardDescription>Crea tu primer hogar para empezar</CardDescription>
        </CardHeader>
        <form onSubmit={handleCreate}>
          <CardContent className="space-y-3">
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <div className="space-y-1">
              <Label htmlFor="householdName">Nombre del hogar</Label>
              <Input
                id="householdName"
                placeholder="Mi Hogar"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear hogar
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
