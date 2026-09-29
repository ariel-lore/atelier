import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { canSeePrivateProfileField, canView, storyIsLive } from "./privacy";
import type { Audience, CircleDTO, PersonDTO, PostDTO, ProfileDTO, StoryDTO, ThreadSummary, Viewer } from "./types";
import { asAudience } from "./privacy";
import { avatarUrlFor, timeAgo } from "./utils";

const postInclude = {
  author: true,
  circles: { include: { circle: true } },
  likes: true,
  images: { orderBy: { position: "asc" as const } },
} satisfies Prisma.PostInclude;

const storyInclude = {
  author: true,
  circles: { include: { circle: true } },
  frames: { orderBy: { position: "asc" as const } },
} satisfies Prisma.StoryInclude;

type PostRow = Prisma.PostGetPayload<{ include: typeof postInclude }>;
type StoryRow = Prisma.StoryGetPayload<{ include: typeof storyInclude }>;

export function postVisibilityWhere(viewer: Viewer | null): Prisma.PostWhereInput {
  if (viewer?.role === "OWNER") return {};
  const OR: Prisma.PostWhereInput[] = [{ audience: "PUBLIC" }];
  if (viewer) {
    OR.push({ authorId: viewer.id });
    if (viewer.circleIds.length > 0) {
      OR.push({
        audience: "CIRCLES",
        circles: { some: { circleId: { in: viewer.circleIds } } },
      });
    }
  }
  return { OR };
}

export function storyVisibilityWhere(viewer: Viewer | null, now = new Date()): Prisma.StoryWhereInput {
  const audience = postVisibilityWhere(viewer) as Prisma.StoryWhereInput;
  return { AND: [{ expiresAt: { gt: now } }, audience] };
}

function visibleCircleNames(
  circles: { circleId: string; circle: { name: string } }[],
  viewer: Viewer | null,
  authorId: string,
) {
  if (viewer?.role === "OWNER" || viewer?.id === authorId) {
    return circles.map((c) => c.circle.name);
  }
  return circles.filter((c) => viewer?.circleIds.includes(c.circleId)).map((c) => c.circle.name);
}

function postImages(post: { id: string; images: { id: string }[] }) {
  if (post.images.length === 0) {
    return [{ id: "cover", mediaUrl: `/api/media/posts/${post.id}` }];
  }
  return post.images.map((image) => ({
    id: image.id,
    mediaUrl: `/api/media/posts/${post.id}/images/${image.id}`,
  }));
}

function storyFrames(story: { id: string; frames: { id: string }[] }) {
  if (story.frames.length === 0) {
    return [{ id: "cover", mediaUrl: `/api/media/stories/${story.id}` }];
  }
  return story.frames.map((frame) => ({
    id: frame.id,
    mediaUrl: `/api/media/stories/${story.id}/frames/${frame.id}`,
  }));
}

function personFromUser(user: {
  id: string;
  displayName: string;
  handle: string;
  avatarPath: string | null;
  instagramHandle: string | null;
  instagramVerified: boolean;
}, viewer: Viewer | null): PersonDTO {
  const canMessage = Boolean(
    viewer &&
      viewer.instagramVerified &&
      user.instagramVerified &&
      viewer.id !== user.id,
  );
  return {
    id: user.id,
    displayName: user.displayName,
    handle: user.handle,
    avatarUrl: avatarUrlFor(user.id, user.avatarPath),
    instagramHandle: user.instagramHandle,
    instagramVerified: user.instagramVerified,
    canMessage,
  };
}

export function serializePost(post: PostRow, viewer: Viewer | null): PostDTO | null {
  const circleIds = post.circles.map((c) => c.circleId);
  if (!canView(viewer, { authorId: post.authorId, audience: post.audience, circleIds })) {
    return null;
  }
  return {
    id: post.id,
    caption: post.caption,
    audience: asAudience(post.audience),
    circleNames: visibleCircleNames(post.circles, viewer, post.authorId),
    circleIds: viewer?.role === "OWNER" ? post.circles.map((c) => c.circleId) : [],
    mediaUrl: postImages(post)[0].mediaUrl,
    images: postImages(post),
    createdAt: post.createdAt.toISOString(),
    likeCount: post.likeCount,
    likedByMe: viewer ? post.likes.some((l) => l.userId === viewer.id) : false,
    author: {
      id: post.author.id,
      displayName: post.author.displayName,
      handle: post.author.handle,
      avatarUrl: avatarUrlFor(post.author.id, post.author.avatarPath),
    },
  };
}

