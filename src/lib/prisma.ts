import { PrismaClient } from "@/generated/prisma";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaPg } from "@prisma/adapter-pg";

/** Neon's serverless driver only speaks to Neon's proxy — use the plain
 *  pg adapter when pointing at a local/ordinary Postgres. */
function createAdapter(connectionString: string) {
  return /neon\.tech/.test(connectionString)
    ? new PrismaNeon({ connectionString })
    : new PrismaPg({ connectionString });
}

function createPrismaClient() {
  return new PrismaClient({
    adapter: createAdapter(process.env.DATABASE_URL!),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
