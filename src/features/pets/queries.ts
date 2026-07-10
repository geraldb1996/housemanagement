"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { queryKeys as qk } from "@/lib/query-keys"
import {
  createPet,
  updatePet,
  deletePet,
  addMedicalRecord,
  deleteMedicalRecord,
  addVaccination,
  deleteVaccination,
} from "./actions"
import { toast } from "sonner"

type PetRow = {
  id: string
  household_id: string
  name: string
  species: string
  breed: string
  color: string
  birth_date: string
  weight_kg: number | null
  microchip_id: string
  vet_name: string
  vet_phone: string
  notes: string
  photo_url: string
  created_at: string
  updated_at: string
  deleted_at: string | null
  medical_records: MedicalRecordRow[]
  vaccinations: VaccinationRow[]
}

type MedicalRecordRow = {
  id: string
  pet_id: string
  date: string
  description: string
  vet_name: string
  cost: number | null
  notes: string
}

type VaccinationRow = {
  id: string
  pet_id: string
  vaccine_name: string
  date_administered: string
  next_due_date: string | null
  vet_name: string
  batch_number: string
  notes: string
}

export function usePets(householdId: string | null) {
  return useQuery({
    queryKey: qk.pets.all(householdId ?? ""),
    queryFn: async () => {
      if (!householdId) return [] as PetRow[]
      const supabase = createClient()
      const { data, error } = await supabase
        .from("pets")
        .select("*, medical_records:pet_medical_records(*), vaccinations:pet_vaccinations(*)")
        .eq("household_id", householdId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
      if (error) throw error
      return data as PetRow[]
    },
    enabled: !!householdId,
  })
}

export function usePet(id: string | null) {
  return useQuery({
    queryKey: qk.pets.detail(id ?? ""),
    queryFn: async () => {
      if (!id) return null
      const supabase = createClient()
      const { data, error } = await supabase
        .from("pets")
        .select("*, medical_records:pet_medical_records(*), vaccinations:pet_vaccinations(*)")
        .eq("id", id)
        .single()
      if (error) throw error
      return data as PetRow
    },
    enabled: !!id,
  })
}

export function useCreatePet() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createPet,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pets"] })
      toast.success("Mascota agregada")
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useUpdatePet() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updatePet>[1] }) =>
      updatePet(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pets"] })
      toast.success("Mascota actualizada")
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useDeletePet() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deletePet,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pets"] })
      toast.success("Mascota eliminada")
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useAddMedicalRecord() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ petId, data }: { petId: string; data: Parameters<typeof addMedicalRecord>[1] }) =>
      addMedicalRecord(petId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pets"] })
      toast.success("Registro médico agregado")
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useDeleteMedicalRecord() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteMedicalRecord,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pets"] })
      toast.success("Registro médico eliminado")
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useAddVaccination() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ petId, data }: { petId: string; data: Parameters<typeof addVaccination>[1] }) =>
      addVaccination(petId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pets"] })
      toast.success("Vacuna agregada")
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useDeleteVaccination() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteVaccination,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pets"] })
      toast.success("Vacuna eliminada")
    },
    onError: (e: Error) => toast.error(e.message),
  })
}
