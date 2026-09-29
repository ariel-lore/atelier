import { getViewer } from "@/lib/auth";
import { handle, json } from "@/lib/api";
import { assertCirclesOwned, parseAudience, readImageFile, requireOwner } from "@/lib/content";
import { HttpError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { getStory, listStories } from "@/lib/queries";
import { deleteObject } from "@/lib/storage";

const DAY = 24 * 60 * 60 * 1000;

export async function GET(req: Request) {
  return handle(req, async () => {
    const viewer = await getViewer();
    return json({ stories: await listStories(viewer) });
  });
}

export async function POST(req: Request) {
  return handle(req, async () => {
    const viewer = requireOwner(await getViewer());
    const form = await req.formData();
    const label = String(form.get("label") ?? "").trim();
    const caption = String(form.get("caption") ?? "").trim();
    if (label.length < 1 || label.length > 24) throw new HttpError(400, "Add a short label");
    if (caption.length > 200) throw new HttpError(400, "Caption is too long");
    const circleIds = form.getAll("circleIds").map(String);
    const audience = parseAudience(String(form.get("audience") ?? ""), circleIds);
    await assertCirclesOwned(viewer.id, audience.circleIds);
    const imagePath = await readImageFile(form.get("image"), "stories");
    try {
      const story = await prisma.story.create({
        data: {
          authorId: viewer.id,
          label,
          caption,
          imagePath,
          audience: audience.audience,
          expiresAt: new Date(Date.now() + DAY),
          circles: { create: audience.circleIds.map((circleId) => ({ circleId })) },
        },
      });
      return json({ story: await getStory(story.id, viewer) }, 201);
    } catch (err) {
      await deleteObject(imagePath);
      throw err;
    }
  }, true);
}
