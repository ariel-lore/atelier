import Link from "next/link";
import { ComposeForm } from "@/components/ComposeForm";
import { getViewer } from "@/lib/auth";
import { listCircles } from "@/lib/queries";

export default async function NewPage() {
  const viewer = await getViewer();
  if (!viewer) {
    return (
      <div className="page-pad">
        <h2 className="page-title">New</h2>
        <p className="lede">Sign in to continue.</p>
        <Link href="/login?next=/new" className="btn btn-primary">
          Sign in
        </Link>
      </div>
    );
  }
  if (viewer.role !== "OWNER") {
    return (
      <div className="page-pad">
        <h2 className="page-title">New</h2>
        <p className="lede">Posts and stories on this site are Bart’s. You can message him, or verify your Instagram so he can add you to a circle.</p>
        <div className="row-actions">
          <Link href="/verify" className="btn btn-primary">
            Verify Instagram
          </Link>
          <Link href="/messages" className="btn btn-secondary">
            Messages
          </Link>
        </div>
      </div>
    );
  }
  const circles = await listCircles(viewer.id, viewer);
  return (
    <section className="view page-pad">
      <h2 className="page-title">New</h2>
      <p className="lede">Add photos, choose who can see them, then preview before it goes live.</p>
      <ComposeForm circles={circles} />
    </section>
  );
}
