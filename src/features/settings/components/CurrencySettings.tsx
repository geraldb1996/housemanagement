"use client"

import { useState, useEffect, type FormEvent } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useHousehold } from "@/lib/use-household"
import { useExchangeRates, useSaveExchangeRates } from "@/features/settings/queries"
import { Loader2, Plus, Trash2, ArrowLeftRight, Info } from "lucide-react"
import type { ExchangeRateForm } from "@/features/settings/schemas"

const CURRENCY_NAMES: Record<string, string> = {
  NIO: "Córdoba (C$)",
  USD: "Dólar (US$)",
  EUR: "Euro (€)",
  CRC: "Colón costarricense",
  MXN: "Peso mexicano",
  GTQ: "Quetzal",
  HNL: "Lempira",
  COP: "Peso colombiano",
}

const CURRENCY_OPTIONS = Object.keys(CURRENCY_NAMES)

function currencyLabel(code: string) {
  return CURRENCY_NAMES[code] ?? code
}

export function CurrencySettings() {
  const { householdId, isLoading: householdLoading } = useHousehold()
  const { data: savedRates, isLoading: ratesLoading } = useExchangeRates(householdId || null)
  const saveMutation = useSaveExchangeRates()

  const [rates, setRates] = useState<ExchangeRateForm[]>([])
  const [baseCurrency, setBaseCurrency] = useState("NIO")
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    if (savedRates && rates.length === 0) {
      setRates(savedRates)
    }
  }, [savedRates, rates.length])

  useEffect(() => {
    const supabase = (window as any).__SUPABASE__ ?? null
    if (!householdId || supabase) return
  }, [householdId])

  const availableCurrencies = CURRENCY_OPTIONS.filter(
    (c) => c !== baseCurrency && !rates.some((r) => r.currency === c)
  )

  function addRate() {
    const next = availableCurrencies[0]
    if (!next) return
    setRates((prev) => [...prev, { currency: next, rate: 1 }])
    setDirty(true)
  }

  function updateRate(index: number, field: keyof ExchangeRateForm, value: string) {
    setRates((prev) =>
      prev.map((r, i) =>
        i === index ? { ...r, [field]: field === "rate" ? parseFloat(value) || 0 : value } : r
      )
    )
    setDirty(true)
  }

  function removeRate(index: number) {
    setRates((prev) => prev.filter((_, i) => i !== index))
    setDirty(true)
  }

  function handleSave(e: FormEvent) {
    e.preventDefault()
    const validRates = rates.filter((r) => r.currency && r.rate > 0)
    saveMutation.mutate(validRates, {
      onSuccess: () => setDirty(false),
    })
  }

  if (householdLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Loader2 className="h-4 w-4 animate-spin" /> Cargando...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Conversión de moneda</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Configura las tasas de cambio para transferencias entre cuentas de distintas monedas
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Moneda base</CardTitle>
          <CardDescription>
            Es la moneda principal de tu hogar. Las tasas se expresan como cuánto vale 1 unidad de cada moneda en {currencyLabel(baseCurrency)}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 rounded-lg bg-muted/50 px-4 py-3">
            <Info className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <p className="text-sm text-muted-foreground">
              Moneda base: <strong>{baseCurrency}</strong> — {currencyLabel(baseCurrency)}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-medium">Tasas de cambio</CardTitle>
            <CardDescription>
              Ejemplo: si 1 USD = C$36.50, poné USD en moneda y 36.50 en tasa
            </CardDescription>
          </div>
          {availableCurrencies.length > 0 && (
            <Button variant="outline" size="sm" onClick={addRate}>
              <Plus className="h-4 w-4 mr-1" /> Agregar
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {rates.length === 0 && !ratesLoading ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <ArrowLeftRight className="h-8 w-8 text-muted-foreground/60" />
              <p className="text-sm text-muted-foreground">No hay tasas configuradas</p>
              {availableCurrencies.length === 0 ? (
                <p className="text-xs text-muted-foreground">Todas las monedas disponibles ya fueron agregadas</p>
              ) : (
                <Button variant="ghost" size="sm" onClick={addRate}>
                  <Plus className="h-4 w-4 mr-1" /> Agregar moneda
                </Button>
              )}
            </div>
          ) : ratesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-3">
                <div className="grid grid-cols-[1fr_1fr_40px] gap-2 text-xs font-medium text-muted-foreground px-1">
                  <span>Moneda</span>
                  <span>Tasa (1 unidad =)</span>
                  <span />
                </div>
                {rates.map((rate, i) => (
                  <div key={i} className="grid grid-cols-[1fr_1fr_40px] gap-2 items-center">
                    <div>
                      <select
                        value={rate.currency}
                        onChange={(e) => updateRate(i, "currency", e.target.value)}
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <option value={rate.currency}>{currencyLabel(rate.currency)}</option>
                        {CURRENCY_OPTIONS.filter(
                          (c) => c !== baseCurrency && (c === rate.currency || !rates.some((r) => r.currency === c))
                        ).map((c) => (
                          <option key={c} value={c}>{currencyLabel(c)}</option>
                        ))}
                      </select>
                    </div>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                        {baseCurrency}
                      </span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={rate.rate || ""}
                        onChange={(e) => updateRate(i, "rate", e.target.value)}
                        className="pl-12"
                        placeholder="1.00"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-muted-foreground hover:text-destructive"
                      onClick={() => removeRate(i)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <Separator />

              <Button type="submit" className="w-full" disabled={saveMutation.isPending || !dirty}>
                {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar tasas
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
