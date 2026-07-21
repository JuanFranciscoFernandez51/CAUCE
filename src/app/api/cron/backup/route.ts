import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { storageAvailable, uploadToTenant } from "@/lib/storage";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * BACKUP SEMANAL — vuelca TODAS las tablas a un JSON y lo guarda en
 * Cloudinary (carpeta cauce/sistema/backups). Si un día pasa algo con la
 * DB, hay una foto completa de cada lunes para restaurar.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!storageAvailable()) {
    return NextResponse.json({ error: "Storage sin configurar" }, { status: 503 });
  }

  const models = Prisma.dmmf.datamodel.models.map((m) => m.name);
  const out: Record<string, unknown[]> = {};
  let filas = 0;
  for (const name of models) {
    const key = name.charAt(0).toLowerCase() + name.slice(1);
    const delegate = (db as unknown as Record<string, { findMany?: (a?: object) => Promise<unknown[]> }>)[key];
    if (!delegate?.findMany) continue;
    const rows = await delegate.findMany();
    out[name] = rows;
    filas += rows.length;
  }

  const fecha = new Date().toISOString().slice(0, 10);
  const buffer = Buffer.from(
    JSON.stringify(out, (_k, v) => (typeof v === "bigint" ? v.toString() : v))
  );
  const up = await uploadToTenant({
    slug: "sistema",
    scope: ["backups"],
    buffer,
    originalName: `backup-${fecha}.json`,
  });

  return NextResponse.json({
    ok: true,
    fecha,
    tablas: models.length,
    filas,
    bytes: buffer.length,
    url: up.url,
  });
}
