import { formVersionRepository } from '@/modules/form-template/form-template.repository'
import { validationService } from '@/modules/validation/validation.service'
import { submissionRepository } from './submission.repository'
import type { CreateSubmissionInput } from './submission.types'

export const submissionService = {
  async submit(formVersionId: string, input: CreateSubmissionInput) {
    const version = await formVersionRepository.findById(formVersionId)
    if (!version) throw new Error('VERSION_NOT_FOUND')

    const result = validationService.validate(version.schema as object, input.payload)
    if (!result.valid) {
      const err = new Error('VALIDATION_FAILED')
      ;(err as any).details = result.errors
      throw err
    }

    return submissionRepository.create(formVersionId, input.payload)
  },
  async listByVersion(formVersionId: string) {
    const version = await formVersionRepository.findById(formVersionId)
    if (!version) throw new Error('VERSION_NOT_FOUND')
    return submissionRepository.findByVersionId(formVersionId)
  },
}
