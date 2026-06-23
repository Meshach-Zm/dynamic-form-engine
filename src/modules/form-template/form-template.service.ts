// Business logic lives here. Calls repository; never touches prisma directly.
import { formTemplateRepository, formVersionRepository } from './form-template.repository'
import type { CreateFormTemplateInput, CreateFormVersionInput } from './form-template.types'

export const formTemplateService = {
  async createTemplate(input: CreateFormTemplateInput) {
    return formTemplateRepository.create({
      name: input.name,
      versions: {
        create: { versionNumber: 1, schema: input.schema, isLatest: true },
      },
    })
  },

  async listTemplates() {
    return formTemplateRepository.findAll()
  },

  async getTemplate(id: string) {
    const template = await formTemplateRepository.findById(id)
    if (!template) throw new Error('TEMPLATE_NOT_FOUND')
    return template
  },

  async publishNewVersion(formTemplateId: string, input: CreateFormVersionInput) {
    const template = await formTemplateRepository.findById(formTemplateId)
    if (!template) throw new Error('TEMPLATE_NOT_FOUND')
    return formVersionRepository.createNewVersion(formTemplateId, input.schema)
  },
}
