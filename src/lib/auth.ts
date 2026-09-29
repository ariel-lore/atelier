import { createHash, randomBytes } from "crypto";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import type { Role, Viewer } from "./types";
import { avatarUrlFor } from "./utils";

export const SESSION_COOKIE = "atelier_session";
const SESSION_DAYS = 30;

function authSecret() {
  const secret = process.env.AUTH_SECRET;
  if (secret && secret.length >= 16) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET must be set to a long random string in production");
  }
  return "dev-only-atelier-secret-change-in-production";
}

export function hashSessionToken(token: string) {
  return createHash("sha256").update(`${authSecret()}:${token}`).digest("hex");
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

function toViewer(user: {
  id: string;
  email: string;
  displayName: string;
  handle: string;
  role: string;
  instagramHandle: string | null;
  instagramVerified: boolean;
  avatarPath: string | null;
  circleMemberships: { circleId: string }[];
}): Viewer {
  const role: Role = user.role === "OWNER" ? "OWNER" : "MEMBER";
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    handle: user.handle,
    role,
    instagramHandle: user.instagramHandle,
    instagramVerified: user.instagramVerified,
    circleIds: user.circleMemberships.map((m) => m.circleId),
    avatarUrl: avatarUrlFor(user.id, user.avatarPath),
  };
}

export async function getViewer(): Promise<Viewer | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { tokenHash: hashSessionToken(token) },
    include: {
      user: {
        include: { circleMemberships: { select: { circleId: true } } },
      },
    },
  });
  if (!session || session.expiresAt.getTime() < Date.now()) {
    if (session) {
      await prisma.session.delete({ where: { id: session.id } }).catch(() => undefined);
    }
    return null;
  }
  return toViewer(session.user);
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await prisma.session.create({
    data: { userId, tokenHash: hashSessionToken(token), expiresAt },
  });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: hashSessionToken(token) } });
  }
  jar.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}
