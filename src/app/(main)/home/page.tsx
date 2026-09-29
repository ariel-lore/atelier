import Link from "next/link";
import { getViewer } from "@/lib/auth";
import { audienceLabel, listPosts } from "@/lib/queries";
import { timeAgo } from "@/lib/utils";
import { LockIcon } from "@/components/Icons";

export default async function HomePage() {
  const viewer = await getViewer();
  const posts = await listPosts(viewer);
  return (
    <section className="view" aria-label="Home">
      {posts.length === 0 ? (
        <div className="empty">
          <h2>Quiet for now</h2>
          <p>Posts you are allowed to see will show up here.</p>
        </div>
      ) : (
        posts.map((post) => (
          <article key={post.id} className="feed-card">
            <Link href={`/post/${post.id}`} className="feed-media">
              <img src={post.mediaUrl} alt="" />
              {post.images.length > 1 ? <span className="feed-count">{post.images.length} photos</span> : null}
            </Link>
            <div className="feed-caption">
              <Link href={`/u/${post.author.handle}`} className="feed-author">
                {post.author.displayName}
              </Link>
              {post.caption ? <p className="feed-text">{post.caption}</p> : null}
              <div className="feed-meta">
                {timeAgo(post.createdAt)}
                {post.audience !== "PUBLIC" ? (
                  <span className="post-privacy">
                    <LockIcon size={11} /> {audienceLabel(post.audience, post.circleNames)}
                  </span>
                ) : null}
              </div>
            </div>
          </article>
        ))
      )}
    </section>
  );
}
