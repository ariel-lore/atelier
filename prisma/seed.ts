import "./load-env";
import { randomUUID } from "crypto";
import { readFile } from "fs/promises";
import path from "path";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { saveObject } from "../src/lib/storage";

const prisma = new PrismaClient();
const SEED_MEDIA = path.join(process.cwd(), "seed-media");

const hour = 60 * 60 * 1000;
const day = 24 * hour;

async function media(rel: string, folder: "avatars" | "posts" | "stories" | "highlights") {
  const file = path.join(SEED_MEDIA, rel);
  let buf: Buffer;
  try {
    buf = await readFile(file);
  } catch {
    throw new Error(`Missing seed photo ${rel}. Expected it under seed-media/.`);
  }
  if (buf.length < 3 || buf[0] !== 0xff || buf[1] !== 0xd8) {
    throw new Error(`Seed photo ${rel} is not a JPEG`);
  }
  const key = `${folder}/${randomUUID()}.jpg`;
  await saveObject(key, buf);
  return key;
}

const firstNames = [
  "Mina", "Owen", "Leah", "Noah", "Priya", "Evan", "Sofia", "Jonah", "Ava", "Chris",
  "Elena", "Marcus", "Hana", "Theo", "Nina", "Jules", "Rae", "Omar", "Lila", "Kai",
  "Maya", "Ben", "Iris", "Hugo", "Noor", "Seth", "Ada", "Leo", "Willa", "Nico",
];
const lastNames = ["Park", "Nguyen", "Shah", "Brooks", "Almeida", "Ito", "Berg", "Okoye", "Marin", "Cho", "Adler", "Voss"];

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
  await prisma.postImage.deleteMany();
  await prisma.postCircle.deleteMany();
  await prisma.post.deleteMany();
  await prisma.storyFrame.deleteMany();
  await prisma.storyCircle.deleteMany();
  await prisma.story.deleteMany();
  await prisma.highlight.deleteMany();
  await prisma.circleMember.deleteMany();
  await prisma.circle.deleteMany();
  await prisma.verification.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();

  const ownerHash = await bcrypt.hash(ownerPassword, 10);
  const memberHash = await bcrypt.hash(memberPassword, 10);
  const crowdHash = await bcrypt.hash(randomUUID(), 8);

  const bart = await prisma.user.create({
    data: {
      email: ownerEmail.toLowerCase(),
      passwordHash: ownerHash,
      displayName: ownerName,
      handle: ownerHandle,
      bio: "Designing Meridian\nVancouver\nmeridian.studio",
      role: "OWNER",
      instagramHandle: "bartmatero",
      instagramVerified: true,
      followerCountPublic: true,
      followingCountPublic: true,
      followerListPublic: true,
      followingListPublic: false,
      avatarPath: await media("avatars/bart.jpg", "avatars"),
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
      avatarPath: await media("avatars/alex.jpg", "avatars"),
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
      avatarPath: await media("avatars/sam.jpg", "avatars"),
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
      avatarPath: await media("avatars/jordan.jpg", "avatars"),
    },
  });

  const crowd = [];
  let n = 0;
  for (const first of firstNames) {
    for (const last of lastNames) {
      if (crowd.length >= 128) break;
      const handle = `${first}${last}${n}`.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 20);
      crowd.push({
        email: `${handle}@seed.atelier`,
        passwordHash: crowdHash,
        displayName: `${first} ${last}`,
        handle,
        role: "MEMBER",
      });
      n += 1;
    }
  }
  await prisma.user.createMany({ data: crowd });
  const crowdUsers = await prisma.user.findMany({
    where: { email: { endsWith: "@seed.atelier" } },
    select: { id: true },
    orderBy: { handle: "asc" },
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
    files: string[];
  }[] = [
    {
      caption: "Morning light in the studio.\nSketching before the coffee kicks in.\n\n#meridian #studio",
      likes: 842,
      ago: 6 * hour,
      audience: "PUBLIC",
      files: ["posts/p01.jpg"],
    },
    {
      caption: "Coast trail, three stops.\nFog, then the headland, then lunch on a rock.\n\n@sam would have turned around at the fog.",
      likes: 1204,
      ago: 1 * day + 3 * hour,
      audience: "PUBLIC",
      files: ["posts/p02a.jpg", "posts/p02b.jpg", "posts/p02c.jpg"],
    },
    {
      caption: "One notebook. One task.\nThe rest of the desk can wait.",
      likes: 316,
      ago: 3 * day,
      audience: "PUBLIC",
      files: ["posts/p03.jpg"],
    },
    {
      caption: "Weekend market with @alex.\nPeaches were the move — she called it before I paid.\n\n#familytable",
      likes: 96,
      ago: 5 * day,
      audience: "CIRCLES",
      circleId: family.id,
      files: ["posts/p04a.jpg", "posts/p04b.jpg", "posts/p04c.jpg", "posts/p04d.jpg"],
    },
    {
      caption: "Type study.\nInter at small sizes still reads clean on a phone.",
      likes: 540,
      ago: 7 * day,
      audience: "PUBLIC",
      files: ["posts/p05.jpg"],
    },
    {
      caption: "Flat white, no rush.\nThe window seat was already taken so I stood.",
      likes: 228,
      ago: 9 * day,
      audience: "PUBLIC",
      files: ["posts/p06a.jpg", "posts/p06b.jpg"],
    },
    {
      caption: "Draft notes for Meridian.\nCircles, not a follower count. @sam has the longer version.",
      likes: 18,
      ago: 11 * day,
      audience: "CIRCLES",
      circleId: close.id,
      files: ["posts/p07.jpg"],
    },
    {
      caption: "Seawall, late.\nVancouver doing the golden-hour thing again.\n\n#vancouver #seawall",
      likes: 2106,
      ago: 13 * day,
      audience: "PUBLIC",
      files: ["posts/p08a.jpg", "posts/p08b.jpg", "posts/p08c.jpg", "posts/p08d.jpg", "posts/p08e.jpg"],
    },
    {
      caption: "Rain on the studio glass.\nGood day to stay with the grid.",
      likes: 671,
      ago: 16 * day,
      audience: "PUBLIC",
      files: ["posts/p09.jpg"],
    },
    {
      caption: "Ceramics from the place on Main.\nOne bowl for fruit, one that will probably hold paperclips.",
      likes: 403,
      ago: 19 * day,
      audience: "PUBLIC",
      files: ["posts/p10a.jpg", "posts/p10b.jpg"],
    },
    {
      caption: "Stairs at the gallery.\nI go for the landings more than the show.",
      likes: 155,
      ago: 22 * day,
      audience: "PUBLIC",
      files: ["posts/p11.jpg"],
    },
    {
      caption: "Library afternoon.\nSpread the references out, then put half of them back.\n\n#reading",
      likes: 289,
      ago: 25 * day,
      audience: "PUBLIC",
      files: ["posts/p12a.jpg", "posts/p12b.jpg", "posts/p12c.jpg"],
    },
    {
      caption: "Shadow on linen.\nNothing else in the frame on purpose.",
      likes: 734,
      ago: 28 * day,
      audience: "PUBLIC",
      files: ["posts/p13.jpg"],
    },
    {
      caption: "Ferry home.\nThe island gets small fast once you stop looking at your phone.",
      likes: 988,
      ago: 32 * day,
      audience: "PUBLIC",
      files: ["posts/p14a.jpg", "posts/p14b.jpg", "posts/p14c.jpg", "posts/p14d.jpg"],
    },
    {
      caption: "Bike locked, coffee not yet.\nOrder of operations matters.",
      likes: 412,
      ago: 36 * day,
      audience: "PUBLIC",
      files: ["posts/p15.jpg"],
    },
    {
      caption: "Paper samples for the next Meridian page.\nWarm white won. Cool white looked like a hospital.",
      likes: 267,
      ago: 40 * day,
      audience: "PUBLIC",
      files: ["posts/p16a.jpg", "posts/p16b.jpg"],
    },
    {
      caption: "Bridge lights on the way back.\n#nightwalk",
      likes: 1502,
      ago: 44 * day,
      audience: "PUBLIC",
      files: ["posts/p17.jpg"],
    },
    {
      caption: "Unsent — kitchen table, cleared.\nExcept the one mug I keep meaning to wash.",
      likes: 0,
      ago: 2 * day,
      audience: "PRIVATE",
      files: ["posts/p18a.jpg", "posts/p18b.jpg", "posts/p18c.jpg"],
    },
    {
      caption: "Plant I have not killed yet.\nWeek six. @alex is keeping score.",
      likes: 623,
      ago: 48 * day,
      audience: "PUBLIC",
      files: ["posts/p19.jpg"],
    },
    {
      caption: "Two frames from the same corner.\nThe second one is after the cloud moved.",
      likes: 811,
      ago: 52 * day,
      audience: "PUBLIC",
      files: ["posts/p20a.jpg", "posts/p20b.jpg"],
    },
    {
      caption: "End of the week.\nShipping small, thinking long.\n\n#meridian",
      likes: 447,
      ago: 58 * day,
      audience: "PUBLIC",
      files: ["posts/p21.jpg"],
    },
    {
      caption: "First desk in the new room.\nLess stuff. More wall.",
      likes: 1290,
      ago: 70 * day,
      audience: "PUBLIC",
      files: ["posts/p22.jpg"],
    },
  ];

  for (const post of posts) {
    const paths: string[] = [];
    for (const file of post.files) paths.push(await media(file, "posts"));
    await prisma.post.create({
      data: {
        authorId: bart.id,
        caption: post.caption,
        imagePath: paths[0],
        audience: post.audience,
        likeCount: post.likes,
        createdAt: new Date(now - post.ago),
        circles: post.circleId ? { create: [{ circleId: post.circleId }] } : undefined,
        images: { create: paths.map((imagePath, position) => ({ imagePath, position })) },
      },
    });
  }

  const stories: {
    label: string;
    caption: string;
    ago: number;
    audience: "PUBLIC" | "CIRCLES" | "PRIVATE";
    circleId?: string;
    files: string[];
  }[] = [
    { label: "Studio", caption: "Warm lamp, cold espresso", ago: 2 * hour, audience: "PUBLIC", files: ["stories/studio-1.jpg", "stories/studio-2.jpg", "stories/studio-3.jpg"] },
    { label: "Walk", caption: "Trailhead before the city wakes", ago: 5 * hour, audience: "PUBLIC", files: ["stories/walk-1.jpg", "stories/walk-2.jpg"] },
    { label: "Notes", caption: "Privacy as a product surface", ago: 8 * hour, audience: "CIRCLES", circleId: close.id, files: ["stories/notes-1.jpg", "stories/notes-2.jpg"] },
    { label: "Coffee", caption: "Flat white, no rush", ago: 11 * hour, audience: "CIRCLES", circleId: family.id, files: ["stories/coffee-1.jpg", "stories/coffee-2.jpg"] },
    { label: "Coast", caption: "Tide out · light soft", ago: 15 * hour, audience: "PUBLIC", files: ["stories/coast-1.jpg", "stories/coast-2.jpg", "stories/coast-3.jpg"] },
    { label: "Draft", caption: "Still on the desk. Not for the grid.", ago: 18 * hour, audience: "PRIVATE", files: ["stories/draft-1.jpg"] },
  ];

  for (const story of stories) {
    const paths: string[] = [];
    for (const file of story.files) paths.push(await media(file, "stories"));
    const createdAt = new Date(now - story.ago);
    await prisma.story.create({
      data: {
        authorId: bart.id,
        label: story.label,
        caption: story.caption,
        imagePath: paths[0],
        audience: story.audience,
        createdAt,
        expiresAt: new Date(createdAt.getTime() + day),
        circles: story.circleId ? { create: [{ circleId: story.circleId }] } : undefined,
        frames: { create: paths.map((imagePath, position) => ({ imagePath, position })) },
      },
    });
  }

  const highlights = [
    ["Studio", "highlights/studio.jpg"],
    ["Coast", "highlights/coast.jpg"],
    ["Desk", "highlights/desk.jpg"],
    ["Market", "highlights/market.jpg"],
    ["Type", "highlights/type.jpg"],
  ] as const;
  for (let position = 0; position < highlights.length; position++) {
    const [label, file] = highlights[position];
    await prisma.highlight.create({
      data: {
        authorId: bart.id,
        label,
        position,
        imagePath: await media(file, "highlights"),
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
      ...crowdUsers.map((user) => ({ followerId: user.id, followingId: bart.id })),
      ...crowdUsers.slice(0, 64).map((user) => ({ followerId: bart.id, followingId: user.id })),
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

  const publicCount = posts.filter((post) => post.audience === "PUBLIC").length;
  console.log("Seeded Atelier.");
  console.log(`  Owner   ${ownerEmail}  /  ${ownerPassword}`);
  console.log(`  Family  alex@atelier.local  /  ${memberPassword}  (Family circle)`);
  console.log(`  Close   sam@atelier.local   /  ${memberPassword}  (Close Friends)`);
  console.log(`  Pending jordan@atelier.local / ${memberPassword}  (not verified)`);
  console.log(`  Posts   ${posts.length} (${publicCount} public, 1 Family, 1 Close Friends, 1 Only me)`);
  console.log(`  People  ${crowdUsers.length} extra followers (not login accounts)`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
