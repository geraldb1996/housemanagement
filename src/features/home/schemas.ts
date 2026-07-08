import { z } from "zod"

export const inventoryItemSchema = z.object({
  name: z.string().min(1, "Requerido"),
  category: z.enum(["appliance", "furniture", "electronics", "other"]),
  location: z.string().min(1, "Requerido"),
  brand: z.string().optional().default(""),
  model: z.string().optional().default(""),
  serial: z.string().optional().default(""),
  purchase_date: z.string().optional().default(""),
  purchase_price: z.number().min(0).optional().nullish(),
  estimated_value: z.number().min(0).optional().nullish(),
  warranty_expires_at: z.string().optional().nullish(),
  notes: z.string().optional().default(""),
})

export const inventoryMaintenanceSchema = z.object({
  item_id: z.string(),
  date: z.string().min(1, "Requerido"),
  description: z.string().min(1, "Requerido"),
  cost: z.number().min(0).optional().nullish(),
  provider: z.string().optional().default(""),
})

export const CATEGORY_LABELS: Record<string, string> = {
  appliance: "Electrodoméstico",
  furniture: "Mueble",
  electronics: "Electrónica",
  other: "Otro",
}

export type InventoryItem = z.infer<typeof inventoryItemSchema> & { id: string }
export type InventoryMaintenance = z.infer<typeof inventoryMaintenanceSchema>
