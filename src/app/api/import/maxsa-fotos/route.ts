import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * Recibe el mapa {sku: idDeImagen} del catálogo de Maxsa.
 *
 * El catálogo del proveedor sólo se ve con su sesión iniciada, así que el
 * recorrido se hace desde el navegador de Luis y el resultado se manda acá.
 * Endpoint temporal de importación: protegido por token y sin datos sensibles.
 */
const TOKEN = process.env.IMPORT_TOKEN ?? "fr-maxsa-2026";
const BASE = "https://changomax.mercomaxsa.com.ar/prestashop";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, x-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: cors });
}

export async function POST(req: Request) {
  if (req.headers.get("x-token") !== TOKEN)
    return NextResponse.json({ error: "token" }, { status: 401, headers: cors });

  const { mapa } = (await req.json()) as { mapa: Record<string, string> };
  if (!mapa || typeof mapa !== "object")
    return NextResponse.json({ error: "falta mapa" }, { status: 400, headers: cors });

  const tenant = await db.client.findUnique({ where: { slug: "fernandezrepuestos" } });
  if (!tenant) return NextResponse.json({ error: "tenant" }, { status: 404, headers: cors });

  const prods = await db.bazarProducto.findMany({
    where: { clientId: tenant.id, sku: { in: Object.keys(mapa) } },
    select: { id: true, sku: true },
  });

  let ok = 0;
  for (const p of prods) {
    const id = mapa[p.sku!];
    if (!id || id === "0") continue;
    await db.bazarProducto.update({
      where: { id: p.id },
      data: { fotos: [`${BASE}/${id}-large_default/f.jpg`] },
    });
    ok++;
  }
  return NextResponse.json({ recibidos: Object.keys(mapa).length, actualizados: ok }, { headers: cors });
}
