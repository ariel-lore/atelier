import { getViewer } from "@/lib/auth";
import { handle, json } from "@/lib/api";
import {
  assertInstagramUrl,
  contentContainsCode,
  normalizeInstagramHandle,
  requireUser,
} from "@/lib/content";
import { generateEmojiSentence } from "@/lib/emojiCode";
import { HttpError } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  return handle(req, async () => {
    const viewer = requireUser(await getViewer());
    const mine = await prisma.verification.findFirst({
      where: { userId: viewer.id },
      orderBy: { createdAt: "desc" },
    });
    const queue =
      viewer.role === "OWNER"
        ? await prisma.verification.findMany({
            where: { status: "PENDING" },
            include: { user: { select: { id: true, displayName: true, handle: true } } },
            orderBy: { createdAt: "asc" },
          })
        : [];
    return json({
      verification: mine
        ? {
            id: mine.id,
            code: mine.code,
            instagramHandle: mine.instagramHandle,
            contentUrl: mine.contentUrl,
            status: mine.status,
            note: mine.note,
          }
        : null,
      verified: viewer.instagramVerified,
      instagramHandle: viewer.instagramHandle,
      queue: queue.map((item) => ({
        id: item.id,
        code: item.code,
        instagramHandle: item.instagramHandle,
        contentUrl: item.contentUrl,
        note: item.note,
        createdAt: item.createdAt.toISOString(),
        user: item.user,
      })),
    });
  });
}

export async function POST(req: Request) {
  return handle(req, async () => {
    const viewer = requireUser(await getViewer());
    if (viewer.role === "OWNER" && viewer.instagramVerified) {
      /* owner can still review; generating a code for the owner is allowed if not verified */
    }
    const body = await req.json().catch(() => null);
    const action = String(body?.action ?? "");

    if (action === "generate") {
      if (viewer.instagramVerified) throw new HttpError(400, "Your Instagram is already verified");
      const instagramHandle = normalizeInstagramHandle(String(body?.instagramHandle ?? ""));
      const code = generateEmojiSentence();
      const pending = await prisma.verification.findFirst({
        where: { userId: viewer.id, status: "PENDING" },
        orderBy: { createdAt: "desc" },
      });
      const row = pending
        ? await prisma.verification.update({
            where: { id: pending.id },
            data: { code, instagramHandle, contentUrl: "", note: "" },
          })
        : await prisma.verification.create({
            data: { userId: viewer.id, code, instagramHandle },
          });
      return json({
        verification: {
          id: row.id,
          code: row.code,
          instagramHandle: row.instagramHandle,
          contentUrl: row.contentUrl,
          status: row.status,
          note: row.note,
        },
      });
    }

    if (action === "submit") {
      const pending = await prisma.verification.findFirst({
        where: { userId: viewer.id, status: "PENDING" },
        orderBy: { createdAt: "desc" },
      });
      if (!pending) throw new HttpError(400, "Create a phrase first");
      const contentUrl = assertInstagramUrl(String(body?.contentUrl ?? ""));
      const found = await contentContainsCode(contentUrl, pending.code);
      if (found === "found") {
        await prisma.$transaction([
          prisma.verification.update({
            where: { id: pending.id },
            data: {
              contentUrl,
              status: "VERIFIED",
              note: "Phrase found on the linked page.",
              reviewedAt: new Date(),
            },
          }),
          prisma.user.update({
            where: { id: viewer.id },
            data: { instagramVerified: true, instagramHandle: pending.instagramHandle },
          }),
        ]);
        return json({ status: "VERIFIED", note: "Phrase found on the linked page." });
      }
      const note =
        found === "missing"
          ? "The page loaded, but the phrase was not in it. Bart can confirm it by eye."
          : "Instagram did not return the page to Atelier (this is common). Bart can confirm it by eye.";
      await prisma.verification.update({
        where: { id: pending.id },
        data: { contentUrl, note },
      });
      return json({ status: "PENDING", note });
    }

    throw new HttpError(400, "Unknown action");
  }, true);
}
