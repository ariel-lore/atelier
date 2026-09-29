import { destroySession } from "@/lib/auth";
import { handle, json } from "@/lib/api";

export async function POST(req: Request) {
  return handle(req, async () => {
    await destroySession();
    return json({ ok: true });
  }, true);
}
