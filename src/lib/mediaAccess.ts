import { getViewer } from "./auth";
import { prisma } from "./prisma";
import { canView, storyIsLive } from "./privacy";

export async function loadAuthorizedPost(id: string) {
  const viewer = await getViewer();
  const post = await prisma.post.findUnique({
    where: { id },
    include: { circles: { select: { circleId: true } } },
  });
  if (!post) return null;
  const allowed = canView(viewer, {
    authorId: post.authorId,
    audience: post.audience,
    circleIds: post.circles.map((circle) => circle.circleId),
  });
  return allowed ? post : null;
}

export async function loadAuthorizedStory(id: string) {
  const viewer = await getViewer();
  const story = await prisma.story.findUnique({
    where: { id },
    include: { circles: { select: { circleId: true } } },
  });
  if (!story || !storyIsLive(story.expiresAt)) return null;
  const allowed = canView(viewer, {
    authorId: story.authorId,
    audience: story.audience,
    circleIds: story.circles.map((circle) => circle.circleId),
  });
  return allowed ? story : null;
}
