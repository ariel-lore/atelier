import Link from "next/link";
import type { ReactNode } from "react";
import type { Viewer } from "@/lib/types";
import { BottomNav } from "./BottomNav";
import { GearIcon } from "./Icons";

export function AppFrame({ viewer, children }: { viewer: Viewer | null; children: ReactNode }) {
  const gearHref = viewer?.role === "OWNER" ? "/circles" : viewer ? "/settings" : "/login";
  return (
    <div className="app">
      <header className="app-header">
        <Link href="/" className="wordmark">
          Atelier
        </Link>
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
