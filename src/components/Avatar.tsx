import { initials } from "@/lib/utils";

export function Avatar({
  src,
  name,
  size = "lg",
}: {
  src: string | null;
  name: string;
  size?: "lg" | "md" | "xs";
}) {
  const cls = size === "lg" ? "avatar" : size === "xs" ? "avatar-xs" : "avatar-sm";
  if (src) {
    return <img className={cls} src={src} alt="" width={size === "lg" ? 88 : size === "xs" ? 32 : 48} height={size === "lg" ? 88 : size === "xs" ? 32 : 48} />;
  }
  return <span className={`${cls} avatar-fallback`}>{initials(name)}</span>;
}
