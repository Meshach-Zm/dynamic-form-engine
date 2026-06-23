import { z } from 'zod'

// Static validation (Zod) — shape of incoming API requests.
// This is NOT the dynamic form schema; that lives in the database as JSON Schema.

export const CreateFormTemplateSchema = z.object({
  name: z.string().min(1).max(200),
  schema: z.record(z.unknown()), // raw JSON Schema object
})

export const CreateFormVersionSchema = z.object({
  schema: z.record(z.unknown()),
})

export type CreateFormTemplateInput = z.infer<typeof CreateFormTemplateSchema>
export type CreateFormVersionInput = z.infer<typeof CreateFormVersionSchema>
