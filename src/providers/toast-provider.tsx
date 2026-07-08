"use client"

import { Toaster } from "sonner"

export function ToastProvider() {
  return (
    <Toaster
      position="bottom-right"
      richColors
      closeButton
      toastOptions={{
        duration: 4000,
        style: { borderRadius: "0.75rem" },
      }}
    />
  )
}
