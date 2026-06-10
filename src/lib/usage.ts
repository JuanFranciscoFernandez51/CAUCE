import { db } from "@/lib/db";
import { getPricing, type PackKey } from "@/lib/pricing";

export function currentPeriod(): string {
  // Período en hora argentina (UTC-3), no UTC.
  const now = new Date(Date.now() - 3 * 60 * 60 * 1000);
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** Suma uso del período (mensajes/tokens) — upsert atómico. */
export async function trackUsage(clientId: string, delta: { messages?: number; tokensIn?: number; tokensOut?: number; costUsd?: number }) {
  const period = currentPeriod();
  await db.usage.upsert({
    where: { clientId_period: { clientId, period } },
    create: { clientId, period, messages: delta.messages ?? 0, tokensIn: delta.tokensIn ?? 0, tokensOut: delta.tokensOut ?? 0, costUsd: delta.costUsd ?? 0 },
    update: {
      messages: { increment: delta.messages ?? 0 },
      tokensIn: { increment: delta.tokensIn ?? 0 },
      tokensOut: { increment: delta.tokensOut ?? 0 },
      costUsd: { increment: delta.costUsd ?? 0 },
    },
  });
}

export type FairUse = {
  limit: number | null;
  used: number;
  pct: number | null; // null si no hay tope
  warn: boolean; // >= 80%
  exceeded: boolean; // >= 100%
};

/** Estado de fair use del cliente en el período actual, según el tope de su pack. */
export async function getFairUse(clientId: string): Promise<FairUse> {
  const client = await db.client.findUnique({ where: { id: clientId } });
  const usage = await db.usage.findUnique({
    where: { clientId_period: { clientId, period: currentPeriod() } },
  });
  const used = usage?.messages ?? 0;
  const pricing = await getPricing();
  const packKey = (client?.pack ?? "NONE").toLowerCase() as PackKey;
  const limit = pricing.packs[packKey]?.fairUseMsgs ?? null;
  const pct = limit ? Math.round((used / limit) * 100) : null;
  return {
    limit,
    used,
    pct,
    warn: pct !== null && pct >= 80 && pct < 100,
    exceeded: pct !== null && pct >= 100,
  };
}
