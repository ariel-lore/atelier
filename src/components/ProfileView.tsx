import Link from "next/link";
import type { ProfileDTO, Viewer } from "@/lib/types";
import { formatCount } from "@/lib/utils";
import { Avatar } from "./Avatar";
import { CarouselIcon, GridIcon, LockIcon } from "./Icons";
import { FollowButton } from "./FollowButton";
import { MessageButton } from "./MessageButton";
import { ShareProfileButton } from "./ShareProfileButton";

function Bio({ text }: { text: string }) {
  return (
    <div className="bio">
      {text.split("\n").map((line, i) => {
        const link = /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(line.trim());
        return (
          <span key={i} className={link ? "bio-link" : undefined}>
            {i > 0 && <br />}
            {link
              ? line
              : line.split(/(Meridian)/g).map((part, j) =>
                  part === "Meridian" ? (
                    <span key={j} className="bio-link">
                      Meridian
                    </span>
                  ) : (
                    <span key={j}>{part}</span>
                  ),
                )}
          </span>
        );
      })}
    </div>
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
        {value !== null ? <span className="stat-value">{formatCount(value)}</span> : null}
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
  return <div className="stat">{inner}</div>;
}

export function ProfileView({ profile, viewer }: { profile: ProfileDTO; viewer: Viewer | null }) {
  const followersHref = `/u/${profile.handle}/followers`;
  const followingHref = `/u/${profile.handle}/following`;
  const firstStory = profile.stories[0];

  const avatar = <Avatar src={profile.avatarUrl} name={profile.displayName} />;

  return (
    <section className="view" aria-label="Profile">
      <div className="profile-top">
        {firstStory ? (
          <Link href={`/stories/${firstStory.id}`} className="avatar-ring" aria-label={`View story: ${firstStory.label}`}>
            {avatar}
          </Link>
        ) : (
          <div className="avatar-ring avatar-ring-plain">{avatar}</div>
        )}
        <div className="stats" role="group" aria-label="Profile statistics">
          <div className="stat">
            <span className="stat-value">{formatCount(profile.counts.posts)}</span>
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
      </div>

      <div className="profile-about">
        <h1 className="display-name">{profile.displayName}</h1>
        {profile.bio ? <Bio text={profile.bio} /> : null}
      </div>

      <div className="profile-actions">
        {profile.isSelf ? (
          <>
            <Link href="/settings" className="btn btn-secondary">
              Edit profile
            </Link>
            <ShareProfileButton path={`/u/${profile.handle}`} />
          </>
        ) : (
          <>
            {viewer ? (
              <FollowButton userId={profile.id} following={profile.followedByViewer} />
            ) : (
              <Link href="/login" className="btn btn-follow">
                Follow
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

      {profile.highlights.length > 0 && (
        <div className="stories-row highlights" aria-label="Highlights">
          {profile.highlights.map((item) => (
            <div key={item.id} className="story-ring highlight-ring">
              <span className="story-ring-inner">
                <img src={item.mediaUrl} alt="" width="64" height="64" />
              </span>
              <span className="story-label">{item.label}</span>
            </div>
          ))}
        </div>
      )}

      <div className="profile-tabs" aria-hidden="true">
        <span className="tab-on">
          <GridIcon />
        </span>
      </div>

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
              {post.images.length > 1 && (
                <span className="grid-carousel">
                  <CarouselIcon />
                </span>
              )}
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
