import { NextResponse } from "next/server";
import { contentTypeForKey, readObject } from "./storage";

export function mediaResponse(body: Buffer, key: string) {
  return new NextResponse(new Uint8Array(body), {
    status: 200,
    headers: {
      "Content-Type": contentTypeForKey(key),
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'",
      "Content-Disposition": "inline",
    },
  });
}

export async function serveKey(key: string | null | undefined) {
  if (!key) return new NextResponse(null, { status: 404 });
  const body = await readObject(key);
  if (!body) return new NextResponse(null, { status: 404 });
  return mediaResponse(body, key);
}

export const notFound = () => NextResponse.json({ error: "Not found" }, { status: 404 });
