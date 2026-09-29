import Link from "next/link";
import { notFound } from "next/navigation";
import { LikeButton } from "@/components/LikeButton";
import { PostGallery } from "@/components/PostGallery";
import { PostOwnerBar } from "@/components/PostOwnerBar";
import { BackIcon, LockIcon } from "@/components/Icons";
import { getViewer } from "@/lib/auth";
import { audienceLabel, getPost } from "@/lib/queries";
import { timeAgo } from "@/lib/utils";

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const viewer = await getViewer();
  const post = await getPost(id, viewer);
  if (!post) notFound();
  return (
    <article className="view">
      <div className="back-row">
        <Link href="/" aria-label="Back">
          <BackIcon />
        </Link>
        <span>Post</span>
      </div>
      <PostGallery images={post.images} alt={post.caption || "Post"} />
      {viewer?.role === "OWNER" && viewer.id === post.author.id ? <PostOwnerBar postId={post.id} /> : null}
      <LikeButton postId={post.id} liked={post.likedByMe} count={post.likeCount} />
      <div className="post-caption-block">
        <Link href={`/u/${post.author.handle}`} className="post-author">
          {post.author.displayName}
        </Link>
        {post.caption ? <p className="post-caption">{post.caption}</p> : null}
        {post.audience !== "PUBLIC" && (
          <div className="post-privacy">
            <LockIcon /> Shared with {audienceLabel(post.audience, post.circleNames)}
          </div>
        )}
        <div className="post-meta">{timeAgo(post.createdAt)}</div>
      </div>
    </article>
  );
}
