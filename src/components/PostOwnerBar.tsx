"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function PostOwnerBar({ postId }: { postId: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function remove() {
    if (!window.confirm("Delete this post? The photos go with it.")) return;
    setBusy(true);
    setError("");
    const res = await fetch(`/api/posts/${postId}`, { method: "DELETE" });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Could not delete");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="owner-bar">
      <Link href={`/post/${postId}/edit`} className="btn btn-sm btn-secondary">
        Edit
      </Link>
      <button type="button" className="btn btn-sm btn-danger" onClick={remove} disabled={busy}>
        {busy ? "Deleting…" : "Delete"}
      </button>
      {error ? <div className="error">{error}</div> : null}
    </div>
  );
}
