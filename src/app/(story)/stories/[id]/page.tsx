import { notFound } from "next/navigation";
import { StoryViewer } from "@/components/StoryViewer";
import { getViewer } from "@/lib/auth";
import { listStories } from "@/lib/queries";

export default async function StoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const viewer = await getViewer();
  const stories = await listStories(viewer);
  if (!stories.some((story) => story.id === id)) notFound();
  return <StoryViewer stories={stories} startId={id} />;
}
