"use client";

import { useRef } from "react";

export function PhotoStrip({
  photos,
  onAdd,
  onRemove,
  max,
  hint,
}: {
  photos: { key: string; url: string }[];
  onAdd: (files: File[]) => void;
  onRemove: (key: string) => void;
  max: number;
  hint: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="field">
      <span className="label">Photos</span>
      <div className="photo-strip">
        {photos.map((photo, index) => (
          <div key={photo.key} className="photo-thumb">
            <img src={photo.url} alt="" />
            <button type="button" className="photo-remove" aria-label={`Remove photo ${index + 1}`} onClick={() => onRemove(photo.key)}>
              ×
            </button>
            {photos.length > 1 && <span className="photo-index">{index + 1}</span>}
          </div>
        ))}
        {photos.length < max && (
          <button type="button" className="photo-add" onClick={() => inputRef.current?.click()}>
            <span aria-hidden="true">+</span>
            {photos.length === 0 ? "Add" : "Add more"}
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        className="sr-only"
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        onChange={(event) => {
          const list = event.target.files ? [...event.target.files] : [];
          event.target.value = "";
          if (list.length) onAdd(list);
        }}
      />
      <p className="help">{hint}</p>
    </div>
  );
}
