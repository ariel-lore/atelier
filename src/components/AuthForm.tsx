"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AuthForm({ mode, nextPath }: { mode: "login" | "signup"; nextPath: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const payload: Record<string, string> = {
      email: String(form.get("email") || ""),
      password: String(form.get("password") || ""),
    };
    if (mode === "signup") {
      payload.displayName = String(form.get("displayName") || "");
      payload.handle = String(form.get("handle") || "");
    }
    const res = await fetch(mode === "login" ? "/api/auth/login" : "/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Something went wrong");
      return;
    }
    router.push(mode === "signup" ? "/verify" : nextPath);
    router.refresh();
  }

  return (
    <form className="form-stack" onSubmit={onSubmit}>
      {mode === "signup" && (
        <>
          <label className="field">
            <span className="label">Name</span>
            <input className="input" name="displayName" required maxLength={60} />
          </label>
          <label className="field">
            <span className="label">Handle</span>
            <input className="input" name="handle" required placeholder="alex" maxLength={20} />
          </label>
        </>
      )}
      <label className="field">
        <span className="label">Email</span>
        <input className="input" name="email" type="email" required autoComplete="email" />
      </label>
      <label className="field">
        <span className="label">Password</span>
        <input className="input" name="password" type="password" required minLength={8} autoComplete={mode === "login" ? "current-password" : "new-password"} />
      </label>
      {error ? <div className="error">{error}</div> : null}
      <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
        {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
      </button>
    </form>
  );
}
