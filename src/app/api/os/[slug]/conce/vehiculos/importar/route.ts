import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guardConceApi } from "../../_guard";
import { slugUnicoVehiculo } from "@/lib/conce-server";
import { nombreVehiculo } from "@/lib/conce";

/**
 * Import masivo de vehículos desde CSV (el parseo se hace en el cliente y
 * acá llegan filas ya estructuradas). Máx 200 filas por tanda.
 */

const filaSchema = z.object({
  marca: z.string().trim().min(1).max(80),
  modelo: z.string().trim().min(1).max(120),
  version: z.string().trim().max(120).optional().default(""),
  anio: z.coerce.number().int().min(1950).max(2030),
  km: z.coerce.number().int().min(0).default(0),
  precio: z.coerce.number().min(0).optional().default(0),
  moneda: z.enum(["ARS", "USD"]).optional().default("ARS"),
  condicion: z.enum(["0km", "usado"]).optional().default("usado"),
  tipo: z.string().trim().max(60).optional().default("sedan"),
  transmision: z.string().trim().max(60).optional().default(""),
  combustible: z.string().trim().max(60).optional().default(""),
  color: z.string().trim().max(60).optional().default(""),
  dominio: z.string().trim().max(20).optional().default(""),
  descripcion: z.string().trim().max(6000).optional().default(""),
});

const schema = z.object({ filas: z.array(filaSchema).min(1).max(200) });

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const g = await guardConceApi(slug);
  if (g.error) return g.error;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "CSV inválido" },
      { status: 400 }
    );
  }

  let creados = 0;
  for (const f of parsed.data.filas) {
    await db.conceVehiculo.create({
      data: {
        clientId: g.tenant.id,
        slug: await slugUnicoVehiculo(db, g.tenant.id, `${nombreVehiculo(f)} ${f.anio}`),
        marca: f.marca,
        modelo: f.modelo,
        version: f.version || null,
        anio: f.anio,
        km: f.km,
        precio: f.precio > 0 ? f.precio : null,
        moneda: f.moneda,
        condicion: f.condicion,
        tipo: f.tipo || "sedan",
        transmision: f.transmision || null,
        combustible: f.combustible || null,
        color: f.color || null,
        dominio: f.dominio || null,
        descripcion: f.descripcion || null,
        fotos: [],
      },
    });
    creados++;
  }

  return NextResponse.json({ ok: true, creados }, { status: 201 });
}
