import { z } from "zod"

export const petSchema = z.object({
  name: z.string().min(1, "Requerido"),
  species: z.enum(["dog", "cat", "bird", "fish", "rodent", "reptile", "other"]),
  breed: z.string().optional().default(""),
  color: z.string().optional().default(""),
  birth_date: z.string().optional().default(""),
  weight_kg: z.number().min(0).optional().nullish(),
  microchip_id: z.string().optional().default(""),
  vet_name: z.string().optional().default(""),
  vet_phone: z.string().optional().default(""),
  notes: z.string().optional().default(""),
})

export const petMedicalRecordSchema = z.object({
  pet_id: z.string(),
  date: z.string().min(1, "Requerido"),
  description: z.string().min(1, "Requerido"),
  vet_name: z.string().optional().default(""),
  cost: z.number().min(0).optional().nullish(),
  notes: z.string().optional().default(""),
})

export const petVaccinationSchema = z.object({
  pet_id: z.string(),
  vaccine_name: z.string().min(1, "Requerido"),
  date_administered: z.string().min(1, "Requerido"),
  next_due_date: z.string().optional().nullish(),
  vet_name: z.string().optional().default(""),
  batch_number: z.string().optional().default(""),
  notes: z.string().optional().default(""),
})

export const SPECIES_LABELS: Record<string, string> = {
  dog: "Perro",
  cat: "Gato",
  bird: "Ave",
  fish: "Pez",
  rodent: "Roedor",
  reptile: "Reptil",
  other: "Otro",
}

export type Pet = z.infer<typeof petSchema> & { id: string }
export type PetMedicalRecord = z.infer<typeof petMedicalRecordSchema>
export type PetVaccination = z.infer<typeof petVaccinationSchema>
