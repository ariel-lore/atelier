"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { CircleDTO, PersonDTO } from "@/lib/types";

export function CirclesAdmin({
  circles,
  verified,
}: {
  circles: CircleDTO[];
  verified: PersonDTO[];
}) {
  const router = useRouter();
  const [error, setError] = useState("");

  async function create(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/circles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        description: form.get("description"),
        color: form.get("color"),
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || "Could not create circle");
      return;
    }
    e.currentTarget.reset();
    router.refresh();
  }

  async function removeCircle(id: string) {
    if (!confirm("Delete this circle? Posts shared only with it stay private to you.")) return;
    const res = await fetch(`/api/circles/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Could not delete");
      return;
    }
    router.refresh();
  }

  async function addMember(circleId: string, userId: string) {
    setError("");
    const res = await fetch(`/api/circles/${circleId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || "Could not add");
      return;
    }
    router.refresh();
  }

  async function removeMember(circleId: string, userId: string) {
    const res = await fetch(`/api/circles/${circleId}/members`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    if (res.ok) router.refresh();
  }

  return (
    <div>
      <form className="form-stack page-pad" onSubmit={create}>
        <h2 className="page-title">Circles</h2>
        <p className="lede">Name a group, then add people who have verified their Instagram.</p>
        <label className="field">
          <span className="label">Name</span>
          <input className="input" name="name" placeholder="Family" required maxLength={40} />
        </label>
        <label className="field">
          <span className="label">Description</span>
          <input className="input" name="description" placeholder="Home and life" maxLength={160} />
        </label>
        <label className="field">
          <span className="label">Color</span>
          <input className="input" name="color" type="color" defaultValue="#a78bfa" />
        </label>
        {error ? <div className="error">{error}</div> : null}
        <button className="btn btn-primary" type="submit">
          Create circle
        </button>
      </form>

      {circles.map((circle) => (
        <section key={circle.id} className="circle-card">
          <div className="circle-head">
            <span className="circle-dot" style={{ ["--c" as string]: circle.color, width: 14, height: 14 }} />
            <div style={{ flex: 1 }}>
              <strong>{circle.name}</strong>
              {circle.description ? <div className="person-sub">{circle.description}</div> : null}
            </div>
            <button type="button" className="btn btn-ghost" onClick={() => removeCircle(circle.id)}>
              Delete
            </button>
          </div>
          <div>
            {circle.members.map((member) => (
              <span key={member.id} className="member-chip">
                @{member.handle}
                <button type="button" aria-label={`Remove ${member.displayName}`} onClick={() => removeMember(circle.id, member.id)}>
                  ×
                </button>
              </span>
            ))}
            {circle.members.length === 0 && <p className="help">No one in this circle yet.</p>}
          </div>
          <form
            className="row-actions"
            onSubmit={(e) => {
              e.preventDefault();
              const userId = String(new FormData(e.currentTarget).get("userId") || "");
              if (userId) addMember(circle.id, userId);
            }}
          >
            <select className="select" name="userId" defaultValue="" aria-label={`Add someone to ${circle.name}`}>
              <option value="" disabled>
                Add a verified person
              </option>
              {verified
                .filter((p) => !circle.members.some((m) => m.id === p.id))
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.displayName} (@{p.handle})
                  </option>
                ))}
            </select>
            <button className="btn btn-secondary" type="submit">
              Add
            </button>
          </form>
        </section>
      ))}
    </div>
  );
}
