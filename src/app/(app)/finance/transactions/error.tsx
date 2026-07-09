"use client"

import { EmptyState } from "@/components/data/EmptyState"
import { AlertTriangle } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <EmptyState
        icon={AlertTriangle}
        title="Error al cargar transacciones"
        description={error.message || "Ocurrió un error inesperado. Intenta de nuevo."}
        actionLabel="Reintentar"
        onAction={reset}
      />
    </div>
  )
}
