import { z } from "zod"

export const exchangeRateSchema = z.object({
  currency: z.string().min(1, "Requerido").regex(/^[A-Z]{3}$/, "Código de 3 letras (ej: USD, EUR)"),
  rate: z.number().positive("Debe ser mayor a 0"),
})

export const exchangeRatesSchema = z.object({
  rates: z.array(exchangeRateSchema),
})

export type ExchangeRateForm = z.infer<typeof exchangeRateSchema>
