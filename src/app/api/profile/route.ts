import { getViewer } from "@/lib/auth";
import { handle, json } from "@/lib/api";
import { getOwnerProfile, getProfileByHandle, listPosts } from "@/lib/queries";

export async function GET(req: Request) {
  return handle(req, async () => {
    const viewer = await getViewer();
    const url = new URL(req.url);
    const handleName = url.searchParams.get("handle");
    const profile = handleName
      ? await getProfileByHandle(handleName, viewer)
      : await getOwnerProfile(viewer);
    if (!profile) return json({ error: "Not found" }, 404);
    return json({ profile });
  });
}
