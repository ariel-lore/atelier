import Link from "next/link";
import { redirect } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { getViewer } from "@/lib/auth";
import { listThreads } from "@/lib/queries";

export default async function MessagesPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/login?next=/messages");
  if (!viewer.instagramVerified) {
    return (
      <div className="page-pad">
        <h2 className="page-title">Messages</h2>
        <p className="lede">Messages are for people who have verified an Instagram account on Atelier.</p>
        <Link href="/verify" className="btn btn-primary">
          Verify Instagram
        </Link>
      </div>
    );
  }
  const threads = await listThreads(viewer);
  return (
    <section className="view" aria-label="Messages">
      <div className="page-pad" style={{ paddingBottom: 8 }}>
        <h2 className="page-title">Messages</h2>
      </div>
      {threads.length === 0 ? (
        <div className="empty">
          <h2>No conversations</h2>
          <p>Open someone’s profile and tap Message.</p>
        </div>
      ) : (
        <ul className="inbox-list">
          {threads.map((thread) => (
            <li key={thread.id}>
              <Link href={`/messages/${thread.id}`} className="inbox-item" aria-label={`Chat with ${thread.other.displayName}`}>
                <Avatar src={thread.other.avatarUrl} name={thread.other.displayName} size="md" />
                <span className="inbox-meta">
                  <span className="inbox-name">
                    {thread.other.displayName}
                    {thread.unread ? <span className="unread-dot" aria-label="Unread" /> : null}
                  </span>
                  <span className="inbox-preview">{thread.preview}</span>
                </span>
                <span className="inbox-time">{thread.time}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
