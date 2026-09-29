"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function FollowButton({ userId, following }: { userId: string; following: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [on, setOn] = useState(following);

  async function toggle() {
    setBusy(true);
    const res = await fetch("/api/follow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    setBusy(false);
    if (res.ok) {
      const data = await res.json();
      setOn(Boolean(data.following));
      router.refresh();
    }
  }

  return (
    <button type="button" className="btn btn-secondary" onClick={toggle} disabled={busy}>
      {on ? "Following" : "Follow"}
    </button>
  );
}
