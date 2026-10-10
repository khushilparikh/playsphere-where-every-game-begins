// Lightweight in-memory rate limiter for sensitive endpoints (login,
// register). This is intentionally simple: an in-process Map keyed by a
// caller-supplied key (e.g. IP + email), tracking a rolling window of
// attempts.
//
// Limitation: this state lives in the Node process's memory, so it resets
// on every server restart and does NOT share state across multiple server
// instances. That's fine for a single-instance deployment (which is what
// this project ships as) but if PlaySphere is ever run behind a load
// balancer with multiple instances, swap this for a shared store (Redis)
// keyed the same way.

interface Bucket {
  count: number;
  windowStart: number;
}

const buckets = new Map<string, Bucket>();

// Periodically forget old buckets so this Map doesn't grow forever.
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (now - bucket.windowStart > 15 * 60 * 1000) buckets.delete(key);
  }
}, 5 * 60 * 1000).unref?.();

/**
 * Returns true if the caller is within the allowed rate, and records this
 * attempt. Returns false if they've exceeded `max` attempts within
 * `windowMs`.
 */
export function checkRateLimit(key: string, max = 8, windowMs = 5 * 60 * 1000): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || now - bucket.windowStart > windowMs) {
    buckets.set(key, { count: 1, windowStart: now });
    return true;
  }
  bucket.count += 1;
  return bucket.count <= max;
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}
