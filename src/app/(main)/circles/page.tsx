import Link from "next/link";
import { redirect } from "next/navigation";
import { CirclesAdmin } from "@/components/CirclesAdmin";
import { getViewer } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { listCircles, toPerson } from "@/lib/queries";

export default async function CirclesPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/login?next=/circles");
  if (viewer.role !== "OWNER") redirect("/privacy");
  const [circles, members] = await Promise.all([
    listCircles(viewer.id, viewer),
    prisma.user.findMany({ where: { instagramVerified: true, role: "MEMBER" }, orderBy: { displayName: "asc" } }),
  ]);
  return (
    <section className="view">
      <CirclesAdmin circles={circles} verified={members.map((m) => toPerson(m, viewer))} />
      <div className="page-pad">
        <Link href="/verify" className="btn btn-ghost">
          Review Instagram checks
        </Link>
      </div>
    </section>
  );
}
