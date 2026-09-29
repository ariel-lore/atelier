import { notFound, serveKey } from "@/lib/media";
import { loadAuthorizedStory } from "@/lib/mediaAccess";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const story = await loadAuthorizedStory(id);
  if (!story) return notFound();
  return serveKey(story.imagePath);
}
