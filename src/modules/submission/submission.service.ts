import { formVersionRepository } from '@/modules/form-template/form-template.repository'
import { validationService } from '@/modules/validation/validation.service'
import { submissionRepository } from './submission.repository'
import type { CreateSubmissionInput } from './submission.types'

export const submissionService = {
  async submit(formVersionId: string, input: CreateSubmissionInput) {
    // 1. Load the version (and its schema) from the database
    const version = await formVersionRepository.findById(formVersionId)
    if (!version) throw new Error('VERSION_NOT_FOUND')

    // 2. Run dynamic validation — rules come from the stored JSON Schema
    const result = validationService.validate(version.schema as object, input.payload)
    if (!result.valid) {
      const err = new Error('VALIDATION_FAILED')
      ;(err as any).details = result.errors
      throw err
    }

    // 3. Persist — submission is pinned to this exact version forever
    return submissionRepository.create(formVersionId, input.payload)
  },

  async listByVersion(formVersionId: string) {
    const version = await formVersionRepository.findById(formVersionId)
    if (!version) throw new Error('VERSION_NOT_FOUND')
    return submissionRepository.findByVersionId(formVersionId)
  },
}
