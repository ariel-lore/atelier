"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { CircleDTO, PostDTO } from "@/lib/types";
import { AudiencePicker } from "./AudiencePicker";
import { PhotoStrip } from "./PhotoStrip";

const MAX = 10;

type Added = { key: string; file: File; url: string };

export function EditPostForm({ post, circles }: { post: PostDTO; circles: CircleDTO[] }) {
  const router = useRouter();
  const [kept, setKept] = useState(post.images);
  const [added, setAdded] = useState<Added[]>([]);
  const [caption, setCaption] = useState(post.caption);
  const [audience, setAudience] = useState(post.audience);
  const [circleIds, setCircleIds] = useState(post.circleIds);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const photos = useMemo(
    () => [...kept.map((image) => ({ key: image.id, url: image.mediaUrl })), ...added.map((photo) => ({ key: photo.key, url: photo.url }))],
    [kept, added],
  );

  function addFiles(files: File[]) {
    setError("");
    setAdded((current) => {
      const room = MAX - kept.length - current.length;
      const next = files.slice(0, Math.max(room, 0)).map((file) => ({
        key: `${file.name}-${file.size}-${crypto.randomUUID()}`,
        file,
        url: URL.createObjectURL(file),
      }));
      return [...current, ...next];
    });
  }

  function removePhoto(key: string) {
    const extra = added.find((photo) => photo.key === key);
    if (extra) {
      URL.revokeObjectURL(extra.url);
      setAdded((current) => current.filter((photo) => photo.key !== key));
      return;
    }
    setKept((current) => current.filter((image) => image.id !== key));
  }

  async function save() {
    if (kept.length + added.length < 1) {
      setError("A post needs at least one photo");
      return;
    }
    if (audience === "CIRCLES" && circleIds.length === 0) {
      setError("Pick at least one circle");
      return;
    }
    setBusy(true);
    setError("");
    const form = new FormData();
    form.set("caption", caption.trim());
    form.set("audience", audience);
    circleIds.forEach((id) => form.append("circleIds", id));
    const removed = post.images.filter((image) => !kept.some((item) => item.id === image.id));
    removed.forEach((image) => form.append("removeImageIds", image.id));
    added.forEach((photo) => form.append("images", photo.file));
    const res = await fetch(`/api/posts/${post.id}`, { method: "PATCH", body: form });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Could not save");
      return;
    }
    router.push(`/post/${post.id}`);
    router.refresh();
  }

  return (
    <div className="form-stack">
      <PhotoStrip
        photos={photos}
        onAdd={addFiles}
        onRemove={removePhoto}
        max={MAX}
        hint="Remove a photo or add more from your camera roll. The first one is the cover."
      />
      <label className="field">
        <span className="label">Caption</span>
        <textarea className="textarea" value={caption} maxLength={2200} onChange={(e) => setCaption(e.target.value)} />
      </label>
      <AudiencePicker
        audience={audience}
        circleIds={circleIds}
        circles={circles}
        onAudience={setAudience}
        onToggleCircle={(id) => setCircleIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))}
      />
      {error ? <div className="error">{error}</div> : null}
      <button type="button" className="btn btn-primary btn-block" onClick={save} disabled={busy}>
        {busy ? "Saving…" : "Save"}
      </button>
    </div>
  );
}
