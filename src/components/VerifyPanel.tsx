"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Verification = {
  id: string;
  code: string;
  instagramHandle: string;
  contentUrl: string;
  status: string;
  note: string;
};

type QueueItem = Verification & {
  createdAt: string;
  user: { id: string; displayName: string; handle: string };
};

export function VerifyPanel({
  initial,
  verified,
  instagramHandle,
  queue,
  isOwner,
}: {
  initial: Verification | null;
  verified: boolean;
  instagramHandle: string | null;
  queue: QueueItem[];
  isOwner: boolean;
}) {
  const router = useRouter();
  const [row, setRow] = useState(initial);
  const [handle, setHandle] = useState(instagramHandle ?? "");
  const [url, setUrl] = useState(initial?.contentUrl ?? "");
  const [note, setNote] = useState(initial?.note ?? "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "generate", instagramHandle: handle }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Could not create a phrase");
      return;
    }
    setRow(data.verification);
    setNote("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "submit", contentUrl: url }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Could not submit");
      return;
    }
    setNote(data.note || "");
    if (data.status === "VERIFIED") router.refresh();
  }

  async function review(id: string, action: "verify" | "reject") {
    const res = await fetch(`/api/verify/${id}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (res.ok) router.refresh();
  }

  return (
    <div className="page-pad form-stack">
      <h2 className="page-title">Instagram</h2>
      {isOwner && (
        <>
          <h2 className="page-title" style={{ fontSize: 18 }}>
            To review
          </h2>
          {queue.length === 0 ? <p className="help">No one is waiting.</p> : null}
          <ul className="people-list">
            {queue.map((item) => (
              <li key={item.id} style={{ padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
                <strong>{item.user.displayName}</strong>
                <div className="person-sub">
                  @{item.user.handle} · Instagram @{item.instagramHandle}
                </div>
                <p className="code-block" style={{ fontSize: 16, marginTop: 8 }}>
                  {item.code}
                </p>
                {item.contentUrl ? (
                  <p className="help">
                    <a href={item.contentUrl} target="_blank" rel="noreferrer">
                      Open their link
                    </a>
                  </p>
                ) : (
                  <p className="help">No link submitted yet.</p>
                )}
                {item.note ? <p className="help">{item.note}</p> : null}
                <div className="row-actions">
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => review(item.id, "verify")}>
                    Mark verified
                  </button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => review(item.id, "reject")}>
                    Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <hr className="sep" />
        </>
      )}
      {verified ? (
        <p className="note">
          {isOwner
            ? `Your Instagram @${instagramHandle} is linked.`
            : `Verified as @${instagramHandle}. Bart can place you in a circle.`}
        </p>
      ) : (
        <>
          <p className="lede">
            Put a phrase Atelier gives you anywhere in something you share — bio, post, or story. Then paste the link.
          </p>
          <form className="form-stack" onSubmit={generate}>
            <label className="field">
              <span className="label">Instagram username</span>
              <input className="input" value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="your.name" required />
            </label>
            <button className="btn btn-secondary" type="submit" disabled={busy}>
              {row ? "Make a new phrase" : "Create my phrase"}
            </button>
          </form>
          {row && row.status === "PENDING" && (
            <>
              <p className="code-block">{row.code}</p>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={async () => {
                  await navigator.clipboard.writeText(row.code);
                  setCopied(true);
                }}
              >
                {copied ? "Copied" : "Copy phrase"}
              </button>
              <p className="help">
                Share it on Instagram as @{row.instagramHandle}, then paste the post, story, or profile link below. If Instagram blocks the automatic check, Bart can confirm it himself.
              </p>
              <form className="form-stack" onSubmit={submit}>
                <label className="field">
                  <span className="label">Instagram link</span>
                  <input className="input" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://www.instagram.com/p/…" required />
                </label>
                <button className="btn btn-primary" type="submit" disabled={busy}>
                  Check link
                </button>
              </form>
            </>
          )}
          {row && row.status === "REJECTED" && <div className="error">That phrase was not confirmed. Create a new one and try again.</div>}
          {note ? <p className="note">{note}</p> : null}
        </>
      )}
      {error ? <div className="error">{error}</div> : null}
    </div>
  );
}
