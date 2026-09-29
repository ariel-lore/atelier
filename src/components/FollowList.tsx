import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { BackIcon } from "@/components/Icons";
import { MessageButton } from "@/components/MessageButton";
import { getViewer } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { listFollows } from "@/lib/queries";

export async function FollowList({
  params,
  kind,
}: {
  params: Promise<{ handle: string }>;
  kind: "followers" | "following";
}) {
  const { handle } = await params;
  const viewer = await getViewer();
  const user = await prisma.user.findUnique({ where: { handle } });
  if (!user) notFound();
  const result = await listFollows(user.id, kind, viewer);
  if (result.missing) notFound();
  const title = kind === "followers" ? "Followers" : "Following";
  return (
    <section className="view">
      <div className="back-row">
        <Link href={handle === "bart" ? "/" : `/u/${handle}`} aria-label="Back">
          <BackIcon />
        </Link>
        <span>{title}</span>
      </div>
      {!result.allowed ? (
        <div className="empty">
          <h2>This list is private</h2>
          <p>{user.displayName} has not shared these names.</p>
        </div>
      ) : result.people.length === 0 ? (
        <div className="empty">
          <h2>No one yet</h2>
        </div>
      ) : (
        <ul className="people-list">
          {result.people.map((person) => (
            <li key={person.id}>
              <div className="person-row">
                <Link href={person.handle === "bart" ? "/" : `/u/${person.handle}`} className="person-row" style={{ padding: 0, border: 0, flex: 1 }}>
                  <Avatar src={person.avatarUrl} name={person.displayName} size="md" />
                  <span className="person-meta">
                    <span className="person-name">{person.displayName}</span>
                    <span className="person-sub">@{person.handle}</span>
                  </span>
                </Link>
                {person.id !== viewer?.id && (
                  <MessageButton
                    userId={person.id}
                    instagramHandle={person.instagramHandle}
                    canMessage={person.canMessage}
                    signedIn={Boolean(viewer)}
                  />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
