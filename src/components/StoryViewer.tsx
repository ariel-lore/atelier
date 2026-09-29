"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { StoryDTO } from "@/lib/types";
import { timeAgo } from "@/lib/utils";
import { CloseIcon } from "./Icons";

const DURATION = 4500;

export function StoryViewer({ stories, startId }: { stories: StoryDTO[]; startId: string }) {
  const router = useRouter();
  const initial = Math.max(0, stories.findIndex((s) => s.id === startId));
  const [index, setIndex] = useState(initial);
  const story = stories[index];

  useEffect(() => {
    if (!story) return;
    const url = `/stories/${story.id}`;
    if (window.location.pathname !== url) window.history.replaceState(null, "", url);
    const timer = window.setTimeout(() => {
      setIndex((i) => (i + 1 < stories.length ? i + 1 : i));
    }, DURATION);
    return () => window.clearTimeout(timer);
  }, [story, stories.length]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") setIndex((i) => Math.min(stories.length - 1, i + 1));
      if (e.key === "ArrowLeft") setIndex((i) => Math.max(0, i - 1));
      if (e.key === "Escape") router.push("/");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router, stories.length]);

  if (!story) return null;

  return (
    <div className="story-screen" role="dialog" aria-label="Story viewer">
      <div className="story-progress" aria-hidden="true">
        {stories.map((s, i) => (
          <div key={s.id} className={`story-bar${i < index ? " done" : ""}${i === index ? " active" : ""}`} style={{ ["--dur" as string]: `${DURATION / 1000}s` }}>
            <div className="story-bar-fill" />
          </div>
        ))}
      </div>
      <div className="story-top">
        <div className="story-user">
          {story.author.avatarUrl ? <img className="avatar-xs" src={story.author.avatarUrl} alt="" /> : null}
          <span>
            {story.author.displayName} · {story.label}
          </span>
          <span className="story-time">{timeAgo(story.createdAt)}</span>
        </div>
        <Link href="/" className="icon-btn icon-btn-light" aria-label="Close stories">
          <CloseIcon />
        </Link>
      </div>
      <div className="story-media">
        <img src={story.mediaUrl} alt={story.caption || story.label} />
        {story.caption ? <div className="story-caption">{story.caption}</div> : null}
      </div>
      <button type="button" className="story-tap story-tap-left" aria-label="Previous story" onClick={() => setIndex((i) => Math.max(0, i - 1))} />
      <button
        type="button"
        className="story-tap story-tap-right"
        aria-label="Next story"
        onClick={() => setIndex((i) => (i + 1 < stories.length ? i + 1 : i))}
      />
    </div>
  );
}
