import { notFound, serveKey } from "@/lib/media";
import { prisma } from "@/lib/prisma";
import { assertHighlightClient, rethrowSetupError } from "@/lib/prismaSetup";

/** Highlights are public profile covers. Private posts never use this route. */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  assertHighlightClient(prisma);
  let highlight;
  try {
    highlight = await prisma.highlight.findUnique({ where: { id } });
  } catch (err) {
    rethrowSetupError(err);
  }
  if (!highlight) return notFound();
  return serveKey(highlight.imagePath);
}
