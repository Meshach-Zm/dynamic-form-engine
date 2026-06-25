import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

export const formTemplateRepository = {
  async create(
    data: Prisma.FormTemplateCreateInput,
  ) {
    return prisma.formTemplate.create({
      data,
      include: {
        versions: true,
      },
    })
  },

  async findAll() {
    return prisma.formTemplate.findMany({
      include: {
        versions: {
          where: {
            isLatest: true,
          },
          orderBy: {
            versionNumber: 'desc',
          },
          take: 1,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  },

  async findById(id: string) {
    return prisma.formTemplate.findUnique({
      where: { id },
      include: {
        versions: {
          where: {
            isLatest: true,
          },
          orderBy: {
            versionNumber: 'desc',
          },
          take: 1,
        },
      },
    })
  },

  async findByIdWithVersions(id: string) {
    return prisma.formTemplate.findUnique({
      where: { id },
      include: {
        versions: {
          orderBy: {
            versionNumber: 'desc',
          },
          include: {
            _count: {
              select: {
                submissions: true,
              },
            },
          },
        },
      },
    })
  },
}

export const formVersionRepository = {
  async findLatest(
    formTemplateId: string,
  ) {
    return prisma.formVersion.findFirst({
      where: {
        formTemplateId,
        isLatest: true,
      },
      include: {
        formTemplate: true,
      },
    })
  },

  async findById(id: string) {
    return prisma.formVersion.findUnique({
      where: { id },
      include: {
        formTemplate: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })
  },

  async findVersions(
    formTemplateId: string,
  ) {
    return prisma.formVersion.findMany({
      where: {
        formTemplateId,
      },
      orderBy: {
        versionNumber: 'desc',
      },
      include: {
        _count: {
          select: {
            submissions: true,
          },
        },
      },
    })
  },

  async createNewVersion(
    formTemplateId: string,
    schema: Prisma.InputJsonValue,
  ) {
    return prisma.$transaction(
      async tx => {
        await tx.formVersion.updateMany({
          where: {
            formTemplateId,
            isLatest: true,
          },
          data: {
            isLatest: false,
          },
        })

        const count =
          await tx.formVersion.count({
            where: {
              formTemplateId,
            },
          })

        return tx.formVersion.create({
          data: {
            formTemplateId,
            versionNumber: count + 1,
            schema,
            isLatest: true,
          },
        })
      },
    )
  },
}