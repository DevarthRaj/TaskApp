import { PrismaClient } from "@prisma/client";

// Prevent multiple Prisma Client instances in development
// Next.js hot-reloads cause new instances on each reload, exhausting DB connections

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
