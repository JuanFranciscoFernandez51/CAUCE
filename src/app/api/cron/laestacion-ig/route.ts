import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { publicarBazarPublicacion } from "@/lib/bazar-ig";

export const maxDuration = 300;

const MAX_POR_CORRIDA = 5;

/**
 * Cron de Instagram del bazar (corre cada hora): publica las BazarPublicacion
 * PROGRAMADAS vencidas. Genérico para cualquier tenant con template bazar
 * (hoy: laestacion). Si falla, la publicación queda en ERROR con el motivo
 * y NO se reintenta sola (el cliente la ve en el calendario y decide).
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
  }

  const vencidas = await db.bazarPublicacion.findMany({
    where: { estado: "PROGRAMADA", programadaPara: { lte: new Date() } },
    orderBy: { programadaPara: "asc" },
    take: MAX_POR_CORRIDA,
    select: { id: true },
  });

  const resultados: { id: string; estado: string }[] = [];
  for (const v of vencidas) {
    // Lock optimista: solo la agarra una corrida (estado PROGRAMADA → BORRADOR interno).
    const lock = await db.bazarPublicacion.updateMany({
      where: { id: v.id, estado: "PROGRAMADA" },
      data: { estado: "BORRADOR" },
    });
    if (lock.count === 0) continue;
    try {
      const pub = await publicarBazarPublicacion(v.id);
      resultados.push({ id: v.id, estado: pub.estado });
    } catch (e) {
      await db.bazarPublicacion.update({
        where: { id: v.id },
        data: { estado: "ERROR", error: e instanceof Error ? e.message : "Error" },
      });
      resultados.push({ id: v.id, estado: "ERROR" });
    }
  }

  return NextResponse.json({ ok: true, procesadas: resultados });
}
