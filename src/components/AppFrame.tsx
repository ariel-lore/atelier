import Link from "next/link";
import type { ReactNode } from "react";
import type { Viewer } from "@/lib/types";
import { BottomNav } from "./BottomNav";
import { GearIcon } from "./Icons";
import { Wordmark } from "./Wordmark";

export function AppFrame({
  viewer,
  ownerHandle = "bart",
  children,
}: {
  viewer: Viewer | null;
  ownerHandle?: string;
  children: ReactNode;
}) {
  const gearHref = viewer?.role === "OWNER" ? "/circles" : viewer ? "/settings" : "/login";
  return (
    <div className="app">
      <header className="app-header">
        <Wordmark ownerHandle={ownerHandle} />
        <div className="header-actions">
          {viewer ? (
            <Link href={gearHref} className="icon-btn" aria-label={viewer.role === "OWNER" ? "Circles" : "Settings"}>
              <GearIcon />
            </Link>
          ) : (
            <Link href="/login" className="btn btn-ghost">
              Sign in
            </Link>
          )}
        </div>
      </header>
      <main className="views">{children}</main>
      <BottomNav />
    </div>
  );
}
