import { getViewer } from "@/lib/auth";
import { handle, json } from "@/lib/api";
import { requireUser } from "@/lib/content";
import { HttpError } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  return handle(req, async () => {
    const viewer = requireUser(await getViewer());
    const body = await req.json().catch(() => null);
    const userId = String(body?.userId ?? "");
    if (userId === viewer.id) throw new HttpError(400, "That's you");
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new HttpError(404, "Person not found");
    const existing = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: viewer.id, followingId: userId } },
    });
    if (existing) {
      await prisma.follow.delete({ where: { id: existing.id } });
      return json({ following: false });
    }
    await prisma.follow.create({ data: { followerId: viewer.id, followingId: userId } });
    return json({ following: true });
  }, true);
}
