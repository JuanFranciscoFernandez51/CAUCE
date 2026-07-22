import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { publicarPost } from "@/lib/marketing/publicar";

export const maxDuration = 300;

const MAX_POR_CORRIDA = 5;
const MAX_RETRIES = 3;
const LOCK_ZOMBIE_MIN = 10;

/**
 * Publica los MktPost programados vencidos (corre cada hora).
 * Optimistic lock con lockedAt/lockedBy para no duplicar entre corridas.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
  }

  const now = new Date();
  const lockId = `cron-${now.getTime()}`;
  const zombieCutoff = new Date(now.getTime() - LOCK_ZOMBIE_MIN * 60_000);

  const candidatos = await db.mktPost.findMany({
    where: {
      status: "PENDING",
      scheduledAt: { lte: now },
      retryCount: { lt: MAX_RETRIES },
      OR: [{ lockedAt: null }, { lockedAt: { lt: zombieCutoff } }],
    },
    orderBy: { scheduledAt: "asc" },
    take: MAX_POR_CORRIDA,
    select: { id: true, lockedAt: true },
  });

  const resultados: { id: string; status: string }[] = [];
  for (const cand of candidatos) {
    // Lock condicional: si otra corrida lo agarró en el medio, lo salteamos.
    const locked = await db.mktPost.updateMany({
      where: {
        id: cand.id,
        status: "PENDING",
        OR: [{ lockedAt: null }, { lockedAt: { lt: zombieCutoff } }],
      },
      data: { lockedAt: now, lockedBy: lockId },
    });
    if (locked.count === 0) continue;

    try {
      const post = await publicarPost(cand.id);
      resultados.push({ id: cand.id, status: post.status });
    } catch (e) {
      await db.mktPost.update({
        where: { id: cand.id },
        data: {
          status: "PENDING", // se reintenta la próxima corrida hasta MAX_RETRIES
          retryCount: { increment: 1 },
          errorMessage: e instanceof Error ? e.message : "Error",
        },
      });
      resultados.push({ id: cand.id, status: "RETRY" });
    } finally {
      await db.mktPost.update({
        where: { id: cand.id },
        data: { lockedAt: null, lockedBy: null },
      });
    }
  }

  // Los que agotaron reintentos quedan FAILED.
  await db.mktPost.updateMany({
    where: { status: "PENDING", retryCount: { gte: MAX_RETRIES } },
    data: { status: "FAILED" },
  });

  return NextResponse.json({ ok: true, procesados: resultados });
}
