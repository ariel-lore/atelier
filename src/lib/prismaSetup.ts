import type { PrismaClient } from "@prisma/client";

const SETUP =
  "Prisma is behind the Highlight model. Stop the dev server, then run: npx prisma migrate dev (or npx prisma db push), npx prisma generate, npm run seed, and npm run dev.";

export class PrismaSetupError extends Error {
  constructor(message = SETUP) {
    super(message);
    this.name = "PrismaSetupError";
  }
}

type HighlightDelegate = { findMany?: unknown; findUnique?: unknown; deleteMany?: unknown };

export function highlightDelegate(client: PrismaClient): HighlightDelegate | undefined {
  return (client as PrismaClient & { highlight?: HighlightDelegate }).highlight;
}

/** Stale `prisma generate` leaves `prisma.highlight` undefined, which crashes as `.findMany` of undefined. */
export function assertHighlightClient(client: PrismaClient) {
  const highlight = highlightDelegate(client);
  if (typeof highlight?.findMany !== "function") {
    throw new PrismaSetupError();
  }
}

export function rethrowSetupError(err: unknown): never {
  const code = typeof err === "object" && err && "code" in err ? String((err as { code: unknown }).code) : "";
  if (code === "P2021" || code === "P2022") {
    throw new PrismaSetupError(
      "The database has no Highlight table. Stop the dev server, then run: npx prisma migrate dev (or npx prisma db push), npx prisma generate, npm run seed, and npm run dev.",
    );
  }
  throw err;
}
