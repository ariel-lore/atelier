import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChatView } from "@/components/ChatView";
import { BackIcon } from "@/components/Icons";
import { getViewer } from "@/lib/auth";
import { getThreadMessages } from "@/lib/queries";

export default async function ThreadPage({ params }: { params: Promise<{ threadId: string }> }) {
  const viewer = await getViewer();
  if (!viewer) redirect("/login?next=/messages");
  const { threadId } = await params;
  const thread = await getThreadMessages(threadId, viewer);
  if (!thread) notFound();
  return (
    <section className="view" aria-label="Conversation">
      <div className="back-row">
        <Link href="/messages" aria-label="Back to inbox">
          <BackIcon />
        </Link>
        <span>{thread.other?.displayName ?? "Chat"}</span>
      </div>
      <ChatView threadId={thread.id} initial={thread.messages} />
    </section>
  );
}
