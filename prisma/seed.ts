import "./load-env";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { saveObject } from "../src/lib/storage";
import { gradientPng } from "./placeholder";

const prisma = new PrismaClient();

const hour = 60 * 60 * 1000;
const day = 24 * hour;

async function main() {
  const ownerEmail = process.env.OWNER_EMAIL || "bart@atelier.local";
  const ownerPassword = process.env.OWNER_PASSWORD || "bart-atelier";
  const ownerName = process.env.OWNER_NAME || "Bart Matero";
  const ownerHandle = (process.env.OWNER_HANDLE || "bart").replace(/^@/, "").toLowerCase();
  const memberPassword = process.env.MEMBER_PASSWORD || "member-atelier";

  await prisma.message.deleteMany();
  await prisma.threadParticipant.deleteMany();
  await prisma.thread.deleteMany();
  await prisma.like.deleteMany();
  await prisma.postCircle.deleteMany();
  await prisma.post.deleteMany();
  await prisma.storyCircle.deleteMany();
  await prisma.story.deleteMany();
  await prisma.circleMember.deleteMany();
  await prisma.circle.deleteMany();
  await prisma.verification.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();

  const ownerHash = await bcrypt.hash(ownerPassword, 10);
  const memberHash = await bcrypt.hash(memberPassword, 10);

  const avatar = async (folder: string, from: string, to: string) => {
    const key = `${folder}/${randomUUID()}.png`;
    await saveObject(key, gradientPng(96, 96, from, to));
    return key;
  };

  const bart = await prisma.user.create({
    data: {
      email: ownerEmail.toLowerCase(),
      passwordHash: ownerHash,
      displayName: ownerName,
      handle: ownerHandle,
      bio: "Building Meridian · design & systems\nVancouver · quiet feed",
      role: "OWNER",
      instagramHandle: "bartmatero",
      instagramVerified: true,
      followerCountPublic: true,
      followingCountPublic: true,
      followerListPublic: true,
      followingListPublic: false,
      avatarPath: await avatar("avatars", "#d9d3cc", "#8d8378"),
    },
  });

  const alex = await prisma.user.create({
    data: {
      email: "alex@atelier.local",
      passwordHash: memberHash,
      displayName: "Alex Chen",
      handle: "alex",
      bio: "Drops by the studio when the light is good.",
      role: "MEMBER",
      instagramHandle: "alex.chen",
      instagramVerified: true,
      avatarPath: await avatar("avatars", "#d5dde8", "#7f93ad"),
    },
  });

  const sam = await prisma.user.create({
    data: {
      email: "sam@atelier.local",
      passwordHash: memberHash,
      displayName: "Sam Rivera",
      handle: "sam",
      bio: "Quiet on purpose.",
      role: "MEMBER",
      instagramHandle: "sam.rivera",
      instagramVerified: true,
      avatarPath: await avatar("avatars", "#e4e0ec", "#8d84a3"),
    },
  });

  const jordan = await prisma.user.create({
    data: {
      email: "jordan@atelier.local",
      passwordHash: memberHash,
      displayName: "Jordan Lee",
      handle: "jordan",
      bio: "Coffee next week?",
      role: "MEMBER",
      instagramHandle: "jordan.lee",
      instagramVerified: false,
      avatarPath: await avatar("avatars", "#f0e6d8", "#c4a27a"),
    },
  });

  const family = await prisma.circle.create({
    data: {
      ownerId: bart.id,
      name: "Family",
      description: "Home and life moments",
      color: "#a78bfa",
      members: { create: [{ userId: alex.id }] },
    },
  });

  const close = await prisma.circle.create({
    data: {
      ownerId: bart.id,
      name: "Close Friends",
      description: "Walks, notes, and drafts",
      color: "#6b7280",
      members: { create: [{ userId: sam.id }] },
    },
  });

  const now = Date.now();

  const posts: {
    caption: string;
    likes: number;
    ago: number;
    audience: "PUBLIC" | "CIRCLES" | "PRIVATE";
    circleId?: string;
    colors: [string, string];
  }[] = [
    {
      caption: "Unsent — kitchen table, not for the grid.",
      likes: 0,
      ago: 1 * day,
      audience: "PRIVATE",
      colors: ["#eceae6", "#cfc8be"],
    },
    {
      caption: "Morning light in the studio. Sketching layout systems before coffee kicks in.",
      likes: 48,
      ago: 2 * day,
      audience: "PUBLIC",
      colors: ["#e8e4df", "#c9c2b8"],
    },
    {
      caption: "Coast trail — fog lifting around 7am. Quiet on purpose.",
      likes: 112,
      ago: 4 * day,
      audience: "PUBLIC",
      colors: ["#d4dde8", "#9aafc4"],
    },
    {
      caption: "Draft notes for Meridian’s privacy model. Circles, not a follower count.",
      likes: 67,
      ago: 5 * day,
      audience: "CIRCLES",
      circleId: close.id,
      colors: ["#e4e0ec", "#b8aec9"],
    },
    {
      caption: "Type study: Inter at small sizes still reads clean.",
      likes: 31,
      ago: 7 * day,
      audience: "PUBLIC",
      colors: ["#ebe8e2", "#d0cbc3"],
    },
    {
      caption: "Weekend market haul. Peaches were the move.",
      likes: 89,
      ago: 8 * day,
      audience: "CIRCLES",
      circleId: family.id,
      colors: ["#f0e6d8", "#d4b896"],
    },
    {
      caption: "Desk reset. One notebook, one task.",
      likes: 54,
      ago: 14 * day,
      audience: "PUBLIC",
      colors: ["#e2e6e8", "#aeb8bc"],
    },
    {
      caption: "Golden hour on the seawall. Vancouver doing Vancouver things.",
      likes: 201,
      ago: 15 * day,
      audience: "PUBLIC",
      colors: ["#f2d9c2", "#c9956c"],
    },
    {
      caption: "Prototype: soft lock badge on private grid tiles. Light touch.",
      likes: 43,
      ago: 21 * day,
      audience: "CIRCLES",
      circleId: close.id,
      colors: ["#dde8e4", "#9bb8ae"],
    },
    {
      caption: "End of week. Shipping small, thinking long.",
      likes: 76,
      ago: 22 * day,
      audience: "PUBLIC",
      colors: ["#e8e4f0", "#b4a8c9"],
    },
  ];

  for (const post of posts) {
    const imagePath = `posts/${randomUUID()}.png`;
    await saveObject(imagePath, gradientPng(640, 640, post.colors[0], post.colors[1]));
    await prisma.post.create({
      data: {
        authorId: bart.id,
        caption: post.caption,
        imagePath,
        audience: post.audience,
        likeCount: post.likes,
        createdAt: new Date(now - post.ago),
        circles: post.circleId ? { create: [{ circleId: post.circleId }] } : undefined,
      },
    });
  }

  const stories: {
    label: string;
    caption: string;
    ago: number;
    audience: "PUBLIC" | "CIRCLES" | "PRIVATE";
    circleId?: string;
    colors: [string, string];
  }[] = [
    { label: "Studio", caption: "Warm desk lamp, cold espresso", ago: 20 * hour, audience: "PUBLIC", colors: ["#2a2420", "#5c4a3a"] },
    { label: "Walk", caption: "Trailhead before the city wakes", ago: 16 * hour, audience: "PUBLIC", colors: ["#1a2820", "#3d5c4a"] },
    { label: "Notes", caption: "Privacy as a product surface", ago: 12 * hour, audience: "CIRCLES", circleId: close.id, colors: ["#22202a", "#4a3d5c"] },
    { label: "Coffee", caption: "Flat white, no rush", ago: 8 * hour, audience: "CIRCLES", circleId: family.id, colors: ["#2a2018", "#5c4030"] },
    { label: "Coast", caption: "Tide out · light soft", ago: 4 * hour, audience: "PUBLIC", colors: ["#182028", "#3a5060"] },
    { label: "Draft", caption: "Still on the desk. Not for the grid.", ago: 1 * hour, audience: "PRIVATE", colors: ["#1c1c24", "#383848"] },
  ];

  for (const story of stories) {
    const imagePath = `stories/${randomUUID()}.png`;
    await saveObject(imagePath, gradientPng(480, 800, story.colors[0], story.colors[1]));
    const createdAt = new Date(now - story.ago);
    await prisma.story.create({
      data: {
        authorId: bart.id,
        label: story.label,
        caption: story.caption,
        imagePath,
        audience: story.audience,
        createdAt,
        expiresAt: new Date(createdAt.getTime() + day),
        circles: story.circleId ? { create: [{ circleId: story.circleId }] } : undefined,
      },
    });
  }

  await prisma.follow.createMany({
    data: [
      { followerId: alex.id, followingId: bart.id },
      { followerId: sam.id, followingId: bart.id },
      { followerId: jordan.id, followingId: bart.id },
      { followerId: bart.id, followingId: alex.id },
      { followerId: bart.id, followingId: sam.id },
    ],
  });

  await prisma.verification.create({
    data: {
      userId: jordan.id,
      code: "quiet peaches 🍑 waiting 🌙 beside the studio before coffee",
      instagramHandle: "jordan.lee",
      contentUrl: "https://www.instagram.com/jordan.lee/",
      status: "PENDING",
      note: "Automatic check could not read the page. Confirm the phrase by eye, then mark verified.",
    },
  });

  const alexThread = await prisma.thread.create({
    data: {
      participants: {
        create: [
          { userId: bart.id, lastReadAt: new Date(now - 2 * day) },
          { userId: alex.id, lastReadAt: new Date(now - hour) },
        ],
      },
    },
  });
  await prisma.message.createMany({
    data: [
      {
        threadId: alexThread.id,
        senderId: alex.id,
        body: "Hey Bart — saw the Meridian nod in your bio.",
        createdAt: new Date(now - 26 * hour),
      },
      {
        threadId: alexThread.id,
        senderId: bart.id,
        body: "Ha, subtle branding. We’re still early.",
        createdAt: new Date(now - 25 * hour),
      },
      {
        threadId: alexThread.id,
        senderId: alex.id,
        body: "Loved the studio shots — when’s the next drop?",
        createdAt: new Date(now - hour),
      },
    ],
  });

  const samThread = await prisma.thread.create({
    data: {
      participants: {
        create: [
          { userId: bart.id, lastReadAt: new Date() },
          { userId: sam.id, lastReadAt: new Date() },
        ],
      },
    },
  });
  await prisma.message.createMany({
    data: [
      {
        threadId: samThread.id,
        senderId: bart.id,
        body: "Thinking about private following lists as the default.",
        createdAt: new Date(now - 3 * day),
      },
      {
        threadId: samThread.id,
        senderId: sam.id,
        body: "Circles idea is smart. Quiet > loud.",
        createdAt: new Date(now - 20 * hour),
      },
    ],
  });

  console.log("Seeded Atelier.");
  console.log(`  Owner   ${ownerEmail}  /  ${ownerPassword}`);
  console.log(`  Family  alex@atelier.local  /  ${memberPassword}  (Family circle)`);
  console.log(`  Close   sam@atelier.local   /  ${memberPassword}  (Close Friends)`);
  console.log(`  Pending jordan@atelier.local / ${memberPassword}  (not verified)`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
