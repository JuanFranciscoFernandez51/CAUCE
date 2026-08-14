import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guardOsApi } from "../../_guard";

/**
 * Configuración editable del negocio (patrón Jess): todo lo que vive en
 * settings se corrige desde adentro, sin pasar por nosotros.
 */
const plantillaSchema = z.object({
  precio: z.number().min(0),
  moneda: z.string().max(10),
  servicios: z.array(z.object({ nombre: z.string().trim().min(1).max(200), items: z.array(z.string().trim().min(1).max(300)).max(30) })).max(20),
  nota: z.string().trim().max(2000).optional().default(""),
});

const schema = z.object({
  displayName: z.string().trim().min(1).max(120).optional(),
  eslogan: z.string().trim().max(200).optional(),
  email: z.string().trim().max(200).optional(),
  telefono: z.string().trim().max(50).optional(),
  cuit: z.string().trim().max(30).optional(),
  instagram: z.string().trim().max(80).optional(),
  direccion: z.string().trim().max(300).optional(),
  tiposEvento: z.array(z.string().trim().min(1).max(60)).max(30).optional(),
  categoriasProveedores: z.array(z.string().trim().min(1).max(60)).max(40).optional(),
  categoriasGastos: z.array(z.string().trim().min(1).max(60)).max(40).optional(),
  plantillaCotizacion: plantillaSchema.optional(),
});

export async function PUT(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const g = await guardOsApi(slug);
  if (g.error) return g.error;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Revisá los datos" }, { status: 400 });
  const d = parsed.data;

  const branding = (g.tenant!.branding as Record<string, unknown> | null) ?? {};
  const settings = (g.tenant!.settings as Record<string, unknown> | null) ?? {};

  await db.client.update({
    where: { id: g.tenant!.id },
    data: {
      ...(d.telefono !== undefined ? { whatsapp: d.telefono } : {}),
      ...(d.email !== undefined ? { email: d.email || null } : {}),
      branding: { ...branding, ...(d.displayName !== undefined ? { displayName: d.displayName } : {}) },
      settings: {
        ...settings,
        ...(d.eslogan !== undefined ? { eslogan: d.eslogan } : {}),
        ...(d.cuit !== undefined ? { cuit: d.cuit } : {}),
        ...(d.instagram !== undefined ? { instagram: d.instagram.replace(/^@/, "") } : {}),
        ...(d.direccion !== undefined ? { direccion: d.direccion } : {}),
        ...(d.tiposEvento !== undefined ? { tiposEvento: d.tiposEvento } : {}),
        ...(d.categoriasProveedores !== undefined ? { categoriasProveedores: d.categoriasProveedores } : {}),
        ...(d.categoriasGastos !== undefined ? { categoriasGastos: d.categoriasGastos } : {}),
        ...(d.plantillaCotizacion !== undefined ? { plantillaCotizacion: d.plantillaCotizacion } : {}),
      },
    },
  });
  return NextResponse.json({ ok: true });
}
