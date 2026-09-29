import { notFound } from "next/navigation";
import { ProfileView } from "@/components/ProfileView";
import { getViewer } from "@/lib/auth";
import { getProfileByHandle } from "@/lib/queries";

export default async function PersonPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const viewer = await getViewer();
  const profile = await getProfileByHandle(handle, viewer);
  if (!profile) notFound();
  return <ProfileView profile={profile} viewer={viewer} />;
}
