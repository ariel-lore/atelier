import { getViewer } from "@/lib/auth";
import { handle, json } from "@/lib/api";
import { requireOwner } from "@/lib/content";
import { HttpError } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(req, async () => {
    const viewer = requireOwner(await getViewer());
    const { id } = await ctx.params;
    const circle = await prisma.circle.findFirst({ where: { id, ownerId: viewer.id } });
    if (!circle) throw new HttpError(404, "Circle not found");
    const body = await req.json().catch(() => null);
    const userId = String(body?.userId ?? "");
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role === "OWNER") throw new HttpError(404, "Person not found");
    if (!user.instagramVerified) {
      throw new HttpError(400, "Verify their Instagram before adding them to a circle");
    }
    await prisma.circleMember.upsert({
      where: { circleId_userId: { circleId: id, userId } },
      update: {},
      create: { circleId: id, userId },
    });
    return json({ ok: true });
  }, true);
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(req, async () => {
    const viewer = requireOwner(await getViewer());
    const { id } = await ctx.params;
    const circle = await prisma.circle.findFirst({ where: { id, ownerId: viewer.id } });
    if (!circle) throw new HttpError(404, "Circle not found");
    const body = await req.json().catch(() => null);
    const userId = String(body?.userId ?? "");
    await prisma.circleMember.deleteMany({ where: { circleId: id, userId } });
    return json({ ok: true });
  }, true);
}
