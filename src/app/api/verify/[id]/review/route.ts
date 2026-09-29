import { getViewer } from "@/lib/auth";
import { handle, json } from "@/lib/api";
import { requireOwner } from "@/lib/content";
import { HttpError } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(req, async () => {
    requireOwner(await getViewer());
    const { id } = await ctx.params;
    const row = await prisma.verification.findUnique({ where: { id } });
    if (!row || row.status !== "PENDING") throw new HttpError(404, "Nothing to review");
    const body = await req.json().catch(() => null);
    const action = String(body?.action ?? "");
    if (action === "verify") {
      await prisma.$transaction([
        prisma.verification.update({
          where: { id },
          data: { status: "VERIFIED", reviewedAt: new Date(), note: "Confirmed by Bart." },
        }),
        prisma.user.update({
          where: { id: row.userId },
          data: { instagramVerified: true, instagramHandle: row.instagramHandle },
        }),
      ]);
      return json({ ok: true, status: "VERIFIED" });
    }
    if (action === "reject") {
      await prisma.verification.update({
        where: { id },
        data: { status: "REJECTED", reviewedAt: new Date(), note: "Could not confirm the phrase." },
      });
      return json({ ok: true, status: "REJECTED" });
    }
    throw new HttpError(400, "Unknown action");
  }, true);
}
