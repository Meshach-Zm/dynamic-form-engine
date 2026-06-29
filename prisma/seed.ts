import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL or DIRECT_URL is not set');
  process.exit(1);
}

console.log('🔍 Connecting to database...');

// Create a Pool instance
const pool = new Pool({
  connectionString,
});

// Create the Prisma adapter for PostgreSQL
const adapter = new PrismaPg(pool);

// Create Prisma client with the adapter
const prisma = new PrismaClient({ adapter });

const contactFormSchema = {
  type: "object",
  required: ["fullName", "email", "age", "country", "message"],
  additionalProperties: false,
  properties: {
    fullName: {
      type: "string",
      minLength: 2,
      maxLength: 100,
      description: "Full Name"
    },
    email: {
      type: "string",
      format: "email",
      description: "Email Address"
    },
    age: {
      type: "integer",
      minimum: 18,
      maximum: 120,
      description: "Age"
    },
    country: {
      type: "string",
      enum: ["ZM", "ZW", "KE", "UG", "TZ", "RW", "MW", "MZ", "NG", "GH", "OTHER"],
      description: "Country"
    },
    message: {
      type: "string",
      minLength: 10,
      maxLength: 2000,
      description: "Message"
    },
    subscribe: {
      type: "boolean",
      description: "Subscribe to newsletter"
    },
  },
};

const volunteerFormSchema = {
  type: "object",
  required: ["fullName", "email", "availability"],
  additionalProperties: false,
  properties: {
    fullName: {
      type: "string",
      minLength: 2,
      maxLength: 100,
      description: "Full Name"
    },
    email: {
      type: "string",
      format: "email",
      description: "Email Address"
    },
    availability: {
      type: "string",
      enum: ["Weekdays", "Weekends", "Both"],
      description: "Availability"
    },
    experience: {
      type: "string",
      maxLength: 500,
      description: "Experience"
    },
  },
};

async function main() {
  console.log('🌱 Seeding database...');

  // Clean up existing data
  await prisma.submission.deleteMany({});
  await prisma.formVersion.deleteMany({});
  await prisma.formTemplate.deleteMany({});

  console.log('📝 Creating forms...');

  const contact = await prisma.formTemplate.create({
    data: {
      name: "Contact & Enquiry Form",
      versions: {
        create: {
          versionNumber: 1,
          schema: contactFormSchema,
          isLatest: true,
        },
      },
    },
  });

  const volunteer = await prisma.formTemplate.create({
    data: {
      name: "Volunteer Registration",
      versions: {
        create: {
          versionNumber: 1,
          schema: volunteerFormSchema,
          isLatest: true,
        },
      },
    },
  });

  console.log('✅ Created:', contact.name);
  console.log('✅ Created:', volunteer.name);
  console.log('✅ Seed complete!');
}

main()
  .catch((error) => {
    console.error('❌ Seed error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });