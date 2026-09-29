import { getViewer } from "@/lib/auth";
import { notFound, serveKey } from "@/lib/media";
import { prisma } from "@/lib/prisma";
import { canView } from "@/lib/privacy";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const viewer = await getViewer();
  const post = await prisma.post.findUnique({
    where: { id },
    include: { circles: { select: { circleId: true } } },
  });
  if (!post) return notFound();
  const allowed = canView(viewer, {
    authorId: post.authorId,
    audience: post.audience,
    circleIds: post.circles.map((c) => c.circleId),
  });
  if (!allowed) return notFound();
  return serveKey(post.imagePath);
}
