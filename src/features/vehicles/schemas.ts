import { z } from "zod"

export const vehicleSchema = z.object({
  name: z.string().min(1, "Requerido"),
  brand: z.string().optional().default(""),
  model: z.string().optional().default(""),
  year: z.number().int().min(1900).max(2100).optional().nullish(),
  plate: z.string().optional().default(""),
  vin: z.string().optional().default(""),
  color: z.string().optional().default(""),
  fuel_type: z.enum(["gasoline", "diesel", "electric", "hybrid", "other"]),
  insurance_company: z.string().optional().default(""),
  insurance_policy: z.string().optional().default(""),
  insurance_expires_at: z.string().optional().nullish(),
  purchase_date: z.string().optional().default(""),
  purchase_price: z.number().min(0).optional().nullish(),
  notes: z.string().optional().default(""),
})

export const vehicleServiceRecordSchema = z.object({
  vehicle_id: z.string(),
  date: z.string().min(1, "Requerido"),
  description: z.string().min(1, "Requerido"),
  mileage: z.number().int().min(0).optional().nullish(),
  cost: z.number().min(0).optional().nullish(),
  provider: z.string().optional().default(""),
  notes: z.string().optional().default(""),
})

export const FUEL_LABELS: Record<string, string> = {
  gasoline: "Gasolina",
  diesel: "Diésel",
  electric: "Eléctrico",
  hybrid: "Híbrido",
  other: "Otro",
}

export type Vehicle = z.infer<typeof vehicleSchema> & { id: string }
export type VehicleServiceRecord = z.infer<typeof vehicleServiceRecordSchema>
