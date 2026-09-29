import { notFound, serveKey } from "@/lib/media";
import { loadAuthorizedPost } from "@/lib/mediaAccess";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const post = await loadAuthorizedPost(id);
  if (!post) return notFound();
  return serveKey(post.imagePath);
}
