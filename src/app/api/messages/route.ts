import { getViewer } from "@/lib/auth";
import { handle, json } from "@/lib/api";
import { requireUser } from "@/lib/content";
import { HttpError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { findOrCreateThread, listThreads, toPerson } from "@/lib/queries";

export async function GET(req: Request) {
  return handle(req, async () => {
    const viewer = requireUser(await getViewer());
    if (!viewer.instagramVerified) {
      return json({ threads: [], needsVerification: true });
    }
    return json({ threads: await listThreads(viewer), needsVerification: false });
  });
}

export async function POST(req: Request) {
  return handle(req, async () => {
    const viewer = requireUser(await getViewer());
    if (!viewer.instagramVerified) {
      throw new HttpError(403, "Verify your Instagram before messaging");
    }
    const body = await req.json().catch(() => null);
    const userId = String(body?.userId ?? "");
    if (userId === viewer.id) throw new HttpError(400, "That's you");
    const other = await prisma.user.findUnique({ where: { id: userId } });
    if (!other) throw new HttpError(404, "Person not found");
    if (!other.instagramVerified) {
      throw new HttpError(403, "Open Instagram — they are not verified on Atelier yet");
    }
    const thread = await findOrCreateThread(viewer.id, other.id);
    const text = body?.body === undefined ? "" : String(body.body).trim();
    if (text) {
      if (text.length > 2000) throw new HttpError(400, "Message is too long");
      await prisma.message.create({ data: { threadId: thread.id, senderId: viewer.id, body: text } });
      await prisma.thread.update({ where: { id: thread.id }, data: { updatedAt: new Date() } });
    }
    return json({ threadId: thread.id, other: toPerson(other, viewer) });
  }, true);
}
