"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { CircleDTO } from "@/lib/types";
import { AudiencePicker, audienceSummary } from "./AudiencePicker";
import { PhotoStrip } from "./PhotoStrip";

const MAX = 10;

type DraftPhoto = { key: string; file: File; url: string };
type Step = "photos" | "details" | "preview";

export function ComposeForm({ circles }: { circles: CircleDTO[] }) {
  const router = useRouter();
  const [kind, setKind] = useState<"post" | "story">("post");
  const [step, setStep] = useState<Step>("photos");
  const [photos, setPhotos] = useState<DraftPhoto[]>([]);
  const [caption, setCaption] = useState("");
  const [label, setLabel] = useState("");
  const [audience, setAudience] = useState<"PUBLIC" | "CIRCLES" | "PRIVATE">("PUBLIC");
  const [circleIds, setCircleIds] = useState<string[]>([]);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const photosRef = useRef(photos);
  photosRef.current = photos;
  useEffect(() => {
    return () => photosRef.current.forEach((photo) => URL.revokeObjectURL(photo.url));
  }, []);

  const summary = useMemo(() => audienceSummary(audience, circleIds, circles), [audience, circleIds, circles]);

  function addFiles(files: File[]) {
    setError("");
    setPhotos((current) => {
      const room = MAX - current.length;
      const next = files.slice(0, room).map((file) => ({
        key: `${file.name}-${file.size}-${crypto.randomUUID()}`,
        file,
        url: URL.createObjectURL(file),
      }));
      return [...current, ...next];
    });
  }

  function removePhoto(key: string) {
    setPhotos((current) => {
      const found = current.find((photo) => photo.key === key);
      if (found) URL.revokeObjectURL(found.url);
      return current.filter((photo) => photo.key !== key);
    });
    setPreviewIndex(0);
  }

  function validateDetails() {
    if (photos.length === 0) return "Add a photo from your camera roll";
    if (kind === "story" && label.trim().length < 1) return "Add a short label for the story ring";
    if (audience === "CIRCLES" && circleIds.length === 0) return "Pick at least one circle";
    return "";
  }

  async function publish() {
    const problem = validateDetails();
    if (problem) {
      setError(problem);
      return;
    }
    setBusy(true);
    setError("");
    const form = new FormData();
    form.set("caption", caption.trim());
    form.set("audience", audience);
    if (kind === "story") form.set("label", label.trim());
    circleIds.forEach((id) => form.append("circleIds", id));
    photos.forEach((photo) => form.append("images", photo.file));
    const res = await fetch(kind === "post" ? "/api/posts" : "/api/stories", { method: "POST", body: form });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Could not publish");
      return;
    }
    if (kind === "post" && data.post?.id) router.push(`/post/${data.post.id}`);
    else if (data.story?.id) router.push(`/stories/${data.story.id}`);
    else router.push("/");
    router.refresh();
  }

  const photo = photos[Math.min(previewIndex, Math.max(photos.length - 1, 0))];

  return (
    <div className="form-stack">
      <div className="step-row" aria-label="Compose steps">
        {(["photos", "details", "preview"] as const).map((name, index) => (
          <span key={name} className={step === name ? "step-on" : ""}>
            {index + 1}. {name}
          </span>
        ))}
      </div>

      {step === "photos" && (
        <>
          <div className="segmented" role="radiogroup" aria-label="What to share">
            <label>
              <input type="radio" checked={kind === "post"} onChange={() => setKind("post")} /> Post
            </label>
            <label>
              <input type="radio" checked={kind === "story"} onChange={() => setKind("story")} /> Story
            </label>
          </div>
          <PhotoStrip
            photos={photos.map((photo) => ({ key: photo.key, url: photo.url }))}
            onAdd={addFiles}
            onRemove={removePhoto}
            max={MAX}
            hint={
              kind === "post"
                ? "Camera roll or camera. Up to 10 photos. The first one is the cover."
                : "Add one or more frames. They expire together after 24 hours."
            }
          />
          {error ? <div className="error">{error}</div> : null}
          <button
            type="button"
            className="btn btn-primary btn-block"
            onClick={() => {
              if (photos.length === 0) {
                setError("Add a photo from your camera roll");
                return;
              }
              setError("");
              setStep("details");
            }}
          >
            Next
          </button>
        </>
      )}

      {step === "details" && (
        <>
          {kind === "story" && (
            <label className="field">
              <span className="label">Label</span>
              <input className="input" value={label} maxLength={24} placeholder="Studio" onChange={(e) => setLabel(e.target.value)} />
            </label>
          )}
          <label className="field">
            <span className="label">Caption</span>
            <textarea
              className="textarea"
              value={caption}
              maxLength={kind === "story" ? 200 : 2200}
              placeholder={kind === "story" ? "A line on the photo" : "Write a caption"}
              onChange={(e) => setCaption(e.target.value)}
            />
          </label>
          <AudiencePicker
            audience={audience}
            circleIds={circleIds}
            circles={circles}
            onAudience={setAudience}
            onToggleCircle={(id) => setCircleIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))}
          />
          {error ? <div className="error">{error}</div> : null}
          <div className="row-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setStep("photos")}>
              Back
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                const problem = validateDetails();
                if (problem) {
                  setError(problem);
                  return;
                }
                setError("");
                setPreviewIndex(0);
                setStep("preview");
              }}
            >
              Preview
            </button>
          </div>
        </>
      )}

      {step === "preview" && photo && (
        <>
          <div className={kind === "story" ? "preview-story" : "preview-post"}>
            <img src={photo.url} alt="" />
            {kind === "story" && caption.trim() ? <div className="story-caption">{caption.trim()}</div> : null}
            {photos.length > 1 && (
              <div className="preview-nav">
                <button type="button" className="btn btn-sm btn-secondary" onClick={() => setPreviewIndex((i) => Math.max(0, i - 1))} disabled={previewIndex === 0}>
                  Prev
                </button>
                <span>
                  {previewIndex + 1} / {photos.length}
                </span>
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  onClick={() => setPreviewIndex((i) => Math.min(photos.length - 1, i + 1))}
                  disabled={previewIndex === photos.length - 1}
                >
                  Next
                </button>
              </div>
            )}
          </div>
          {kind === "post" && caption.trim() ? <p className="post-caption">{caption.trim()}</p> : null}
          {kind === "story" && <p className="help">Ring label: {label.trim()}</p>}
          <div className="post-privacy">{summary}</div>
          <p className="help">{kind === "story" ? "Visible for 24 hours, then gone." : "This is what people in that audience will get. Nothing is saved until you publish."}</p>
          {error ? <div className="error">{error}</div> : null}
          <div className="row-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setStep("details")} disabled={busy}>
              Back
            </button>
            <button type="button" className="btn btn-primary" onClick={publish} disabled={busy}>
              {busy ? "Publishing…" : kind === "post" ? "Publish post" : "Share story"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