export function serializeStory(story: StoryRow, viewer: Viewer | null, now = new Date()): StoryDTO | null {
  if (!storyIsLive(story.expiresAt, now)) return null;
  const circleIds = story.circles.map((c) => c.circleId);
  if (!canView(viewer, { authorId: story.authorId, audience: story.audience, circleIds })) {
    return null;
  }
  return {
    id: story.id,
    label: story.label,
    caption: story.caption,
    audience: asAudience(story.audience),
    circleNames: visibleCircleNames(story.circles, viewer, story.authorId),
    mediaUrl: storyFrames(story)[0].mediaUrl,
    frames: storyFrames(story),
    createdAt: story.createdAt.toISOString(),
    expiresAt: story.expiresAt.toISOString(),
    author: {
      displayName: story.author.displayName,
      handle: story.author.handle,
      avatarUrl: avatarUrlFor(story.author.id, story.author.avatarPath),
    },
  };
}

export async function getOwnerUser() {
  return prisma.user.findFirst({ where: { role: "OWNER" }, orderBy: { createdAt: "asc" } });
}

export async function listPosts(viewer: Viewer | null) {
  const rows = await prisma.post.findMany({
    where: postVisibilityWhere(viewer),
    include: postInclude,
    orderBy: { createdAt: "desc" },
  });
  return rows.map((row) => serializePost(row, viewer)).filter((p): p is PostDTO => p !== null);
}

export async function getPost(id: string, viewer: Viewer | null) {
  const row = await prisma.post.findUnique({ where: { id }, include: postInclude });
  if (!row) return null;
  return serializePost(row, viewer);
}

export async function listStories(viewer: Viewer | null) {
  const now = new Date();
  const rows = await prisma.story.findMany({
    where: storyVisibilityWhere(viewer, now),
    include: storyInclude,
    orderBy: { createdAt: "asc" },
  });
  return rows.map((row) => serializeStory(row, viewer, now)).filter((s): s is StoryDTO => s !== null);
}

export async function getStory(id: string, viewer: Viewer | null) {
  const row = await prisma.story.findUnique({ where: { id }, include: storyInclude });
  if (!row) return null;
  return serializeStory(row, viewer);
}

async function countPair(userId: string) {
  const [followers, following] = await Promise.all([
    prisma.follow.count({ where: { followingId: userId } }),
    prisma.follow.count({ where: { followerId: userId } }),
  ]);
  return { followers, following };
}

export async function getOwnerProfile(viewer: Viewer | null): Promise<ProfileDTO | null> {
  const owner = await getOwnerUser();
  if (!owner) return null;
  return getProfileByHandle(owner.handle, viewer);
}

export async function getProfileByHandle(handle: string, viewer: Viewer | null): Promise<ProfileDTO | null> {
  const user = await prisma.user.findUnique({ where: { handle } });
  if (!user) return null;
  const [counts, posts, stories, highlights, followedByViewer] = await Promise.all([
    countPair(user.id),
    prisma.post.findMany({
      where: { AND: [{ authorId: user.id }, postVisibilityWhere(viewer)] },
      include: postInclude,
      orderBy: { createdAt: "desc" },
    }),
    prisma.story.findMany({
      where: { AND: [{ authorId: user.id }, storyVisibilityWhere(viewer)] },
      include: storyInclude,
      orderBy: { createdAt: "asc" },
    }),
    prisma.highlight.findMany({
      where: { authorId: user.id },
      orderBy: { position: "asc" },
    }),
    viewer
      ? prisma.follow.findUnique({
          where: { followerId_followingId: { followerId: viewer.id, followingId: user.id } },
        })
      : Promise.resolve(null),
  ]);

  const seeFollowers = canSeePrivateProfileField(viewer, user.id, user.followerCountPublic);
  const seeFollowing = canSeePrivateProfileField(viewer, user.id, user.followingCountPublic);

  return {
    id: user.id,
    displayName: user.displayName,
    handle: user.handle,
    bio: user.bio,
    avatarUrl: avatarUrlFor(user.id, user.avatarPath),
    instagramHandle: user.instagramHandle,
    instagramVerified: user.instagramVerified,
    isSelf: viewer?.id === user.id,
    counts: {
      posts: posts.length,
      followers: seeFollowers ? counts.followers : null,
      following: seeFollowing ? counts.following : null,
    },
    lists: {
      followersPublic: user.followerListPublic,
      followingPublic: user.followingListPublic,
    },
    posts: posts.map((p) => serializePost(p, viewer)).filter((p): p is PostDTO => p !== null),
    stories: stories.map((s) => serializeStory(s, viewer)).filter((s): s is StoryDTO => s !== null),
    highlights: highlights.map((item) => ({
      id: item.id,
      label: item.label,
      mediaUrl: `/api/media/highlights/${item.id}`,
    })),
    followedByViewer: Boolean(followedByViewer),
  };
}

