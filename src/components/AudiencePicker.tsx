"use client";

import type { CircleDTO } from "@/lib/types";

export function AudiencePicker({
  audience,
  circleIds,
  circles,
  onAudience,
  onToggleCircle,
}: {
  audience: "PUBLIC" | "CIRCLES" | "PRIVATE";
  circleIds: string[];
  circles: CircleDTO[];
  onAudience: (value: "PUBLIC" | "CIRCLES" | "PRIVATE") => void;
  onToggleCircle: (id: string) => void;
}) {
  return (
    <fieldset className="field" style={{ border: 0, padding: 0, margin: 0 }}>
      <legend className="label">Who can see this</legend>
      <div className="segmented" role="radiogroup" aria-label="Audience">
        {(
          [
            ["PUBLIC", "Public"],
            ["CIRCLES", "Circles"],
            ["PRIVATE", "Only me"],
          ] as const
        ).map(([value, label]) => (
          <label key={value}>
            <input type="radio" name="audience" checked={audience === value} onChange={() => onAudience(value)} />
            {label}
          </label>
        ))}
      </div>
      {audience === "CIRCLES" && (
        <div className="check-list" style={{ marginTop: 10 }}>
          {circles.length === 0 && <p className="help">Create a circle first.</p>}
          {circles.map((circle) => (
            <label key={circle.id}>
              <input type="checkbox" checked={circleIds.includes(circle.id)} onChange={() => onToggleCircle(circle.id)} />
              <span className="circle-dot" style={{ ["--c" as string]: circle.color }} />
              {circle.name}
            </label>
          ))}
        </div>
      )}
    </fieldset>
  );
}

export function audienceSummary(
  audience: "PUBLIC" | "CIRCLES" | "PRIVATE",
  circleIds: string[],
  circles: CircleDTO[],
) {
  if (audience === "PUBLIC") return "Public";
  if (audience === "PRIVATE") return "Only me";
  const names = circles.filter((circle) => circleIds.includes(circle.id)).map((circle) => circle.name);
  return names.length ? names.join(", ") : "Circles";
}
