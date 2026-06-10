/**
 * Rate limit simple en memoria para endpoints públicos.
 * (En Vercel multi-instancia es best-effort; suficiente para formularios públicos.)
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, max = 10, windowMs = 60_000): boolean {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (b.count >= max) return false;
  b.count++;
  return true;
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd?.split(",")[0].trim() || "unknown";
}
