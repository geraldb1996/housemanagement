// @ts-nocheck — DB types are a stub; will resolve when supabase gen types runs
"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { queryKeys as qk } from "@/lib/query-keys"
import {
  createDocument,
  updateDocument,
  deleteDocument,
  createFolder,
} from "./actions"
import { toast } from "sonner"

type Document = {
  id: string
  household_id: string
  name: string
  kind: string
  folder: string
  size_kb: number
  date: string
  expires_at: string | null
  tags: string[]
  file_url: string | null
  created_at: string
  deleted_at: string | null
}

type DocumentFolder = {
  id: string
  household_id: string
  name: string
  parent_id: string | null
  created_at: string
}

export function useDocuments(householdId: string | null) {
  return useQuery({
    queryKey: qk.documents.all(householdId ?? ""),
    queryFn: async () => {
      if (!householdId) return [] as Document[]
      const supabase = createClient()
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("household_id", householdId)
        .is("deleted_at", null)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false })
      if (error) throw error
      return data as Document[]
    },
    enabled: !!householdId,
  })
}

export function useFolders(householdId: string | null) {
  return useQuery({
    queryKey: qk.documentFolders.all(householdId ?? ""),
    queryFn: async () => {
      if (!householdId) return [] as DocumentFolder[]
      const supabase = createClient()
      const { data, error } = await supabase
        .from("document_folders")
        .select("*")
        .eq("household_id", householdId)
        .order("name")
      if (error) throw error
      return data as DocumentFolder[]
    },
    enabled: !!householdId,
  })
}

export function useCreateDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createDocument,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documents"] })
      toast.success("Documento creado")
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useUpdateDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateDocument>[1] }) =>
      updateDocument(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documents"] })
      toast.success("Documento actualizado")
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useDeleteDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documents"] })
      toast.success("Documento eliminado")
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useCreateFolder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createFolder,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["document-folders"] })
      toast.success("Carpeta creada")
    },
    onError: (e: Error) => toast.error(e.message),
  })
}
