import Link from "next/link";
import { notFound } from "next/navigation";
import { EditPostForm } from "@/components/EditPostForm";
import { BackIcon } from "@/components/Icons";
import { getViewer } from "@/lib/auth";
import { getPost, listCircles } from "@/lib/queries";

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const viewer = await getViewer();
  if (!viewer || viewer.role !== "OWNER") notFound();
  const post = await getPost(id, viewer);
  if (!post || post.author.id !== viewer.id) notFound();
  const circles = await listCircles(viewer.id, viewer);
  return (
    <section className="view page-pad">
      <div className="back-row" style={{ margin: "-4px -8px 12px", borderBottom: 0 }}>
        <Link href={`/post/${id}`} aria-label="Back to post">
          <BackIcon />
        </Link>
        <span>Edit post</span>
      </div>
      <EditPostForm post={post} circles={circles} />
    </section>
  );
}
