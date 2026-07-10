// @ts-nocheck — DB types are a stub; will resolve when supabase gen types runs
"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { createServerSupabase } from "@/lib/supabase/server"
import { requireHousehold } from "@/lib/auth"
import {
  vehicleSchema,
  vehicleServiceRecordSchema,
  type VehicleServiceRecord,
} from "./schemas"

type VehicleInput = z.infer<typeof vehicleSchema>

export async function createVehicle(data: VehicleInput) {
  const { householdId } = await requireHousehold()
  const parsed = vehicleSchema.parse(data)
  const supabase = await createServerSupabase()

  const { error } = await supabase.from("vehicles").insert({
    ...parsed,
    household_id: householdId,
  })

  if (error) throw new Error(error.message)
  revalidatePath("/vehicles")
  revalidatePath("/")
}

export async function updateVehicle(id: string, data: Partial<VehicleInput>) {
  await requireHousehold()
  const supabase = await createServerSupabase()

  const { error } = await supabase.from("vehicles").update(data).eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath("/vehicles")
  revalidatePath("/")
}

export async function deleteVehicle(id: string) {
  await requireHousehold()
  const supabase = await createServerSupabase()
  const { error } = await supabase.from("vehicles").update({ deleted_at: new Date().toISOString() }).eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath("/vehicles")
  revalidatePath("/")
}

export async function addServiceRecord(vehicleId: string, data: VehicleServiceRecord) {
  await requireHousehold()
  const parsed = vehicleServiceRecordSchema.parse({ ...data, vehicle_id: vehicleId })
  const supabase = await createServerSupabase()

  const { error } = await supabase.from("vehicle_service_records").insert(parsed)
  if (error) throw new Error(error.message)
  revalidatePath("/vehicles")
}

export async function deleteServiceRecord(id: string) {
  await requireHousehold()
  const supabase = await createServerSupabase()
  const { error } = await supabase.from("vehicle_service_records").delete().eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath("/vehicles")
}
