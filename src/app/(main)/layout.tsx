import { AppFrame } from "@/components/AppFrame";
import { getViewer } from "@/lib/auth";
import { getOwnerUser } from "@/lib/queries";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const [viewer, owner] = await Promise.all([getViewer(), getOwnerUser()]);
  return <AppFrame viewer={viewer} ownerHandle={owner?.handle ?? "bart"}>{children}</AppFrame>;
}
