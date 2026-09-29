import Link from "next/link";
import { AppFrame } from "@/components/AppFrame";
import { getViewer } from "@/lib/auth";

export default async function NotFound() {
  const viewer = await getViewer();
  return (
    <AppFrame viewer={viewer}>
      <div className="empty">
        <h2>Not available</h2>
        <p>That page is not here, or it is not shared with you.</p>
        <p>
          <Link href="/">Back to Atelier</Link>
        </p>
      </div>
    </AppFrame>
  );
}
