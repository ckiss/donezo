// Prisma client singleton — all database access flows through this instance.
// Never instantiate PrismaClient in route files or anywhere else.
import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/client.ts'

const connectionString = process.env.DATABASE_URL!

const adapter = new PrismaPg({ connectionString })
export const prisma = new PrismaClient({ adapter })
