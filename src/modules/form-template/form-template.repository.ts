import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

export const formTemplateRepository = {
  async create(data: Prisma.FormTemplateCreateInput) {
    return prisma.formTemplate.create({ data })
  },
  async findAll() {
    return prisma.formTemplate.findMany({
      include: { versions: { where: { isLatest: true }, take: 1 } },
      orderBy: { createdAt: 'desc' },
    })
  },
  async findById(id: string) {
    return prisma.formTemplate.findUnique({
      where: { id },
      include: { versions: { where: { isLatest: true }, take: 1 } },
    })
  },
}

export const formVersionRepository = {
  async findLatest(formTemplateId: string) {
    return prisma.formVersion.findFirst({ where: { formTemplateId, isLatest: true } })
  },
  async findById(id: string) {
    return prisma.formVersion.findUnique({
      where: { id },
      include: { formTemplate: { select: { name: true } } },
    })
  },
  async createNewVersion(formTemplateId: string, schema: object) {
    return prisma.$transaction(async (tx) => {
      await tx.formVersion.updateMany({
        where: { formTemplateId, isLatest: true },
        data: { isLatest: false },
      })
      const count = await tx.formVersion.count({ where: { formTemplateId } })
      return tx.formVersion.create({
        data: { formTemplateId, versionNumber: count + 1, schema, isLatest: true },
      })
    })
  },
}