export async function listFollows(userId: string, kind: "followers" | "following", viewer: Viewer | null) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { allowed: false as const, missing: true as const, people: [] as PersonDTO[] };
  const isPublic = kind === "followers" ? user.followerListPublic : user.followingListPublic;
  if (!canSeePrivateProfileField(viewer, user.id, isPublic)) {
    return { allowed: false as const, missing: false as const, people: [] as PersonDTO[] };
  }
  if (kind === "followers") {
    const rows = await prisma.follow.findMany({
      where: { followingId: userId },
      include: { follower: true },
      orderBy: { createdAt: "desc" },
    });
    return { allowed: true as const, missing: false as const, people: rows.map((r) => personFromUser(r.follower, viewer)) };
  }
  const rows = await prisma.follow.findMany({
    where: { followerId: userId },
    include: { following: true },
    orderBy: { createdAt: "desc" },
  });
  return { allowed: true as const, missing: false as const, people: rows.map((r) => personFromUser(r.following, viewer)) };
}

export async function searchPeople(q: string, viewer: Viewer | null): Promise<PersonDTO[]> {
  const query = q.trim().toLowerCase();
  if (!query) return [];
  const users = await prisma.user.findMany({ orderBy: { displayName: "asc" } });
  return users
    .filter((user) => {
      const haystack = `${user.handle} ${user.displayName} ${user.instagramHandle ?? ""}`.toLowerCase();
      return haystack.includes(query);
    })
    .slice(0, 20)
    .map((user) => personFromUser(user, viewer));
}

export async function listCircles(ownerId: string, viewer: Viewer | null): Promise<CircleDTO[]> {
  const circles = await prisma.circle.findMany({
    where: { ownerId },
    include: { members: { include: { user: true } } },
    orderBy: { createdAt: "asc" },
  });
  return circles.map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    color: c.color,
    members: c.members.map((m) => personFromUser(m.user, viewer)),
  }));
}

export function toPerson(user: {
  id: string;
  displayName: string;
  handle: string;
  avatarPath: string | null;
  instagramHandle: string | null;
  instagramVerified: boolean;
}, viewer: Viewer | null) {
  return personFromUser(user, viewer);
}

export async function listThreads(viewer: Viewer): Promise<ThreadSummary[]> {
  const parts = await prisma.threadParticipant.findMany({
    where: { userId: viewer.id },
    include: {
      thread: {
        include: {
          messages: { orderBy: { createdAt: "desc" }, take: 1 },
          participants: { include: { user: true } },
        },
      },
    },
  });
  const summaries: ThreadSummary[] = parts.map((part) => {
    const otherPart = part.thread.participants.find((p) => p.userId !== viewer.id);
    const last = part.thread.messages[0];
    const unread = Boolean(
      last &&
        last.senderId !== viewer.id &&
        (!part.lastReadAt || last.createdAt.getTime() > part.lastReadAt.getTime()),
    );
    return {
      id: part.threadId,
      other: otherPart
        ? personFromUser(otherPart.user, viewer)
        : {
            id: "",
            displayName: "Conversation",
            handle: "",
            avatarUrl: null,
            instagramHandle: null,
            instagramVerified: false,
            canMessage: false,
          },
      preview: last?.body ?? "No messages yet",
      time: last ? timeAgo(last.createdAt) : timeAgo(part.thread.createdAt),
      unread,
      sort: last?.createdAt.getTime() ?? part.thread.updatedAt.getTime(),
    };
  }).sort((a, b) => b.sort - a.sort)
    .map(({ sort: _sort, ...rest }) => rest);
  return summaries;
}

export async function getThreadMessages(threadId: string, viewer: Viewer) {
  const part = await prisma.threadParticipant.findUnique({
    where: { threadId_userId: { threadId, userId: viewer.id } },
    include: {
      thread: {
        include: {
          participants: { include: { user: true } },
          messages: { orderBy: { createdAt: "asc" } },
        },
      },
    },
  });
  if (!part) return null;
  await prisma.threadParticipant.update({
    where: { id: part.id },
    data: { lastReadAt: new Date() },
  });
  const other = part.thread.participants.find((p) => p.userId !== viewer.id);
  return {
    id: threadId,
    other: other ? personFromUser(other.user, viewer) : null,
    messages: part.thread.messages.map((m) => ({
      id: m.id,
      body: m.body,
      mine: m.senderId === viewer.id,
      createdAt: m.createdAt.toISOString(),
    })),
  };
}

export async function findOrCreateThread(viewerId: string, otherId: string) {
  const existing = await prisma.thread.findFirst({
    where: {
      AND: [
        { participants: { some: { userId: viewerId } } },
        { participants: { some: { userId: otherId } } },
      ],
    },
    include: { participants: true },
  });
  if (existing && existing.participants.length === 2) return existing;
  return prisma.thread.create({
    data: {
      participants: {
        create: [{ userId: viewerId }, { userId: otherId }],
      },
    },
  });
}

export function audienceLabel(audience: Audience, circleNames: string[]) {
  if (audience === "PUBLIC") return "Public";
  if (audience === "PRIVATE") return "Only me";
  if (circleNames.length === 0) return "Circles";
  return circleNames.join(", ");
}
