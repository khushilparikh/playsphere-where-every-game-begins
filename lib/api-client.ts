// Thin fetch wrapper used by every client component that talks to the
// PlaySphere API. Always sends cookies (for the JWT session) and throws a
// normal Error with the server's message on failure, so call sites can just
// try/catch.
export async function api<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(path, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    throw new Error(body?.error || `Request failed (${res.status})`);
  }
  return body as T;
}

export const apiGet = <T = any>(path: string) => api<T>(path);
export const apiPost = <T = any>(path: string, data?: unknown) =>
  api<T>(path, { method: "POST", body: data ? JSON.stringify(data) : undefined });
export const apiPatch = <T = any>(path: string, data?: unknown) =>
  api<T>(path, { method: "PATCH", body: data ? JSON.stringify(data) : undefined });
export const apiDelete = <T = any>(path: string) => api<T>(path, { method: "DELETE" });

// Uploads a single File to the self-hosted /api/uploads endpoint (see
// lib/uploads.ts) and returns its public URL. Deliberately bypasses the
// JSON Content-Type header that `api()` sets by default — the browser
// needs to set its own multipart boundary for FormData.
export async function apiUpload(file: File | Blob, filename?: string): Promise<{ url: string; size: number; type: string }> {
  const form = new FormData();
  form.append("file", file, filename);
  const res = await fetch("/api/uploads", { method: "POST", credentials: "include", body: form });
  const isJson = res.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await res.json().catch(() => null) : null;
  if (!res.ok) throw new Error(body?.error || `Upload failed (${res.status})`);
  return body;
}
