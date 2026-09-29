"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { CircleDTO } from "@/lib/types";

export function ComposeForm({ circles }: { circles: CircleDTO[] }) {
  const router = useRouter();
  const [kind, setKind] = useState<"post" | "story">("post");
  const [audience, setAudience] = useState("PUBLIC");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const form = new FormData(e.currentTarget);
    form.set("audience", audience);
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

  return (
    <form className="form-stack" onSubmit={onSubmit}>
      <div className="segmented" role="radiogroup" aria-label="What to share">
        <label>
          <input type="radio" name="kind" checked={kind === "post"} onChange={() => setKind("post")} /> Post
        </label>
        <label>
          <input type="radio" name="kind" checked={kind === "story"} onChange={() => setKind("story")} /> Story
        </label>
      </div>

      {kind === "story" && (
        <label className="field">
          <span className="label">Label</span>
          <input className="input" name="label" maxLength={24} placeholder="Studio" required />
        </label>
      )}

      <label className="field">
        <span className="label">{kind === "story" ? "Caption" : "Caption"}</span>
        <textarea className="textarea" name="caption" maxLength={kind === "story" ? 200 : 2200} placeholder="Write a caption" />
      </label>

      <label className="field">
        <span className="label">Photo</span>
        <input className="file-input" type="file" name="image" accept="image/jpeg,image/png,image/webp,image/gif" required />
      </label>

      <fieldset className="field" style={{ border: 0, padding: 0, margin: 0 }}>
        <legend className="label">Who can see this</legend>
        <div className="segmented">
          {(
            [
              ["PUBLIC", "Public"],
              ["CIRCLES", "Circles"],
              ["PRIVATE", "Only me"],
            ] as const
          ).map(([value, label]) => (
            <label key={value}>
              <input type="radio" name="audience-ui" checked={audience === value} onChange={() => setAudience(value)} />
              {label}
            </label>
          ))}
        </div>
        {audience === "CIRCLES" && (
          <div className="check-list" style={{ marginTop: 10 }}>
            {circles.length === 0 && <p className="help">Create a circle first.</p>}
            {circles.map((circle) => (
              <label key={circle.id}>
                <input type="checkbox" name="circleIds" value={circle.id} />
                <span className="circle-dot" style={{ ["--c" as string]: circle.color }} />
                {circle.name}
              </label>
            ))}
          </div>
        )}
      </fieldset>

      {error ? <div className="error">{error}</div> : null}
      <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
        {busy ? "Publishing…" : kind === "post" ? "Share post" : "Share story"}
      </button>
      <p className="help">Stories disappear after 24 hours. Circle posts stay off the public grid.</p>
    </form>
  );
}
