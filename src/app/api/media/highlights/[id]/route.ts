import { notFound, serveKey } from "@/lib/media";
import { prisma } from "@/lib/prisma";

/** Highlights are public profile covers. Private posts never use this route. */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const highlight = await prisma.highlight.findUnique({ where: { id } });
  if (!highlight) return notFound();
  return serveKey(highlight.imagePath);
}
