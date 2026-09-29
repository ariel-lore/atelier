import { getViewer } from "@/lib/auth";
import { handle, json } from "@/lib/api";
import { requireUser } from "@/lib/content";
import { prisma } from "@/lib/prisma";
import { getPost } from "@/lib/queries";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(req, async () => {
    const { id } = await ctx.params;
    const viewer = requireUser(await getViewer());
    const post = await getPost(id, viewer);
    if (!post) return json({ error: "Not found" }, 404);
    const existing = await prisma.like.findUnique({
      where: { postId_userId: { postId: id, userId: viewer.id } },
    });
    if (existing) {
      await prisma.$transaction([
        prisma.like.delete({ where: { id: existing.id } }),
        prisma.post.update({ where: { id }, data: { likeCount: { decrement: 1 } } }),
      ]);
    } else {
      await prisma.$transaction([
        prisma.like.create({ data: { postId: id, userId: viewer.id } }),
        prisma.post.update({ where: { id }, data: { likeCount: { increment: 1 } } }),
      ]);
    }
    const updated = await getPost(id, viewer);
    return json({ post: updated });
  }, true);
}
