import type { Prisma } from '@prisma/client'

import {
  formTemplateRepository,
  formVersionRepository,
} from './form-template.repository'

import type {
  CreateFormTemplateInput,
  CreateFormVersionInput,
} from './form-template.types'

export const formTemplateService = {
  async createTemplate(
    input: CreateFormTemplateInput,
  ) {
    return formTemplateRepository.create({
      name: input.name,
      versions: {
        create: {
          versionNumber: 1,
          schema:
            input.schema as Prisma.InputJsonValue,
          isLatest: true,
        },
      },
    })
  },

  async listTemplates() {
    return formTemplateRepository.findAll()
  },

  async getTemplate(id: string) {
    const template =
      await formTemplateRepository.findById(id)

    if (!template) {
      throw new Error('TEMPLATE_NOT_FOUND')
    }

    return {
      ...template,
      latestVersion:
        template.versions?.[0] ?? null,
    }
  },

  async getTemplateWithVersions(
    id: string,
  ) {
    const template =
      await formTemplateRepository.findByIdWithVersions(
        id,
      )

    if (!template) {
      throw new Error('TEMPLATE_NOT_FOUND')
    }

    return template
  },

  async getVersions(
    formTemplateId: string,
  ) {
    const template =
      await formTemplateRepository.findById(
        formTemplateId,
      )

    if (!template) {
      throw new Error('TEMPLATE_NOT_FOUND')
    }

    return formVersionRepository.findVersions(
      formTemplateId,
    )
  },

  async publishNewVersion(
    formTemplateId: string,
    input: CreateFormVersionInput,
  ) {
    const template =
      await formTemplateRepository.findById(
        formTemplateId,
      )

    if (!template) {
      throw new Error('TEMPLATE_NOT_FOUND')
    }

    const latest =
      await formVersionRepository.findLatest(
        formTemplateId,
      )

    if (
      latest &&
      JSON.stringify(latest.schema) ===
      JSON.stringify(input.schema)
    ) {
      throw new Error('SCHEMA_UNCHANGED')
    }

    return formVersionRepository.createNewVersion(
      formTemplateId,
      input.schema as Prisma.InputJsonValue,
    )
  },
}