import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, parseISO, isValid } from "date-fns"
import { es } from "date-fns/locale"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatMoney(
  amount: number,
  currency = "NIO",
  options?: Intl.NumberFormatOptions
) {
  return new Intl.NumberFormat("es-NI", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    ...options,
  }).format(amount)
}

export function formatDate(
  date: string | Date | null | undefined,
  fmt = "PPP"
) {
  if (!date) return ""
  const d = typeof date === "string" ? parseISO(date) : date
  if (!isValid(d)) return ""
  return format(d, fmt, { locale: es })
}

export function formatShortDate(date: string | Date | null | undefined) {
  return formatDate(date, "MMM d, yyyy")
}

export function truncate(str: string, len: number) {
  if (str.length <= len) return str
  return str.slice(0, len) + "..."
}

export function todayStr() {
  return new Date().toLocaleDateString("en-CA")
}

export function downloadExcelFromJson(
  rows: Record<string, unknown>[],
  filename: string
) {
  import("xlsx").then((XLSX) => {
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1")
    XLSX.writeFile(wb, `${filename}.xlsx`)
  })
}
