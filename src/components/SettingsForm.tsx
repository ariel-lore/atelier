"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SettingsForm({
  displayName,
  bio,
  followerCountPublic,
  followingCountPublic,
  followerListPublic,
  followingListPublic,
}: {
  displayName: string;
  bio: string;
  followerCountPublic: boolean;
  followingCountPublic: boolean;
  followerListPublic: boolean;
  followingListPublic: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaved(false);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/profile/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName: form.get("displayName"),
        bio: form.get("bio"),
        followerCountPublic: form.get("followerCountPublic") === "on",
        followingCountPublic: form.get("followingCountPublic") === "on",
        followerListPublic: form.get("followerListPublic") === "on",
        followingListPublic: form.get("followingListPublic") === "on",
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || "Could not save");
      return;
    }
    setError("");
    setSaved(true);
    router.refresh();
  }

  const toggles = [
    ["followerCountPublic", "Follower count", "Shown on your profile", followerCountPublic],
    ["followingCountPublic", "Following count", "The number, not the names", followingCountPublic],
    ["followerListPublic", "Follower list", "Who follows you", followerListPublic],
    ["followingListPublic", "Following list", "Who you follow", followingListPublic],
  ] as const;

  return (
    <form className="form-stack" onSubmit={onSubmit}>
      <label className="field">
        <span className="label">Name</span>
        <input className="input" name="displayName" defaultValue={displayName} required maxLength={60} />
      </label>
      <label className="field">
        <span className="label">Bio</span>
        <textarea className="textarea" name="bio" defaultValue={bio} maxLength={300} />
      </label>
      {toggles.map(([name, title, help, on]) => (
        <label key={name} className="toggle-row">
          <span>
            {title}
            <span>{help}</span>
          </span>
          <input type="checkbox" name={name} defaultChecked={on} />
        </label>
      ))}
      {error ? <div className="error">{error}</div> : null}
      {saved ? <p className="help">Saved.</p> : null}
      <button className="btn btn-primary" type="submit">
        Save
      </button>
    </form>
  );
}
