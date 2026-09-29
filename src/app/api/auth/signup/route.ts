import { createSession } from "@/lib/auth";
import { handle, json } from "@/lib/api";
import { assertPassword, normalizeEmail, normalizeHandle } from "@/lib/content";
import { HttpError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

export async function POST(req: Request) {
  return handle(req, async () => {
    const body = await req.json().catch(() => null);
    const email = normalizeEmail(String(body?.email ?? ""));
    const password = assertPassword(String(body?.password ?? ""));
    const handleName = normalizeHandle(String(body?.handle ?? ""));
    const displayName = String(body?.displayName ?? "").trim();
    if (displayName.length < 1 || displayName.length > 60) {
      throw new HttpError(400, "Enter your name");
    }
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { handle: handleName }] },
    });
    if (existing?.email === email) throw new HttpError(409, "That email is already registered");
    if (existing) throw new HttpError(409, "That handle is taken");
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: await hashPassword(password),
        displayName,
        handle: handleName,
        role: "MEMBER",
      },
    });
    await createSession(user.id);
    return json({ ok: true, handle: user.handle });
  }, true);
}
