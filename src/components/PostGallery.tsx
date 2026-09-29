"use client";

import { useState } from "react";
import type { MediaImage } from "@/lib/types";

export function PostGallery({ images, alt }: { images: MediaImage[]; alt: string }) {
  const [index, setIndex] = useState(0);
  const safe = Math.min(index, Math.max(images.length - 1, 0));
  const image = images[safe];
  if (!image) return null;
  return (
    <div className="gallery">
      <img className="post-hero" src={image.mediaUrl} alt={alt} />
      {images.length > 1 && (
        <>
          <span className="gallery-count">
            {safe + 1} / {images.length}
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
        </>
      )}
    </div>
  );
}
