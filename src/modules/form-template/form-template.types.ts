import { z } from 'zod'

export const CreateFormTemplateSchema = z.object({
  name: z.string().min(1).max(200),
  schema: z.record(z.unknown()),
})

export const CreateFormVersionSchema = z.object({
  schema: z.record(z.unknown()),
})

export type CreateFormTemplateInput = z.infer<typeof CreateFormTemplateSchema>
export type CreateFormVersionInput = z.infer<typeof CreateFormVersionSchema>
