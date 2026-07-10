// @ts-nocheck — DB types are a stub; will resolve when supabase gen types runs
"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { createServerSupabase } from "@/lib/supabase/server"
import { requireHousehold } from "@/lib/auth"
import {
  petSchema,
  petMedicalRecordSchema,
  petVaccinationSchema,
  type PetMedicalRecord,
  type PetVaccination,
} from "./schemas"

type PetInput = z.infer<typeof petSchema>

export async function createPet(data: PetInput) {
  const { householdId } = await requireHousehold()
  const parsed = petSchema.parse(data)
  const supabase = await createServerSupabase()

  const { error } = await supabase.from("pets").insert({
    ...parsed,
    household_id: householdId,
  })

  if (error) throw new Error(error.message)
  revalidatePath("/pets")
  revalidatePath("/")
}

export async function updatePet(id: string, data: Partial<PetInput>) {
  await requireHousehold()
  const supabase = await createServerSupabase()

  const { error } = await supabase.from("pets").update(data).eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath("/pets")
  revalidatePath("/")
}

export async function deletePet(id: string) {
  await requireHousehold()
  const supabase = await createServerSupabase()
  const { error } = await supabase.from("pets").update({ deleted_at: new Date().toISOString() }).eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath("/pets")
  revalidatePath("/")
}

export async function addMedicalRecord(petId: string, data: PetMedicalRecord) {
  await requireHousehold()
  const parsed = petMedicalRecordSchema.parse({ ...data, pet_id: petId })
  const supabase = await createServerSupabase()

  const { error } = await supabase.from("pet_medical_records").insert(parsed)
  if (error) throw new Error(error.message)
  revalidatePath("/pets")
}

export async function deleteMedicalRecord(id: string) {
  await requireHousehold()
  const supabase = await createServerSupabase()
  const { error } = await supabase.from("pet_medical_records").delete().eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath("/pets")
}

export async function addVaccination(petId: string, data: PetVaccination) {
  await requireHousehold()
  const parsed = petVaccinationSchema.parse({ ...data, pet_id: petId })
  const supabase = await createServerSupabase()

  const { error } = await supabase.from("pet_vaccinations").insert(parsed)
  if (error) throw new Error(error.message)
  revalidatePath("/pets")
}

export async function deleteVaccination(id: string) {
  await requireHousehold()
  const supabase = await createServerSupabase()
  const { error } = await supabase.from("pet_vaccinations").delete().eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath("/pets")
}
