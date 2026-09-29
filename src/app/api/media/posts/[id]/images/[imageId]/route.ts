import { notFound, serveKey } from "@/lib/media";
import { loadAuthorizedPost } from "@/lib/mediaAccess";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string; imageId: string }> }) {
  const { id, imageId } = await ctx.params;
  const post = await loadAuthorizedPost(id);
  if (!post) return notFound();
  const image = await prisma.postImage.findFirst({ where: { id: imageId, postId: id } });
  if (!image) return notFound();
  return serveKey(image.imagePath);
}
