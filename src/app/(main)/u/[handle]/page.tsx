import { notFound } from "next/navigation";
import { ProfileView } from "@/components/ProfileView";
import { isSetupError, SetupNotice } from "@/components/SetupNotice";
import { getViewer } from "@/lib/auth";
import { getProfileByHandle } from "@/lib/queries";

export default async function PersonPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const viewer = await getViewer();
  let profile;
  try {
    profile = await getProfileByHandle(handle, viewer);
  } catch (err) {
    if (isSetupError(err)) return <SetupNotice error={err} />;
    throw err;
  }
  if (!profile) notFound();
  return <ProfileView profile={profile} viewer={viewer} />;
}
