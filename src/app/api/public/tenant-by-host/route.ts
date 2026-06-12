import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * Resuelve un dominio propio de cliente → slug del tenant.
 * Lo usa el middleware para que cada cliente pueda colgar SU dominio
 * (ej: turnos.tallerfunes.com.ar) sobre su Cauce OS.
 * Solo expone el slug (dato público: es parte de la URL del OS).
 */
export async function GET(req: Request) {
  const host = new URL(req.url).searchParams.get("host")?.toLowerCase().split(":")[0];
  if (!host) return NextResponse.json({ slug: null });
  try {
    const client = await db.client.findFirst({
      where: { domain: host, status: { not: "CHURNED" } },
      select: { slug: true },
    });
    return NextResponse.json(
      { slug: client?.slug ?? null },
      { headers: { "Cache-Control": "public, max-age=300" } }
    );
  } catch {
    return NextResponse.json({ slug: null });
  }
}
