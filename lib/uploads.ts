// Shared self-hosted upload helper (Task 1 of Phase 1 — Foundational
// Plumbing). Writes files to the local `public/uploads/` directory and
// returns the public path the browser can load directly (e.g. served by
// Next.js as a static asset at "/uploads/<filename>").
//
// This intentionally has no third-party dependency (no Cloudinary/S3/etc.)
// — see PlaySphere-Improvement-Roadmap.md's scope note. It's a good fit
// for a single-instance deployment; if PlaySphere is ever run across
// multiple server instances behind a load balancer, `public/uploads/`
// would need to move to a shared volume so every instance can read every
// upload (the same caveat lib/rate-limit.ts already documents for its
// in-memory store).

import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

export const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

// Keep this list intentionally small and image-first — every current
// upload surface (venue photos, avatars/banners, post images, team
// crests) is an image. Extend it deliberately if a real need shows up
// (e.g. video uploads), rather than opening it up broadly.
const ALLOWED_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

const MAX_BYTES = 8 * 1024 * 1024; // 8MB — generous for a client-side-compressed image

export class UploadError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

/**
 * Validates and saves a single uploaded file, returning its public URL
 * path (e.g. "/uploads/3f1a2b-c9.jpg"). Throws UploadError on anything
 * invalid so callers can turn it into a proper jsonError() response.
 */
export async function saveUpload(file: File): Promise<{ url: string; size: number; type: string }> {
  if (!file || typeof file.arrayBuffer !== "function") {
    throw new UploadError("No file provided");
  }
  const ext = ALLOWED_TYPES[file.type];
  if (!ext) {
    throw new UploadError(
      `Unsupported file type "${file.type}". Allowed: ${Object.keys(ALLOWED_TYPES).join(", ")}`
    );
  }
  if (file.size > MAX_BYTES) {
    throw new UploadError(`File too large (max ${MAX_BYTES / (1024 * 1024)}MB)`, 413);
  }

  await mkdir(UPLOADS_DIR, { recursive: true });

  const filename = `${randomUUID()}.${ext}`;
  const destination = path.join(UPLOADS_DIR, filename);

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(destination, buffer);

  return { url: `/uploads/${filename}`, size: file.size, type: file.type };
}
