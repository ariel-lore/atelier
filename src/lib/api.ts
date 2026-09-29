import { NextResponse } from "next/server";
import { assertSameOrigin, HttpError } from "./http";

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export async function handle(req: Request, fn: () => Promise<Response>, mutate = false) {
  try {
    if (mutate && req.method !== "GET") assertSameOrigin(req);
    return await fn();
  } catch (err) {
    if (err instanceof HttpError) return json({ error: err.message }, err.status);
    console.error(err);
    return json({ error: "Something went wrong" }, 500);
  }
}
