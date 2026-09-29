import { getViewer } from "@/lib/auth";
import { handle, json } from "@/lib/api";
import { getStory } from "@/lib/queries";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(req, async () => {
    const { id } = await ctx.params;
    const story = await getStory(id, await getViewer());
    if (!story) return json({ error: "Not found" }, 404);
    return json({ story });
  });
}
