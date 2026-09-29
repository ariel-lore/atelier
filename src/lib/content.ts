import { randomUUID } from "crypto";
import { prisma } from "./prisma";
import { HttpError } from "./http";
import type { Audience, Viewer } from "./types";
import { extensionForMime, saveObject, sniffImageMime } from "./storage";
import { MAX_IMAGE_BYTES } from "./utils";

export async function readImageFile(file: FormDataEntryValue | null, folder: "posts" | "stories" | "avatars") {
  if (!(file instanceof File) || file.size === 0) {
    throw new HttpError(400, "Choose an image");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new HttpError(400, "Image must be under 5MB");
  }
  const buf = Buffer.from(await file.arrayBuffer());
  const mime = sniffImageMime(buf);
  if (!mime) throw new HttpError(400, "Use a JPEG, PNG, WebP, or GIF");
  const ext = extensionForMime(mime);
  if (!ext) throw new HttpError(400, "Unsupported image");
  const key = `${folder}/${randomUUID()}.${ext}`;
  await saveObject(key, buf);
  return key;
}

export function parseAudience(raw: string, circleIds: string[]): { audience: Audience; circleIds: string[] } {
  if (raw === "PUBLIC") return { audience: "PUBLIC", circleIds: [] };
  if (raw === "PRIVATE") return { audience: "PRIVATE", circleIds: [] };
  if (raw === "CIRCLES") {
    const unique = [...new Set(circleIds.filter(Boolean))];
    if (unique.length === 0) throw new HttpError(400, "Pick at least one circle");
    return { audience: "CIRCLES", circleIds: unique };
  }
  throw new HttpError(400, "Choose who can see this");
}

export async function assertCirclesOwned(ownerId: string, circleIds: string[]) {
  if (circleIds.length === 0) return;
  const found = await prisma.circle.findMany({
    where: { ownerId, id: { in: circleIds } },
    select: { id: true },
  });
  if (found.length !== circleIds.length) {
    throw new HttpError(400, "Unknown circle");
  }
}

export function requireOwner(viewer: Viewer | null): Viewer {
  if (!viewer) throw new HttpError(401, "Sign in required");
  if (viewer.role !== "OWNER") throw new HttpError(403, "Only the owner can do that");
  return viewer;
}

export function requireUser(viewer: Viewer | null): Viewer {
  if (!viewer) throw new HttpError(401, "Sign in required");
  return viewer;
}

const HANDLE = /^[a-z0-9][a-z0-9_]{1,19}$/;

export function normalizeHandle(raw: string) {
  const handle = raw.trim().toLowerCase().replace(/^@/, "");
  if (!HANDLE.test(handle)) {
    throw new HttpError(400, "Handle must be 2–20 letters, numbers, or underscores");
  }
  return handle;
}

export function normalizeEmail(raw: string) {
  const email = raw.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 120) {
    throw new HttpError(400, "Enter a valid email");
  }
  return email;
}

export function assertPassword(raw: string) {
  if (raw.length < 8 || raw.length > 200) {
    throw new HttpError(400, "Password must be at least 8 characters");
  }
  return raw;
}

export function normalizeInstagramHandle(raw: string) {
  const handle = raw.trim().replace(/^@/, "").replace(/\/+$/, "");
  if (!/^[A-Za-z0-9._]{1,30}$/.test(handle)) {
    throw new HttpError(400, "Enter an Instagram username");
  }
  return handle;
}

/** Verification URLs must be public https Instagram links. Blocks internal hosts. */
export function assertInstagramUrl(raw: string) {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    throw new HttpError(400, "Paste a full Instagram link");
  }
  if (url.protocol !== "https:") throw new HttpError(400, "Instagram links should start with https://");
  const host = url.hostname.toLowerCase();
  const allowed = host === "instagram.com" || host === "www.instagram.com";
  if (!allowed) throw new HttpError(400, "Paste a link on instagram.com");
  if (url.username || url.password) throw new HttpError(400, "That link is not allowed");
  return url.toString();
}

async function fetchInstagramPage(start: string): Promise<Response | null> {
  let current = start;
  for (let hop = 0; hop < 3; hop++) {
    const res = await fetch(current, {
      redirect: "manual",
      headers: {
        "User-Agent": "AtelierVerify/1.0",
        Accept: "text/html,application/json;q=0.9,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(8000),
    });
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      if (!location) return null;
      const next = new URL(location, current);
      const host = next.hostname.toLowerCase();
      if (next.protocol !== "https:" || (host !== "instagram.com" && host !== "www.instagram.com")) {
        return null;
      }
      current = next.toString();
      continue;
    }
    return res;
  }
  return null;
}

export async function contentContainsCode(url: string, code: string): Promise<"found" | "missing" | "unreachable"> {
  try {
    const res = await fetchInstagramPage(url);
    if (!res || !res.ok) return "unreachable";
    const length = Number(res.headers.get("content-length") || 0);
    if (length > 1_500_000) return "unreachable";
    const text = (await res.text()).slice(0, 500_000).normalize("NFC");
    if (text.includes(code.normalize("NFC"))) return "found";
    return "missing";
  } catch {
    return "unreachable";
  }
}
