import { z } from "zod"

export const documentKindSchema = z.enum([
  "bill",
  "warranty",
  "contract",
  "important",
  "other",
])

export const documentFolderSchema = z.enum([
  "Facturas",
  "Garantías",
  "Contratos",
  "Importantes",
])

export const documentSchema = z.object({
  name: z.string().min(1, "Requerido"),
  kind: documentKindSchema,
  folder: documentFolderSchema,
  size_kb: z.number().positive(),
  date: z.string(),
  expires_at: z.string().optional().nullish(),
  tags: z.array(z.string()).default([]),
})

export const KIND_LABELS: Record<string, string> = {
  bill: "Factura",
  warranty: "Garantía",
  contract: "Contrato",
  important: "Importante",
  other: "Otro",
}

export const FOLDER_LABELS: Record<string, string> = {
  "Facturas": "Facturas",
  "Garantías": "Garantías",
  "Contratos": "Contratos",
  "Importantes": "Importantes",
}

export type DocumentKind = z.infer<typeof documentKindSchema>
export type DocumentFolder = z.infer<typeof documentFolderSchema>
export type DocumentForm = z.infer<typeof documentSchema>
