"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { queryKeys as qk } from "@/lib/query-keys"
import {
  createVehicle,
  updateVehicle,
  deleteVehicle,
  addServiceRecord,
  deleteServiceRecord,
} from "./actions"
import { toast } from "sonner"

type VehicleRow = {
  id: string
  household_id: string
  name: string
  brand: string
  model: string
  year: number | null
  plate: string
  vin: string
  color: string
  fuel_type: string
  insurance_company: string
  insurance_policy: string
  insurance_expires_at: string | null
  purchase_date: string
  purchase_price: number | null
  notes: string
  photo_url: string
  created_at: string
  updated_at: string
  deleted_at: string | null
  service_records: ServiceRecordRow[]
}

type ServiceRecordRow = {
  id: string
  vehicle_id: string
  date: string
  description: string
  mileage: number | null
  cost: number | null
  provider: string
  notes: string
}

export function useVehicles(householdId: string | null) {
  return useQuery({
    queryKey: qk.vehicles.all(householdId ?? ""),
    queryFn: async () => {
      if (!householdId) return [] as VehicleRow[]
      const supabase = createClient()
      const { data, error } = await supabase
        .from("vehicles")
        .select("*, service_records:vehicle_service_records(*)")
        .eq("household_id", householdId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
      if (error) throw error
      return data as VehicleRow[]
    },
    enabled: !!householdId,
  })
}

export function useVehicle(id: string | null) {
  return useQuery({
    queryKey: qk.vehicles.detail(id ?? ""),
    queryFn: async () => {
      if (!id) return null
      const supabase = createClient()
      const { data, error } = await supabase
        .from("vehicles")
        .select("*, service_records:vehicle_service_records(*)")
        .eq("id", id)
        .single()
      if (error) throw error
      return data as VehicleRow
    },
    enabled: !!id,
  })
}

export function useCreateVehicle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createVehicle,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vehicles"] })
      toast.success("Vehículo agregado")
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useUpdateVehicle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateVehicle>[1] }) =>
      updateVehicle(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vehicles"] })
      toast.success("Vehículo actualizado")
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useDeleteVehicle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteVehicle,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vehicles"] })
      toast.success("Vehículo eliminado")
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useAddServiceRecord() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ vehicleId, data }: { vehicleId: string; data: Parameters<typeof addServiceRecord>[1] }) =>
      addServiceRecord(vehicleId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vehicles"] })
      toast.success("Servicio registrado")
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useDeleteServiceRecord() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteServiceRecord,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vehicles"] })
      toast.success("Servicio eliminado")
    },
    onError: (e: Error) => toast.error(e.message),
  })
}
