import Link from "next/link";
import { PostChrome } from "@/components/PostChrome";
import { getViewer } from "@/lib/auth";
import { listPosts, listStories } from "@/lib/queries";

export default async function HomePage() {
  const viewer = await getViewer();
  const [posts, stories] = await Promise.all([listPosts(viewer), listStories(viewer)]);
  return (
    <section className="view" aria-label="Home">
      {stories.length > 0 && (
        <div className="stories-row stories-tray" aria-label="Stories">
          {stories.map((story) => (
            <Link key={story.id} href={`/stories/${story.id}`} className="story-ring" aria-label={`View story: ${story.label}`}>
              <span className="story-ring-inner">
                <img src={story.mediaUrl} alt="" width="64" height="64" />
              </span>
              <span className="story-label">{story.label}</span>
            </Link>
          ))}
        </div>
      )}
      {posts.length === 0 ? (
        <div className="empty">
          <h2>Quiet for now</h2>
          <p>Posts you are allowed to see will show up here.</p>
        </div>
      ) : (
        posts.map((post) => <PostChrome key={post.id} post={post} />)
      )}
    </section>
  );
}
