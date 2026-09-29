"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Wordmark({ ownerHandle }: { ownerHandle: string }) {
  const path = usePathname();
  const onOwnerProfile = path === "/" || path === `/u/${ownerHandle}`;
  return (
    <Link href="/" className={`wordmark${onOwnerProfile ? " wordmark-handle" : ""}`}>
      {onOwnerProfile ? ownerHandle : "Atelier"}
    </Link>
  );
}
