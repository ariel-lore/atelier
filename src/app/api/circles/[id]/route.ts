import { getViewer } from "@/lib/auth";
import { handle, json } from "@/lib/api";
import { requireOwner } from "@/lib/content";
import { HttpError } from "@/lib/http";
import { prisma } from "@/lib/prisma";

async function ownedCircle(ownerId: string, id: string) {
  const circle = await prisma.circle.findFirst({ where: { id, ownerId } });
  if (!circle) throw new HttpError(404, "Circle not found");
  return circle;
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(req, async () => {
    const viewer = requireOwner(await getViewer());
    const { id } = await ctx.params;
    await ownedCircle(viewer.id, id);
    const body = await req.json().catch(() => null);
    const data: { name?: string; description?: string; color?: string } = {};
    if (body?.name !== undefined) {
      const name = String(body.name).trim();
      if (name.length < 1 || name.length > 40) throw new HttpError(400, "Name your circle");
      data.name = name;
    }
    if (body?.description !== undefined) {
      const description = String(body.description).trim();
      if (description.length > 160) throw new HttpError(400, "Description is too long");
      data.description = description;
    }
    if (body?.color !== undefined) {
      const color = String(body.color);
      if (!/^#[0-9a-fA-F]{6}$/.test(color)) throw new HttpError(400, "Use a hex color");
      data.color = color;
    }
    try {
      const circle = await prisma.circle.update({ where: { id }, data });
      return json({ circle });
    } catch {
      throw new HttpError(409, "You already have a circle with that name");
    }
  }, true);
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(req, async () => {
    const viewer = requireOwner(await getViewer());
    const { id } = await ctx.params;
    await ownedCircle(viewer.id, id);
    await prisma.circle.delete({ where: { id } });
    return json({ ok: true });
  }, true);
}
