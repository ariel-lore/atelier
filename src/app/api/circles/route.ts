import { getViewer } from "@/lib/auth";
import { handle, json } from "@/lib/api";
import { requireOwner } from "@/lib/content";
import { HttpError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { listCircles } from "@/lib/queries";

export async function GET(req: Request) {
  return handle(req, async () => {
    const viewer = requireOwner(await getViewer());
    return json({ circles: await listCircles(viewer.id, viewer) });
  });
}

export async function POST(req: Request) {
  return handle(req, async () => {
    const viewer = requireOwner(await getViewer());
    const body = await req.json().catch(() => null);
    const name = String(body?.name ?? "").trim();
    const description = String(body?.description ?? "").trim();
    const color = String(body?.color ?? "#6b7280");
    if (name.length < 1 || name.length > 40) throw new HttpError(400, "Name your circle");
    if (description.length > 160) throw new HttpError(400, "Description is too long");
    if (!/^#[0-9a-fA-F]{6}$/.test(color)) throw new HttpError(400, "Use a hex color");
    try {
      const circle = await prisma.circle.create({
        data: { ownerId: viewer.id, name, description, color },
      });
      return json({ circle }, 201);
    } catch {
      throw new HttpError(409, "You already have a circle with that name");
    }
  }, true);
}
