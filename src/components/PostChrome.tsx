"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { PostDTO } from "@/lib/types";
import { formatCount, igStamp } from "@/lib/utils";
import { BookmarkIcon, CommentIcon, HeartIcon, LockIcon, ShareIcon } from "./Icons";
import { PostGallery } from "./PostGallery";
import { PostOwnerBar } from "./PostOwnerBar";

function audienceText(post: PostDTO) {
  if (post.audience === "PRIVATE") return "Only me";
  if (post.circleNames.length === 0) return "Circles";
  return post.circleNames.join(", ");
}

function rich(text: string) {
  return text.split(/(@[a-z0-9._]+|#[\w]+)/gi).map((part, i) =>
    part.startsWith("@") || part.startsWith("#") ? (
      <span key={i} className="post-token">
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

function Caption({ handle, text }: { handle: string; text: string }) {
  const [open, setOpen] = useState(false);
  const flat = text.replace(/\s+/g, " ").trim();
  const long = flat.length > 90;
  const shown = open || !long ? text : `${flat.slice(0, 86).trimEnd()}…`;
  return (
    <p className="post-caption">
      <Link href={`/u/${handle}`} className="post-author">
        {handle}
      </Link>{" "}
      {rich(shown)}
      {long && !open ? (
        <button type="button" className="more" onClick={() => setOpen(true)}>
          more
        </button>
      ) : null}
    </p>
  );
}

export function PostChrome({ post, manage = false }: { post: PostDTO; manage?: boolean }) {
  const router = useRouter();
  const [liked, setLiked] = useState(post.likedByMe);
  const [count, setCount] = useState(post.likeCount);
  const [saved, setSaved] = useState(false);
  const [note, setNote] = useState("");

  async function like() {
    const res = await fetch(`/api/posts/${post.id}/like`, { method: "POST" });
    if (res.status === 401) {
      router.push(`/login?next=/post/${post.id}`);
      return;
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.post) return;
    setLiked(data.post.likedByMe);
    setCount(data.post.likeCount);
  }

  async function share() {
    const url = `${window.location.origin}/post/${post.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setNote("Link copied");
    } catch {
      setNote(url);
    }
    window.setTimeout(() => setNote(""), 1600);
  }

  return (
    <article className="feed-card">
      <header className="feed-head">
        <Link href={`/u/${post.author.handle}`} className="feed-avatar">
          {post.author.avatarUrl ? <img src={post.author.avatarUrl} alt="" /> : <span>{post.author.displayName.slice(0, 1)}</span>}
        </Link>
        <div className="feed-name">
          <Link href={`/u/${post.author.handle}`}>{post.author.handle}</Link>
          {post.audience !== "PUBLIC" ? (
            <span className="feed-audience">
              <LockIcon size={10} /> {audienceText(post)}
            </span>
          ) : null}
        </div>
      </header>
      <PostGallery images={post.images} alt={post.caption || "Post"} onDoubleLike={() => { if (!liked) void like(); }} />
      <div className="post-actions">
        <div className="post-actions-left">
          <button type="button" className={`icon-btn${liked ? " liked" : ""}`} aria-label={liked ? "Unlike" : "Like"} aria-pressed={liked} onClick={() => void like()}>
            <HeartIcon filled={liked} />
          </button>
          <button type="button" className="icon-btn" aria-label="Comment">
            <CommentIcon />
          </button>
          <button type="button" className="icon-btn" aria-label="Share" onClick={() => void share()}>
            <ShareIcon />
          </button>
        </div>
        <button type="button" className="icon-btn" aria-label={saved ? "Remove bookmark" : "Save"} aria-pressed={saved} onClick={() => setSaved((v) => !v)}>
          <BookmarkIcon filled={saved} />
        </button>
      </div>
      <div className="like-count">{formatCount(count)} {count === 1 ? "like" : "likes"}</div>
      {post.caption ? <Caption handle={post.author.handle} text={post.caption} /> : null}
      {note ? <p className="share-note">{note}</p> : null}
      <div className="ig-time">{igStamp(post.createdAt)}</div>
      {manage ? <PostOwnerBar postId={post.id} /> : null}
    </article>
  );
}
