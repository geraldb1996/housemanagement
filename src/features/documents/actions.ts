// @ts-nocheck — DB types are a stub; will resolve when supabase gen types runs
"use server"

import { revalidatePath } from "next/cache"
import { createServerSupabase } from "@/lib/supabase/server"
import { requireHousehold } from "@/lib/auth"
import { documentSchema, type DocumentForm } from "./schemas"

export async function createDocument(data: DocumentForm) {
  const { householdId } = await requireHousehold()
  const parsed = documentSchema.parse(data)
  const supabase = await createServerSupabase()

  const { error } = await supabase.from("documents").insert({
    ...parsed,
    household_id: householdId,
  })

  if (error) throw new Error(error.message)
  revalidatePath("/documents")
}

export async function updateDocument(id: string, data: Partial<DocumentForm>) {
  await requireHousehold()
  const supabase = await createServerSupabase()

  const { error } = await supabase.from("documents").update(data).eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath("/documents")
}

export async function deleteDocument(id: string) {
  await requireHousehold()
  const supabase = await createServerSupabase()
  const { error } = await supabase.from("documents").update({ deleted_at: new Date().toISOString() }).eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath("/documents")
}

export async function createFolder(data: { name: string; parent_id?: string | null }) {
  const { householdId } = await requireHousehold()
  const supabase = await createServerSupabase()

  const { error } = await supabase.from("document_folders").insert({
    name: data.name,
    parent_id: data.parent_id ?? null,
    household_id: householdId,
  })

  if (error) throw new Error(error.message)
  revalidatePath("/documents")
}
