"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/data/EmptyState"
import { TrendingUp, Download, FileSpreadsheet } from "lucide-react"
import { downloadExcelFromJson, formatMoney } from "@/lib/utils"

export function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reportes</h1>
        <p className="text-muted-foreground text-sm mt-1">Visualiza y exporta tus datos financieros</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" /> Ingresos por mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">Resumen mensual de ingresos</p>
            <Button variant="outline" size="sm" className="w-full" onClick={() => downloadExcelFromJson([], "ingresos")}>
              <Download className="h-4 w-4 mr-1" /> Exportar
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-red-500" /> Gastos por categor&iacute;a
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">Desglose de gastos</p>
            <Button variant="outline" size="sm" className="w-full" onClick={() => downloadExcelFromJson([], "gastos")}>
              <Download className="h-4 w-4 mr-1" /> Exportar
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" /> Balance mensual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">Ingresos vs gastos</p>
            <Button variant="outline" size="sm" className="w-full" onClick={() => downloadExcelFromJson([], "balance")}>
              <Download className="h-4 w-4 mr-1" /> Exportar
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
