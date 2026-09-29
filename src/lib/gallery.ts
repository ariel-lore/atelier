import { prisma } from "./prisma";
import { deleteObject } from "./storage";
import { HttpError } from "./http";
import { MAX_GALLERY } from "./content";
import type { Audience } from "./types";

type Kept = { id: string | null; imagePath: string };

/**
 * Rebuild a post's photos. Legacy posts store a single imagePath and no
 * PostImage rows; the first edit turns that file into a row so every photo
 * has its own authorized URL.
 */
export async function savePostGallery(input: {
  postId: string;
  coverPath: string;
  existing: { id: string; imagePath: string }[];
  removeIds: string[];
  addedPaths: string[];
  caption: string;
  audience: Audience;
  circleIds: string[];
}) {
  const dropLegacy = input.existing.length === 0 && input.removeIds.includes("cover");
  let kept: Kept[] = input.existing.length
    ? input.existing.filter((image) => !input.removeIds.includes(image.id))
    : dropLegacy
      ? []
      : [{ id: null, imagePath: input.coverPath }];

  const next: Kept[] = [...kept, ...input.addedPaths.map((imagePath) => ({ id: null, imagePath }))];
  if (next.length < 1) throw new HttpError(400, "A post needs at least one photo");
  if (next.length > MAX_GALLERY) throw new HttpError(400, `Up to ${MAX_GALLERY} photos`);

  const removed = input.existing.filter((image) => input.removeIds.includes(image.id));
  if (dropLegacy) removed.push({ id: "cover", imagePath: input.coverPath });

  for (const image of removed) {
    if (image.id !== "cover") {
      await prisma.postImage.delete({ where: { id: image.id } }).catch(() => undefined);
    }
    if (!next.some((item) => item.imagePath === image.imagePath)) {
      await deleteObject(image.imagePath);
    }
  }

  const ordered: { id: string; imagePath: string }[] = [];
  for (let position = 0; position < next.length; position++) {
    const item = next[position];
    if (item.id) {
      const row = await prisma.postImage.update({
        where: { id: item.id },
        data: { position },
      });
      ordered.push(row);
    } else {
      const row = await prisma.postImage.create({
        data: { postId: input.postId, imagePath: item.imagePath, position },
      });
      ordered.push(row);
    }
  }

  await prisma.postCircle.deleteMany({ where: { postId: input.postId } });
  await prisma.post.update({
    where: { id: input.postId },
    data: {
      caption: input.caption,
      audience: input.audience,
      imagePath: ordered[0].imagePath,
      circles: { create: input.circleIds.map((circleId) => ({ circleId })) },
    },
  });
}

export async function deletePostFiles(post: { imagePath: string; images: { imagePath: string }[] }) {
  const paths = new Set([post.imagePath, ...post.images.map((image) => image.imagePath)]);
  await Promise.all([...paths].map((path) => deleteObject(path)));
}
