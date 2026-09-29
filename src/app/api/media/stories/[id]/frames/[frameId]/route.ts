import { notFound, serveKey } from "@/lib/media";
import { loadAuthorizedStory } from "@/lib/mediaAccess";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string; frameId: string }> }) {
  const { id, frameId } = await ctx.params;
  const story = await loadAuthorizedStory(id);
  if (!story) return notFound();
  const frame = await prisma.storyFrame.findFirst({ where: { id: frameId, storyId: id } });
  if (!frame) return notFound();
  return serveKey(frame.imagePath);
}
