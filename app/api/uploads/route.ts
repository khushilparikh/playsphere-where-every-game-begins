import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { jsonError, withErrorHandling } from "@/lib/api-format";
import { saveUpload, UploadError } from "@/lib/uploads";

// POST /api/uploads  (multipart/form-data, field name "file")
//   -> { url, size, type }
//
// Any logged-in user can upload a file (avatars, venue photos, post
// images, team crests, etc. all reuse this one endpoint — the caller
// decides where the returned url gets stored, e.g. Venue.image or
// CommunityPost.image). Unauthenticated uploads are rejected so this
// can't be used as an open file-drop.
export const POST = withErrorHandling(async (req: NextRequest) => {
  const user = await getAuthUser(req);
  if (!user) return jsonError("Not authenticated", 401);

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!file || !(file instanceof File)) {
    return jsonError("Expected multipart/form-data with a 'file' field");
  }

  try {
    const result = await saveUpload(file);
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    if (err instanceof UploadError) return jsonError(err.message, err.status);
    throw err;
  }
});
