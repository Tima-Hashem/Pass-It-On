import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import dotenv from 'dotenv'

dotenv.config()

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  const user = await prisma.user.upsert({
    where: { email: 'yousef-student@gmail.com' },
    update: {
      passwordHash: 'pass123',
    },
    create: {
      email: 'yousef-student@gmail.com',
      name: 'Yousef Student',
      passwordHash: 'pass123',
      bio: 'I am Yousef the student!',
    },
  })
  console.log(`Student account created for: ${user.email}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
