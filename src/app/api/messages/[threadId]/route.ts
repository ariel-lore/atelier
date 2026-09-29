import { getViewer } from "@/lib/auth";
import { handle, json } from "@/lib/api";
import { requireUser } from "@/lib/content";
import { HttpError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { getThreadMessages } from "@/lib/queries";

export async function GET(req: Request, ctx: { params: Promise<{ threadId: string }> }) {
  return handle(req, async () => {
    const viewer = requireUser(await getViewer());
    const { threadId } = await ctx.params;
    const thread = await getThreadMessages(threadId, viewer);
    if (!thread) return json({ error: "Not found" }, 404);
    return json({ thread });
  });
}

export async function POST(req: Request, ctx: { params: Promise<{ threadId: string }> }) {
  return handle(req, async () => {
    const viewer = requireUser(await getViewer());
    if (!viewer.instagramVerified) throw new HttpError(403, "Verify your Instagram before messaging");
    const { threadId } = await ctx.params;
    const part = await prisma.threadParticipant.findUnique({
      where: { threadId_userId: { threadId, userId: viewer.id } },
    });
    if (!part) return json({ error: "Not found" }, 404);
    const body = await req.json().catch(() => null);
    const text = String(body?.body ?? "").trim();
    if (!text || text.length > 2000) throw new HttpError(400, "Write a message");
    const message = await prisma.message.create({
      data: { threadId, senderId: viewer.id, body: text },
    });
    await prisma.thread.update({ where: { id: threadId }, data: { updatedAt: new Date() } });
    await prisma.threadParticipant.update({
      where: { id: part.id },
      data: { lastReadAt: new Date() },
    });
    return json({
      message: {
        id: message.id,
        body: message.body,
        mine: true,
        createdAt: message.createdAt.toISOString(),
      },
    });
  }, true);
}
