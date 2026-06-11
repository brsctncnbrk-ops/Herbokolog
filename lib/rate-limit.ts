import { RATE_LIMIT_PER_MINUTE } from "./config";

// Rate limit: Upstash Redis yapılandırılmışsa onu kullanır (sunucusuzda
// instance'lar arası tutarlı). Aksi halde in-memory'ye düşer (tek instance/demo).
//
// Üretimde ayarla:
//   UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN

const WINDOW_MS = 60_000;

// --- In-memory fallback ---
const buckets = new Map<string, { count: number; resetAt: number }>();

function inMemoryLimit(ip: string): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  const bucket = buckets.get(ip);
  if (!bucket || now > bucket.resetAt) {
    buckets.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true, retryAfter: 0 };
  }
  if (bucket.count >= RATE_LIMIT_PER_MINUTE) {
    return { ok: false, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  bucket.count += 1;
  return { ok: true, retryAfter: 0 };
}

// --- Upstash (lazy, opsiyonel) ---
type UpstashLimiter = {
  limit: (id: string) => Promise<{ success: boolean; reset: number }>;
};
let upstash: UpstashLimiter | null | undefined;

function getUpstash(): UpstashLimiter | null {
  if (upstash !== undefined) return upstash;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    upstash = null;
    return null;
  }
  try {
    // Dinamik require — paket yoksa veya env yoksa sessizce in-memory'ye düşeriz.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Ratelimit } = require("@upstash/ratelimit");
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Redis } = require("@upstash/redis");
    const limiter = new Ratelimit({
      redis: new Redis({ url, token }),
      limiter: Ratelimit.slidingWindow(RATE_LIMIT_PER_MINUTE, "60 s"),
      prefix: "herbokolog_rl",
    });
    upstash = limiter as UpstashLimiter;
  } catch (err) {
    console.error("[rate-limit] Upstash başlatılamadı, in-memory'ye düşülüyor:", (err as Error).message);
    upstash = null;
  }
  return upstash;
}

export async function rateLimit(
  ip: string,
): Promise<{ ok: boolean; retryAfter: number }> {
  const limiter = getUpstash();
  if (limiter) {
    try {
      const res = await limiter.limit(ip);
      const retryAfter = res.success ? 0 : Math.max(0, Math.ceil((res.reset - Date.now()) / 1000));
      return { ok: res.success, retryAfter };
    } catch (err) {
      console.error("[rate-limit] Upstash hata, in-memory'ye düşülüyor:", (err as Error).message);
      return inMemoryLimit(ip);
    }
  }
  return inMemoryLimit(ip);
}

export function getClientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
