import { describe, it, expect } from "vitest";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";

describe("lib/rate-limit", () => {
  it("allows up to max attempts within the window and blocks subsequent attempts", () => {
    const key = `test-ip-${Math.random()}`;
    const max = 3;
    const windowMs = 60000;

    expect(checkRateLimit(key, max, windowMs)).toBe(true); // 1
    expect(checkRateLimit(key, max, windowMs)).toBe(true); // 2
    expect(checkRateLimit(key, max, windowMs)).toBe(true); // 3
    expect(checkRateLimit(key, max, windowMs)).toBe(false); // 4 (exceeded)
  });

  it("isolates rate limits by key", () => {
    const keyA = `ip-A-${Math.random()}`;
    const keyB = `ip-B-${Math.random()}`;
    const max = 2;

    expect(checkRateLimit(keyA, max)).toBe(true);
    expect(checkRateLimit(keyA, max)).toBe(true);
    expect(checkRateLimit(keyA, max)).toBe(false);

    // keyB should still be allowed
    expect(checkRateLimit(keyB, max)).toBe(true);
  });

  describe("clientIp", () => {
    it("extracts the first IP from x-forwarded-for header", () => {
      const req = new Request("http://localhost", {
        headers: { "x-forwarded-for": "203.0.113.195, 70.41.3.18, 150.172.238.178" },
      });
      expect(clientIp(req)).toBe("203.0.113.195");
    });

    it("uses x-real-ip if x-forwarded-for is missing", () => {
      const req = new Request("http://localhost", {
        headers: { "x-real-ip": "198.51.100.1" },
      });
      expect(clientIp(req)).toBe("198.51.100.1");
    });

    it("defaults to 'unknown' if no IP headers are present", () => {
      const req = new Request("http://localhost");
      expect(clientIp(req)).toBe("unknown");
    });
  });
});
