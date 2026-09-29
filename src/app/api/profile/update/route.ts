import { getViewer } from "@/lib/auth";
import { handle, json } from "@/lib/api";
import { requireUser } from "@/lib/content";
import { HttpError } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  return handle(req, async () => {
    const viewer = requireUser(await getViewer());
    const body = await req.json().catch(() => null);
    const bio = body?.bio === undefined ? undefined : String(body.bio);
    if (bio !== undefined && bio.length > 300) throw new HttpError(400, "Bio is too long");
    const data: Record<string, string | boolean> = {};
    if (bio !== undefined) data.bio = bio;
    for (const key of [
      "followerCountPublic",
      "followingCountPublic",
      "followerListPublic",
      "followingListPublic",
    ] as const) {
      if (typeof body?.[key] === "boolean") data[key] = body[key];
    }
    const displayName = body?.displayName === undefined ? undefined : String(body.displayName).trim();
    if (displayName !== undefined) {
      if (displayName.length < 1 || displayName.length > 60) throw new HttpError(400, "Enter your name");
      data.displayName = displayName;
    }
    await prisma.user.update({ where: { id: viewer.id }, data });
    return json({ ok: true });
  }, true);
}
