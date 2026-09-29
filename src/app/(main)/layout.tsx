import { AppFrame } from "@/components/AppFrame";
import { getViewer } from "@/lib/auth";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const viewer = await getViewer();
  return <AppFrame viewer={viewer}>{children}</AppFrame>;
}
