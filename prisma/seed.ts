import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// A JSON Schema example 
const contactFormSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  required: ['fullName', 'email', 'age', 'country', 'message'],
  additionalProperties: false,
  properties: {
    fullName: {
      type: 'string',
      minLength: 2,
      maxLength: 100,
      description: 'Full name',
    },
    email: {
      type: 'string',
      format: 'email',
      description: 'Email address',
    },
    age: {
      type: 'integer',
      minimum: 18,
      maximum: 120,
      description: 'Age (must be 18 or older)',
    },
    country: {
      type: 'string',
      enum: ['ZM', 'ZW', 'KE', 'UG', 'TZ', 'RW', 'MW', 'MZ', 'NG', 'GH', 'OTHER'],
      description: 'Country of residence',
    },
    message: {
      type: 'string',
      minLength: 10,
      maxLength: 2000,
      description: 'Your message',
    },
    subscribe: {
      type: 'boolean',
      description: 'Subscribe to newsletter (optional)',
    },
  },
}

async function main() {
  console.log('Seeding database...')

  // Upsert so running seed twice is safe
  const template = await prisma.formTemplate.upsert({
    where: { id: 'seed-template-001' },
    update: {},
    create: {
      id: 'seed-template-001',
      name: 'Contact & Enquiry Form',
      versions: {
        create: {
          id: 'seed-version-001',
          versionNumber: 1,
          schema: contactFormSchema,
          isLatest: true,
        },
      },
    },
  })

  console.log(`Template created: ${template.name} (${template.id})`)
  console.log('Seed complete.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
