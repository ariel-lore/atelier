import { getViewer } from "@/lib/auth";
import { handle, json } from "@/lib/api";
import { searchPeople } from "@/lib/queries";

export async function GET(req: Request) {
  return handle(req, async () => {
    const viewer = await getViewer();
    const q = new URL(req.url).searchParams.get("q") ?? "";
    return json({ people: await searchPeople(q, viewer) });
  });
}
