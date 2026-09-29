import { PrismaClient } from "@prisma/client";
import { highlightDelegate } from "./prismaSetup";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

const cached = globalForPrisma.prisma;
// A dev server started before `prisma generate` keeps the old client on globalThis.
// Drop it once Highlight exists on a newly generated client.
export const prisma = cached && highlightDelegate(cached)?.findMany ? cached : createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
