"use client";

import { useState } from "react";
import type { ChatMessage } from "@/lib/types";

export function ChatView({ threadId, initial }: { threadId: string; initial: ChatMessage[] }) {
  const [messages, setMessages] = useState(initial);
  const [body, setBody] = useState("");
  const [error, setError] = useState("");

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = body.trim();
    if (!text) return;
    setError("");
    const res = await fetch(`/api/messages/${threadId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: text }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || "Could not send");
      return;
    }
    setMessages((m) => [...m, data.message]);
    setBody("");
  }

  return (
    <div className="chat-page">
      <div className="chat-body">
        {messages.map((m) => (
          <div key={m.id} className={`bubble ${m.mine ? "bubble-me" : "bubble-them"}`}>
            {m.body}
          </div>
        ))}
        {messages.length === 0 && <p className="help">Say hello.</p>}
      </div>
      <form className="chat-compose" onSubmit={send}>
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Message…"
          maxLength={2000}
          aria-label="Message"
        />
        <button className="btn btn-primary btn-sm" type="submit">
          Send
        </button>
      </form>
      {error ? <div className="error" style={{ margin: "0 12px 8px" }}>{error}</div> : null}
    </div>
  );
}
