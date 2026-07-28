import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { guard } from "../_utils";

const CLAVE = "agente-leads";

/** Estado del agente nocturno de leads (lo consulta también el script de la Mac). */
export async function GET() {
  const denied = await guard();
  if (denied) return denied;
  const bandera = await db.bandera.findUnique({ where: { clave: CLAVE } });
  return NextResponse.json({ activa: bandera?.activa ?? true });
}

export async function POST(req: Request) {
  const denied = await guard();
  if (denied) return denied;
  const body = (await req.json().catch(() => null)) as { activa?: boolean } | null;
  if (typeof body?.activa !== "boolean") {
    return NextResponse.json({ error: "Falta activa" }, { status: 400 });
  }
  const bandera = await db.bandera.upsert({
    where: { clave: CLAVE },
    update: { activa: body.activa },
    create: { clave: CLAVE, activa: body.activa },
  });
  return NextResponse.json({ activa: bandera.activa });
}
