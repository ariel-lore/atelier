import { getViewer, createSession } from "@/lib/auth";
import { handle, json } from "@/lib/api";
import { assertPassword, normalizeEmail } from "@/lib/content";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth";

export async function POST(req: Request) {
  return handle(req, async () => {
    const body = await req.json().catch(() => null);
    const email = normalizeEmail(String(body?.email ?? ""));
    const password = assertPassword(String(body?.password ?? ""));
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return json({ error: "Invalid email or password" }, 401);
    }
    await createSession(user.id);
    const viewer = await getViewer();
    return json({ ok: true, user: viewer });
  }, true);
}
