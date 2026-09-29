import { getViewer } from "@/lib/auth";
import { handle, json } from "@/lib/api";
import { getPost } from "@/lib/queries";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(req, async () => {
    const { id } = await ctx.params;
    const viewer = await getViewer();
    const post = await getPost(id, viewer);
    if (!post) return json({ error: "Not found" }, 404);
    return json({ post });
  });
}
