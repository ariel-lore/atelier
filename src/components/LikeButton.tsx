"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { HeartIcon } from "./Icons";

export function LikeButton({ postId, liked, count }: { postId: string; liked: boolean; count: number }) {
  const router = useRouter();
  const [state, setState] = useState({ liked, count });
  const [error, setError] = useState("");

  async function toggle() {
    setError("");
    const res = await fetch(`/api/posts/${postId}/like`, { method: "POST" });
    if (res.status === 401) {
      router.push(`/login?next=/post/${postId}`);
      return;
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.post) {
      setError(data.error || "Could not update");
      return;
    }
    setState({ liked: data.post.likedByMe, count: data.post.likeCount });
  }

  return (
    <div className="post-actions">
      <button type="button" className="icon-btn" aria-label={state.liked ? "Unlike" : "Like"} onClick={toggle} aria-pressed={state.liked}>
        <HeartIcon />
      </button>
      <span className="post-meta" style={{ marginTop: 10 }}>
        {state.count} {state.count === 1 ? "like" : "likes"}
        {error ? ` · ${error}` : ""}
      </span>
    </div>
  );
}
