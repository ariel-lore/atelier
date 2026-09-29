import { getViewer } from "@/lib/auth";
import { notFound, serveKey } from "@/lib/media";
import { prisma } from "@/lib/prisma";
import { canView, storyIsLive } from "@/lib/privacy";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const viewer = await getViewer();
  const story = await prisma.story.findUnique({
    where: { id },
    include: { circles: { select: { circleId: true } } },
  });
  if (!story || !storyIsLive(story.expiresAt)) return notFound();
  const allowed = canView(viewer, {
    authorId: story.authorId,
    audience: story.audience,
    circleIds: story.circles.map((c) => c.circleId),
  });
  if (!allowed) return notFound();
  return serveKey(story.imagePath);
}
