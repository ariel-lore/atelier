export type Role = "OWNER" | "MEMBER";
export type Audience = "PUBLIC" | "CIRCLES" | "PRIVATE";

export type Viewer = {
  id: string;
  email: string;
  displayName: string;
  handle: string;
  role: Role;
  instagramHandle: string | null;
  instagramVerified: boolean;
  circleIds: string[];
  avatarUrl: string | null;
};

export type PostDTO = {
  id: string;
  caption: string;
  audience: Audience;
  circleNames: string[];
  mediaUrl: string;
  createdAt: string;
  likeCount: number;
  likedByMe: boolean;
  author: {
    id: string;
    displayName: string;
    handle: string;
    avatarUrl: string | null;
  };
};

export type StoryDTO = {
  id: string;
  label: string;
  caption: string;
  audience: Audience;
  circleNames: string[];
  mediaUrl: string;
  createdAt: string;
  expiresAt: string;
  author: {
    displayName: string;
    handle: string;
    avatarUrl: string | null;
  };
};

export type ProfileDTO = {
  id: string;
  displayName: string;
  handle: string;
  bio: string;
  avatarUrl: string | null;
  instagramHandle: string | null;
  instagramVerified: boolean;
  isSelf: boolean;
  counts: {
    posts: number;
    followers: number | null;
    following: number | null;
  };
  /** Raw profile settings. Names are never included unless a list endpoint allows them. */
  lists: {
    followersPublic: boolean;
    followingPublic: boolean;
  };
  posts: PostDTO[];
  stories: StoryDTO[];
  followedByViewer: boolean;
};

export type PersonDTO = {
  id: string;
  displayName: string;
  handle: string;
  avatarUrl: string | null;
  instagramHandle: string | null;
  instagramVerified: boolean;
  /** Verified Atelier members can open an in-app thread. */
  canMessage: boolean;
};

export type ThreadSummary = {
  id: string;
  other: PersonDTO;
  preview: string;
  time: string;
  unread: boolean;
};

export type ChatMessage = {
  id: string;
  body: string;
  mine: boolean;
  createdAt: string;
};

export type CircleDTO = {
  id: string;
  name: string;
  description: string;
  color: string;
  members: PersonDTO[];
};
