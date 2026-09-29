import Link from "next/link";
import { notFound } from "next/navigation";
import { PostChrome } from "@/components/PostChrome";
import { BackIcon } from "@/components/Icons";
import { getViewer } from "@/lib/auth";
import { getPost } from "@/lib/queries";

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const viewer = await getViewer();
  const post = await getPost(id, viewer);
  if (!post) notFound();
  const manage = viewer?.role === "OWNER" && viewer.id === post.author.id;
  return (
    <div className="view">
      <div className="back-row">
        <Link href="/" aria-label="Back">
          <BackIcon />
        </Link>
        <span>Posts</span>
      </div>
      <PostChrome post={post} manage={manage} />
    </div>
  );
}
