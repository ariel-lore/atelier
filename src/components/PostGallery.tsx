"use client";

import { useRef, useState, type MouseEvent } from "react";
import type { MediaImage } from "@/lib/types";
import { HeartIcon } from "./Icons";

export function PostGallery({
  images,
  alt,
  onDoubleLike,
}: {
  images: MediaImage[];
  alt: string;
  onDoubleLike?: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [burst, setBurst] = useState(0);
  const lastTap = useRef(0);
  const safe = Math.min(index, Math.max(images.length - 1, 0));
  const image = images[safe];
  if (!image) return null;

  function onPointer(event: MouseEvent) {
    if ((event.target as HTMLElement).closest("button")) return;
    const now = Date.now();
    if (now - lastTap.current < 280) {
      onDoubleLike?.();
      setBurst((n) => n + 1);
      lastTap.current = 0;
      return;
    }
    lastTap.current = now;
  }

  return (
    <div className="gallery" onClick={onPointer}>
      <img className="post-hero" src={image.mediaUrl} alt={alt} draggable={false} />
      {burst > 0 && (
        <span key={burst} className="heart-burst" aria-hidden="true">
          <HeartIcon filled size={92} />
        </span>
      )}
      {images.length > 1 && (
        <>
          <span className="gallery-count">
            {safe + 1}/{images.length}
          </span>
          <button
            type="button"
            className="gallery-nav gallery-prev"
            aria-label="Previous photo"
            disabled={safe === 0}
            onClick={() => setIndex(safe - 1)}
          >
            ‹
          </button>
          <button
            type="button"
            className="gallery-nav gallery-next"
            aria-label="Next photo"
            disabled={safe === images.length - 1}
            onClick={() => setIndex(safe + 1)}
          >
            ›
          </button>
          <div className="gallery-dots" aria-hidden="true">
            {images.map((item, i) => (
              <span key={item.id} className={i === safe ? "on" : ""} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
