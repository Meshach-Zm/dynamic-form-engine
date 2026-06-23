import { prisma } from '@/lib/prisma'

export const submissionRepository = {
  async create(formVersionId: string, payload: object) {
    return prisma.submission.create({
      data: { formVersionId, payload },
    })
  },

  async findByVersionId(formVersionId: string) {
    return prisma.submission.findMany({
      where: { formVersionId },
      orderBy: { createdAt: 'desc' },
    })
  },
}
