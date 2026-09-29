"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function MessageButton({
  userId,
  instagramHandle,
  canMessage,
  signedIn,
}: {
  userId: string;
  instagramHandle: string | null;
  canMessage: boolean;
  signedIn: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState("");

  if (!signedIn) {
    return (
      <a className="btn btn-ghost" href="/login">
        Message
      </a>
    );
  }

  if (canMessage) {
    return (
      <button
        type="button"
        className="btn btn-ghost"
        onClick={async () => {
          setError("");
          const res = await fetch("/api/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId }),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            setError(data.error || "Could not open messages");
            return;
          }
          router.push(`/messages/${data.threadId}`);
        }}
      >
        {error || "Message"}
      </button>
    );
  }

  if (instagramHandle) {
    return (
      <a className="btn btn-ghost" href={`https://instagram.com/${instagramHandle}`} target="_blank" rel="noreferrer">
        Instagram
      </a>
    );
  }

  return null;
}
