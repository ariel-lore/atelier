import { getViewer } from "@/lib/auth";
import { handle, json } from "@/lib/api";
import { assertCirclesOwned, parseAudience, readImageFiles, requireOwner } from "@/lib/content";
import { deletePostFiles, savePostGallery } from "@/lib/gallery";
import { HttpError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { getPost } from "@/lib/queries";
import { deleteObject } from "@/lib/storage";

async function ownedPost(id: string, ownerId: string) {
  const post = await prisma.post.findUnique({ where: { id }, include: { images: true } });
  if (!post || post.authorId !== ownerId) throw new HttpError(404, "Not found");
  return post;
}

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(req, async () => {
    const { id } = await ctx.params;
    const viewer = await getViewer();
    const post = await getPost(id, viewer);
    if (!post) return json({ error: "Not found" }, 404);
    return json({ post });
  });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(req, async () => {
    const viewer = requireOwner(await getViewer());
    const { id } = await ctx.params;
    const post = await ownedPost(id, viewer.id);
    const form = await req.formData();
    const caption = String(form.get("caption") ?? "").trim();
    if (caption.length > 2200) throw new HttpError(400, "Caption is too long");
    const audience = parseAudience(String(form.get("audience") ?? ""), form.getAll("circleIds").map(String));
    await assertCirclesOwned(viewer.id, audience.circleIds);
    const added = await readImageFiles(form, "posts", false);
    try {
      await savePostGallery({
        postId: post.id,
        coverPath: post.imagePath,
        existing: post.images,
        removeIds: form.getAll("removeImageIds").map(String),
        addedPaths: added,
        caption,
        audience: audience.audience,
        circleIds: audience.circleIds,
      });
    } catch (err) {
      await Promise.all(added.map((path) => deleteObject(path)));
      throw err;
    }
    return json({ post: await getPost(id, viewer) });
  }, true);
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(req, async () => {
    const viewer = requireOwner(await getViewer());
    const { id } = await ctx.params;
    const post = await ownedPost(id, viewer.id);
    await deletePostFiles(post);
    await prisma.post.delete({ where: { id } });
    return json({ ok: true });
  }, true);
}
