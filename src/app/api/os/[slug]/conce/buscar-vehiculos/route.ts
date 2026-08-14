import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { guardConceApi } from "../_guard";
import { nombreVehiculo } from "@/lib/conce";

/**
 * Buscador de vehículos para el alta de mandatos, boletos y permutas.
 * Filtra el stock del tenant por marca, modelo, versión o dominio y devuelve
 * los datos que el formulario completa solo.
 *
 * `?stock=1` (default en boletos) deja sólo los disponibles/reservados; los
 * mandatos y las permutas pueden mirar todo el stock.
 */
export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const g = await guardConceApi(slug);
  if (g.error) return g.error;

  const sp = new URL(req.url).searchParams;
  const q = (sp.get("q") ?? "").trim();
  const soloStock = sp.get("stock") === "1";

  const vehiculos = await db.conceVehiculo.findMany({
    where: {
      clientId: g.tenant.id,
      ...(soloStock ? { estado: { in: ["disponible", "reservado"] } } : {}),
      ...(q
        ? {
            OR: [
              { marca: { contains: q, mode: "insensitive" as const } },
              { modelo: { contains: q, mode: "insensitive" as const } },
              { version: { contains: q, mode: "insensitive" as const } },
              { dominio: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {}),
    },
    orderBy: [{ marca: "asc" }, { modelo: "asc" }],
    take: 40,
    select: {
      id: true,
      marca: true,
      modelo: true,
      version: true,
      anio: true,
      km: true,
      dominio: true,
      motor: true,
      precio: true,
      moneda: true,
      estado: true,
    },
  });

  return NextResponse.json({
    vehiculos: vehiculos.map((v) => ({
      id: v.id,
      etiqueta: `${nombreVehiculo(v)} ${v.anio}${v.dominio ? ` — ${v.dominio}` : ""}`,
      marca: v.marca,
      modelo: [v.modelo, v.version].filter(Boolean).join(" "),
      anio: v.anio,
      km: v.km,
      dominio: v.dominio ?? "",
      motor: v.motor ?? "",
      precio: v.precio,
      moneda: v.moneda,
      estado: v.estado,
    })),
  });
}
