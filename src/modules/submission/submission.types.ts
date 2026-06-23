import { z } from 'zod'

export const CreateSubmissionSchema = z.object({
  payload: z.record(z.unknown()),
})

export type CreateSubmissionInput = z.infer<typeof CreateSubmissionSchema>
