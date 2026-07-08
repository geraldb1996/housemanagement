import { z } from "zod"

export const shoppingCategorySchema = z.enum([
  "alimentos",
  "bebidas",
  "limpieza",
  "higiene",
  "hogar",
  "mascotas",
  "farmacia",
  "ropa",
  "electronica",
  "otros",
])

export const shoppingListItemSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Requerido"),
  quantity: z.number().int().min(1, "Mínimo 1"),
  unit: z.string().default("unidad"),
  category: shoppingCategorySchema.default("otros"),
  purchased: z.boolean().default(false),
  estimated_price: z.number().min(0).default(0),
})

export const shoppingListSchema = z.object({
  name: z.string().min(1, "Requerido"),
  kind: z.enum(["grocery", "custom"]).default("grocery"),
  status: z.enum(["open", "shopping", "completed"]).default("open"),
  store: z.string().optional().default(""),
  items: z.array(shoppingListItemSchema).default([]),
})

export const productSchema = z.object({
  name: z.string().min(1, "Requerido"),
  category: shoppingCategorySchema.default("otros"),
  last_price: z.number().min(0).default(0),
  unit: z.string().default("unidad"),
  favorite: z.boolean().default(false),
  barcode: z.string().optional().default(""),
})

export type ShoppingCategory = z.infer<typeof shoppingCategorySchema>
export type ShoppingListItemForm = z.infer<typeof shoppingListItemSchema>
export type ShoppingListForm = z.infer<typeof shoppingListSchema>
export type ProductForm = z.infer<typeof productSchema>

export const CATEGORY_LABELS: Record<ShoppingCategory, string> = {
  alimentos: "Alimentos",
  bebidas: "Bebidas",
  limpieza: "Limpieza",
  higiene: "Higiene",
  hogar: "Hogar",
  mascotas: "Mascotas",
  farmacia: "Farmacia",
  ropa: "Ropa",
  electronica: "Electrónica",
  otros: "Otros",
}
