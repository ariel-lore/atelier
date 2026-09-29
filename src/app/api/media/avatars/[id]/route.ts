import { notFound, serveKey } from "@/lib/media";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: { avatarPath: true },
  });
  if (!user?.avatarPath) return notFound();
  return serveKey(user.avatarPath);
}
