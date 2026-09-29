import { mkdir, readFile, rm, writeFile } from "fs/promises";
import path from "path";

/**
 * Media storage.
 *
 * v1 writes to local disk (`UPLOAD_DIR`, default `./uploads`).
 * Swap this module for an S3-compatible client without changing routes:
 *
 *   put(key, body, contentType) -> s3.send(new PutObjectCommand(...))
 *   get(key)                    -> s3.send(new GetObjectCommand(...))
 *   delete(key)                 -> s3.send(new DeleteObjectCommand(...))
 *
 * Private objects must stay off any public bucket URL. Routes in
 * `/api/media/*` authorize the viewer, then stream bytes.
 */

const ROOT = path.resolve(process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads"));

function resolveKey(key: string): string {
  if (!/^[a-z0-9][a-z0-9/._-]*$/i.test(key) || key.includes("..")) {
    throw new Error("Invalid storage key");
  }
  const full = path.resolve(ROOT, key);
  if (!full.startsWith(ROOT + path.sep) && full !== ROOT) {
    throw new Error("Invalid storage key");
  }
  return full;
}

export function uploadRoot() {
  return ROOT;
}

export async function saveObject(key: string, body: Buffer) {
  const full = resolveKey(key);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, body);
}

export async function readObject(key: string): Promise<Buffer | null> {
  try {
    return await readFile(resolveKey(key));
  } catch {
    return null;
  }
}

export async function deleteObject(key: string) {
  try {
    await rm(resolveKey(key), { force: true });
  } catch {
    /* ignore */
  }
}

export function extensionForMime(mime: string): string | null {
  switch (mime) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    default:
      return null;
  }
}

export function sniffImageMime(buf: Buffer): string | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    buf.length >= 8 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  ) {
    return "image/png";
  }
  if (
    buf.length >= 12 &&
    buf.subarray(0, 4).toString("ascii") === "RIFF" &&
    buf.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "image/webp";
  }
  if (buf.length >= 6) {
    const head = buf.subarray(0, 6).toString("ascii");
    if (head === "GIF87a" || head === "GIF89a") return "image/gif";
  }
  return null;
}

export function contentTypeForKey(key: string): string {
  const ext = key.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    case "svg":
      return "image/svg+xml";
    default:
      return "application/octet-stream";
  }
}
