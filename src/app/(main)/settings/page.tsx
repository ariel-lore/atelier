import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/LogoutButton";
import { SettingsForm } from "@/components/SettingsForm";
import { getViewer } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function SettingsPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/login?next=/settings");
  const user = await prisma.user.findUnique({ where: { id: viewer.id } });
  if (!user) redirect("/login");
  return (
    <section className="page-pad">
      <h2 className="page-title">Profile</h2>
      <p className="lede">@{user.handle}. Counts and lists you turn off are left out of the page and the API.</p>
      <SettingsForm
        displayName={user.displayName}
        bio={user.bio}
        followerCountPublic={user.followerCountPublic}
        followingCountPublic={user.followingCountPublic}
        followerListPublic={user.followerListPublic}
        followingListPublic={user.followingListPublic}
      />
      <div style={{ height: 16 }} />
      <LogoutButton />
    </section>
  );
}
