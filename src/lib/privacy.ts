import type { Audience } from "./types";

/**
 * Server-side audience check.
 *
 * PUBLIC  — anyone, including logged-out visitors
 * CIRCLES — site owner, the author, or a viewer who belongs to at least one selected circle
 * PRIVATE — site owner and the author only ("only me")
 *
 * The site owner (role OWNER) can see every post and story. That is the
 * private-to-owner escape hatch: exclusive content is never sent to other viewers.
 */
export type AccessViewer = {
  id: string;
  role: string;
  circleIds: string[];
} | null;

export type AccessItem = {
  authorId: string;
  audience: string;
  circleIds: string[];
};

const AUDIENCES = new Set<Audience>(["PUBLIC", "CIRCLES", "PRIVATE"]);

export function asAudience(value: string): Audience {
  if (AUDIENCES.has(value as Audience)) return value as Audience;
  return "PRIVATE";
}

export function canView(viewer: AccessViewer, item: AccessItem): boolean {
  if (viewer?.role === "OWNER") return true;
  const audience = asAudience(item.audience);
  if (audience === "PUBLIC") return true;
  if (!viewer) return false;
  if (viewer.id === item.authorId) return true;
  if (audience === "PRIVATE") return false;
  return item.circleIds.some((id) => viewer.circleIds.includes(id));
}

export function canSeePrivateProfileField(
  viewer: AccessViewer,
  profileUserId: string,
  isPublic: boolean,
): boolean {
  if (isPublic) return true;
  if (!viewer) return false;
  return viewer.id === profileUserId || viewer.role === "OWNER";
}

export function storyIsLive(expiresAt: Date, now = new Date()): boolean {
  return expiresAt.getTime() > now.getTime();
}
