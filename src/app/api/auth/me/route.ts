import { getViewer } from "@/lib/auth";
import { handle, json } from "@/lib/api";

export async function GET(req: Request) {
  return handle(req, async () => {
    const viewer = await getViewer();
    if (!viewer) return json({ user: null });
    return json({ user: viewer });
  });
}
