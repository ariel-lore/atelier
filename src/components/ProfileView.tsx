import Link from "next/link";
import type { ProfileDTO, Viewer } from "@/lib/types";
import { Avatar } from "./Avatar";
import { LockIcon } from "./Icons";
import { FollowButton } from "./FollowButton";
import { MessageButton } from "./MessageButton";

function Bio({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <p className="bio">
      {lines.map((line, i) => (
        <span key={i}>
          {i > 0 && <br />}
          {line.split(/(Meridian)/g).map((part, j) =>
            part === "Meridian" ? (
              <span key={j} className="bio-link">
                Meridian
              </span>
            ) : (
              <span key={j}>{part}</span>
            ),
          )}
        </span>
      ))}
    </p>
  );
}

function Stat({
  value,
  label,
  href,
  locked,
}: {
  value: number | null;
  label: string;
  href?: string;
  locked?: boolean;
}) {
  const inner = (
    <>
      <span className="stat-value-row">
        {value !== null ? <span className="stat-value">{value}</span> : null}
        {locked ? (
          <span className="privacy-chip" title="Private">
            <LockIcon size={10} />
          </span>
        ) : null}
      </span>
      <span className="stat-label">{label}</span>
    </>
  );
  if (href) {
    return (
      <Link href={href} className="stat stat-btn">
        {inner}
      </Link>
    );
  }
  return <div className={`stat${locked ? " stat-private" : ""}`}>{inner}</div>;
}

export function ProfileView({ profile, viewer }: { profile: ProfileDTO; viewer: Viewer | null }) {
  const followersHref = `/u/${profile.handle}/followers`;
  const followingHref = `/u/${profile.handle}/following`;

  return (
    <section className="view" aria-label="Profile">
      <div className="profile-header">
        <Avatar src={profile.avatarUrl} name={profile.displayName} />
        <div className="profile-meta">
          <h1 className="display-name">{profile.displayName}</h1>
          <p className="handle">@{profile.handle}</p>
          {profile.bio ? <Bio text={profile.bio} /> : null}
        </div>
      </div>

      <div className="stats" role="group" aria-label="Profile statistics">
        <div className="stat">
          <span className="stat-value">{profile.counts.posts}</span>
          <span className="stat-label">posts</span>
        </div>
        <Stat
          value={profile.counts.followers}
          label="followers"
          href={profile.counts.followers !== null ? followersHref : undefined}
          locked={!profile.lists.followersPublic && profile.counts.followers === null}
        />
        <Stat
          value={profile.counts.following}
          label="following"
          href={profile.counts.following !== null ? followingHref : undefined}
          locked={!profile.lists.followingPublic}
        />
      </div>

      <div className="profile-actions">
        {profile.isSelf ? (
          <>
            <Link href="/settings" className="btn btn-secondary">
              Edit profile
            </Link>
            <Link href={viewer?.role === "OWNER" ? "/circles" : "/verify"} className="btn btn-ghost">
              {viewer?.role === "OWNER" ? "Privacy" : "Verify"}
            </Link>
          </>
        ) : (
          <>
            {viewer ? (
              <FollowButton userId={profile.id} following={profile.followedByViewer} />
            ) : (
              <Link href="/login" className="btn btn-secondary">
                Sign in
              </Link>
            )}
            <MessageButton
              userId={profile.id}
              instagramHandle={profile.instagramHandle}
              canMessage={Boolean(viewer?.instagramVerified && profile.instagramVerified && !profile.isSelf)}
              signedIn={Boolean(viewer)}
            />
          </>
        )}
      </div>

      {profile.stories.length > 0 && (
        <div className="stories-row" aria-label="Stories">
          {profile.stories.map((story) => (
            <Link key={story.id} href={`/stories/${story.id}`} className="story-ring" aria-label={`View story: ${story.label}`}>
              <span className="story-ring-inner">
                <img src={story.mediaUrl} alt="" width="64" height="64" />
              </span>
              <span className="story-label">{story.label}</span>
            </Link>
          ))}
        </div>
      )}

      {profile.posts.length === 0 ? (
        <div className="empty">
          <h2>No posts yet</h2>
          <p>Nothing here you can see.</p>
        </div>
      ) : (
        <div className="grid" role="list" aria-label="Posts">
          {profile.posts.map((post) => (
            <Link
              key={post.id}
              href={`/post/${post.id}`}
              className="grid-item"
              role="listitem"
              aria-label={post.caption.slice(0, 80) || "Post"}
            >
              <img src={post.mediaUrl} alt="" />
              {post.audience !== "PUBLIC" && (
                <span className="grid-badge" title={post.circleNames.join(", ") || "Private"}>
                  <LockIcon size={11} />
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
