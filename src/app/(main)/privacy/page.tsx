import Link from "next/link";
import { getViewer } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOwnerUser } from "@/lib/queries";

export default async function PrivacyPage() {
  const viewer = await getViewer();
  const owner = await getOwnerUser();
  const circles = owner
    ? await prisma.circle.findMany({
        where: { ownerId: owner.id },
        select: { id: true, name: true, description: true, color: true },
        orderBy: { createdAt: "asc" },
      })
    : [];
  const memberships =
    viewer && viewer.role !== "OWNER"
      ? await prisma.circleMember.findMany({
          where: { userId: viewer.id },
          select: { circleId: true },
        })
      : [];
  const visible =
    viewer?.role === "OWNER"
      ? circles
      : circles.filter((circle) => memberships.some((row) => row.circleId === circle.id));

  return (
    <section className="page-pad">
      <h2 className="page-title">Privacy</h2>
      <p className="lede">
        Public posts are on the grid for anyone who opens this site. A circle post is only sent to people in that circle. “Only me” stays with Bart. The server drops everything else — it is not hidden in the browser.
      </p>
      {viewer?.role === "OWNER" && (
        <ul className="circle-list">
          {circles.map((circle) => (
            <li key={circle.id} className="person-row">
              <span className="circle-dot" style={{ ["--c" as string]: circle.color }} />
              <span className="person-meta">
                <span className="person-name">{circle.name}</span>
                <span className="person-sub">{circle.description || "A private circle"}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
      {viewer && viewer.role !== "OWNER" && (
        <ul className="circle-list">
          {visible.length === 0 ? (
            <li className="help">You are not in a circle yet. Verify your Instagram and Bart can add you.</li>
          ) : (
            visible.map((circle) => (
              <li key={circle.id} className="person-row">
                <span className="circle-dot" style={{ ["--c" as string]: circle.color }} />
                <span className="person-meta">
                  <span className="person-name">{circle.name}</span>
                  <span className="person-sub">{circle.description || "A private circle"}</span>
                </span>
              </li>
            ))
          )}
        </ul>
      )}
      <div className="row-actions">
        {viewer?.role === "OWNER" ? (
          <Link href="/circles" className="btn btn-primary">
            Edit circles
          </Link>
        ) : (
          <Link href={viewer ? "/verify" : "/signup"} className="btn btn-primary">
            {viewer ? "Verify Instagram" : "Create an account"}
          </Link>
        )}
      </div>
    </section>
  );
}
