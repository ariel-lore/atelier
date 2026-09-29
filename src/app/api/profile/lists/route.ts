import { getViewer } from "@/lib/auth";
import { handle, json } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getOwnerUser, listFollows } from "@/lib/queries";

export async function GET(req: Request) {
  return handle(req, async () => {
    const viewer = await getViewer();
    const url = new URL(req.url);
    const kind = url.searchParams.get("kind") === "followers" ? "followers" : "following";
    const handleName = url.searchParams.get("handle");
    const user = handleName
      ? await prisma.user.findUnique({ where: { handle: handleName } })
      : await getOwnerUser();
    if (!user) return json({ error: "Not found" }, 404);
    const result = await listFollows(user.id, kind, viewer);
    if (!result.allowed) return json({ error: "This list is private" }, 403);
    return json({ people: result.people });
  });
}
