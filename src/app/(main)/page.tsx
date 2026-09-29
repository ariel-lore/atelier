import { ProfileView } from "@/components/ProfileView";
import { isSetupError, SetupNotice } from "@/components/SetupNotice";
import { getViewer } from "@/lib/auth";
import { getOwnerProfile } from "@/lib/queries";

export default async function ProfilePage() {
  const viewer = await getViewer();
  let profile;
  try {
    profile = await getOwnerProfile(viewer);
  } catch (err) {
    if (isSetupError(err)) return <SetupNotice error={err} />;
    throw err;
  }
  if (!profile) {
    return (
      <div className="empty">
        <h2>Atelier is not set up yet</h2>
        <p>Run the seed script to create Bart’s profile.</p>
      </div>
    );
  }
  return <ProfileView profile={profile} viewer={viewer} />;
}
