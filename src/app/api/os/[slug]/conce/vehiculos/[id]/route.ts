import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guardConceApi } from "../../_guard";

/** Edición (inline y form) + borrado de un vehículo. Todo scopeado por tenant. */

const patchSchema = z
  .object({
    marca: z.string().trim().min(1).max(80),
    modelo: z.string().trim().min(1).max(120),
    version: z.string().trim().max(120).nullable(),
    anio: z.number().int().min(1950).max(2030),
    km: z.number().int().min(0),
    precio: z.number().min(0).nullable(),
    moneda: z.enum(["ARS", "USD"]),
    condicion: z.enum(["0km", "usado"]),
    tipo: z.string().trim().min(1).max(60),
    transmision: z.string().trim().max(60).nullable(),
    combustible: z.string().trim().max(60).nullable(),
    color: z.string().trim().max(60).nullable(),
    motor: z.string().trim().max(80).nullable(),
    dominio: z.string().trim().max(20).nullable(),
    descripcion: z.string().trim().max(6000).nullable(),
    destacado: z.boolean(),
    oferta: z.boolean(),
    estado: z.enum(["disponible", "reservado", "vendido"]),
    publicado: z.boolean(),
    fotos: z.array(z.string().url()).max(40),
  })
  .partial();

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  const { slug, id } = await params;
  const g = await guardConceApi(slug);
  if (g.error) return g.error;

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }
  const d = parsed.data;

  const existe = await db.conceVehiculo.findFirst({
    where: { id, clientId: g.tenant.id },
    select: { id: true },
  });
  if (!existe) return NextResponse.json({ error: "No existe" }, { status: 404 });

  // Normalizar: precio 0 → null ("Consultar precio"); strings vacíos → null.
  const data: Record<string, unknown> = { ...d };
  if ("precio" in d) data.precio = d.precio && d.precio > 0 ? d.precio : null;
  for (const k of ["version", "transmision", "combustible", "color", "motor", "dominio", "descripcion"] as const) {
    if (k in d && d[k] === "") data[k] = null;
  }

  const vehiculo = await db.conceVehiculo.update({ where: { id }, data });
  return NextResponse.json({ ok: true, vehiculo });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  const { slug, id } = await params;
  const g = await guardConceApi(slug);
  if (g.error) return g.error;

  const existe = await db.conceVehiculo.findFirst({
    where: { id, clientId: g.tenant.id },
    select: { id: true },
  });
  if (!existe) return NextResponse.json({ error: "No existe" }, { status: 404 });

  await db.conceVehiculo.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
