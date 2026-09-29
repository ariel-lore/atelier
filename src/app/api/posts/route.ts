import { getViewer } from "@/lib/auth";
import { handle, json } from "@/lib/api";
import { getPost, listPosts } from "@/lib/queries";
import { assertCirclesOwned, parseAudience, readImageFile, requireOwner } from "@/lib/content";
import { HttpError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { deleteObject } from "@/lib/storage";

export async function GET(req: Request) {
  return handle(req, async () => {
    const viewer = await getViewer();
    const posts = await listPosts(viewer);
    return json({ posts });
  });
}

export async function POST(req: Request) {
  return handle(req, async () => {
    const viewer = requireOwner(await getViewer());
    const form = await req.formData();
    const caption = String(form.get("caption") ?? "").trim();
    if (caption.length > 2200) throw new HttpError(400, "Caption is too long");
    const circleIds = form.getAll("circleIds").map(String);
    const audience = parseAudience(String(form.get("audience") ?? ""), circleIds);
    await assertCirclesOwned(viewer.id, audience.circleIds);
    const imagePath = await readImageFile(form.get("image"), "posts");
    try {
      const post = await prisma.post.create({
        data: {
          authorId: viewer.id,
          caption,
          imagePath,
          audience: audience.audience,
          circles: {
            create: audience.circleIds.map((circleId) => ({ circleId })),
          },
        },
      });
      const dto = await getPost(post.id, viewer);
      return json({ post: dto }, 201);
    } catch (err) {
      await deleteObject(imagePath);
      throw err;
    }
  }, true);
}
