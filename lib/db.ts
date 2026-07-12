import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const connectionString = process.env.DATABASE_URL || "postgres://502f6e0da15b18962bbfb7ac984d1ea696c2a49becab937f344b7bf8a5da482d:sk_S-SBA043nwQIoxlJ8owvD@pooled.db.prisma.io:5432/postgres?sslmode=require";

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;