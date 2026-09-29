"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { StoryDTO } from "@/lib/types";
import { timeAgo } from "@/lib/utils";
import { CloseIcon } from "./Icons";

const DURATION = 4500;

function framesOf(story: StoryDTO) {
  if (story.frames.length > 0) return story.frames;
  return [{ id: "cover", mediaUrl: story.mediaUrl }];
}

export function StoryViewer({ stories, startId }: { stories: StoryDTO[]; startId: string }) {
  const router = useRouter();
  const initial = Math.max(0, stories.findIndex((s) => s.id === startId));
  const [storyIndex, setStoryIndex] = useState(initial);
  const [frameIndex, setFrameIndex] = useState(0);
  const story = stories[storyIndex];
  const frames = story ? framesOf(story) : [];
  const frame = frames[frameIndex] ?? frames[0];

  const goNext = useCallback(() => {
    if (!story) return;
    const count = framesOf(story).length;
    if (frameIndex + 1 < count) {
      setFrameIndex(frameIndex + 1);
      return;
    }
    if (storyIndex + 1 < stories.length) {
      setStoryIndex(storyIndex + 1);
      setFrameIndex(0);
      return;
    }
    router.push("/");
  }, [frameIndex, router, stories.length, story, storyIndex]);

  const goPrev = useCallback(() => {
    if (frameIndex > 0) {
      setFrameIndex(frameIndex - 1);
      return;
    }
    if (storyIndex === 0) return;
    const prev = stories[storyIndex - 1];
    setStoryIndex(storyIndex - 1);
    setFrameIndex(framesOf(prev).length - 1);
  }, [frameIndex, stories, storyIndex]);

  useEffect(() => {
    if (!story) return;
    const url = `/stories/${story.id}`;
    if (window.location.pathname !== url) window.history.replaceState(null, "", url);
  }, [story]);

  useEffect(() => {
    if (!story) return;
    const timer = window.setTimeout(goNext, DURATION);
    return () => window.clearTimeout(timer);
  }, [goNext, story]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "Escape") router.push("/");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goNext, goPrev, router]);

  if (!story || !frame) return null;

  return (
    <div className="story-screen" role="dialog" aria-label={`${story.label} story`}>
      <div className="story-progress" aria-hidden="true">
        {frames.map((item, i) => (
          <div
            key={`${story.id}-${item.id}-${i < frameIndex ? "done" : i === frameIndex ? "now" : "wait"}`}
            className={`story-bar${i < frameIndex ? " done" : ""}${i === frameIndex ? " active" : ""}`}
            style={{ ["--dur" as string]: `${DURATION / 1000}s` }}
          >
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
        <img src={frame.mediaUrl} alt={story.caption || story.label} />
        {story.caption ? <div className="story-caption">{story.caption}</div> : null}
      </div>
      <button type="button" className="story-tap story-tap-left" aria-label="Previous" onClick={goPrev} />
      <button type="button" className="story-tap story-tap-right" aria-label="Next" onClick={goNext} />
    </div>
  );
}
