import { redirect } from "next/navigation";
import { VerifyPanel } from "@/components/VerifyPanel";
import { getViewer } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function VerifyPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/login?next=/verify");
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
  return (
    <VerifyPanel
      verified={viewer.instagramVerified}
      instagramHandle={viewer.instagramHandle}
      isOwner={viewer.role === "OWNER"}
      initial={
        mine
          ? {
              id: mine.id,
              code: mine.code,
              instagramHandle: mine.instagramHandle,
              contentUrl: mine.contentUrl,
              status: mine.status,
              note: mine.note,
            }
          : null
      }
      queue={queue.map((item) => ({
        id: item.id,
        code: item.code,
        instagramHandle: item.instagramHandle,
        contentUrl: item.contentUrl,
        status: item.status,
        note: item.note,
        createdAt: item.createdAt.toISOString(),
        user: item.user,
      }))}
    />
  );
}
