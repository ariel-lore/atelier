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
