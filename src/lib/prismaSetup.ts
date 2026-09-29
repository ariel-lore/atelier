import type { PrismaClient } from "@prisma/client";

const SETUP =
  "Prisma is behind the Highlight model. Stop the dev server and run npm run dev. That creates .env from .env.example when it is missing, applies pending migrations, and regenerates the client. Run npm run seed only if you also want the demo data.";

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
      "The database has no Highlight table. Stop the dev server and run npm run dev so pending migrations apply. Run npm run seed only if you also want the demo data.",
    );
  }
  throw err;
}
