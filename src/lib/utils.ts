export function formatCount(n: number): string {
  return n.toLocaleString("en-US");
}

/** Small uppercase timestamp under a post, in the style of a photo app. */
export function igStamp(input: Date | string, now = Date.now()): string {
  const t = typeof input === "string" ? new Date(input).getTime() : input.getTime();
  const s = Math.max(0, Math.floor((now - t) / 1000));
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (h < 1) return m <= 1 ? "1 minute ago" : `${m} minutes ago`;
  if (h < 24) return h === 1 ? "1 hour ago" : `${h} hours ago`;
  if (d < 7) return d === 1 ? "1 day ago" : `${d} days ago`;
  return new Date(t).toLocaleDateString("en-US", { month: "long", day: "numeric" });
}

export function timeAgo(input: Date | string, now = Date.now()): string {
  const t = typeof input === "string" ? new Date(input).getTime() : input.getTime();
  const s = Math.max(0, Math.floor((now - t) / 1000));
  if (s < 45) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  const w = Math.floor(d / 7);
  if (w < 5) return `${w}w`;
  return new Date(t).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

export function avatarUrlFor(userId: string, avatarPath: string | null | undefined): string | null {
  if (!avatarPath) return null;
  return `/api/media/avatars/${userId}`;
}

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
