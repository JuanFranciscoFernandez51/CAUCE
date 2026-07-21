import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guardOsApi } from "../../_guard";
import { registrarActividad } from "@/lib/actividad";

const schema = z.object({
  contactos: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(200),
        phone: z.string().trim().max(50).optional().default(""),
        email: z.string().trim().max(200).optional().default(""),
        notes: z.string().trim().max(1000).optional().default(""),
      })
    )
    .min(1)
    .max(1000),
});

/**
 * Importación masiva al CRM (la agenda del cliente, de una).
 * Dedup por teléfono (o por nombre exacto si no hay teléfono):
 * los que ya existen no se duplican, se cuentan aparte.
 */
export async function POST(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const g = await guardOsApi(slug, "crm");
  if (g.error) return g.error;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  // Traemos teléfonos y nombres existentes UNA vez (no un query por fila).
  const existentes = await db.contact.findMany({
    where: { clientId: g.tenant.id },
    select: { phone: true, name: true },
  });
  const telefonos = new Set(existentes.map((c) => c.phone).filter(Boolean));
  const nombres = new Set(existentes.map((c) => c.name.toLowerCase()));

  const aCrear: { name: string; phone: string | null; email: string | null; notes: string | null }[] = [];
  let duplicados = 0;
  const vistosEnLote = new Set<string>();

  for (const c of parsed.data.contactos) {
    const phone = c.phone.trim();
    const clave = phone || c.name.trim().toLowerCase();
    const yaExiste = phone ? telefonos.has(phone) : nombres.has(c.name.trim().toLowerCase());
    if (yaExiste || vistosEnLote.has(clave)) {
      duplicados++;
      continue;
    }
    vistosEnLote.add(clave);
    aCrear.push({
      name: c.name.trim(),
      phone: phone || null,
      email: c.email.trim() || null,
      notes: c.notes.trim() || null,
    });
  }

  if (aCrear.length > 0) {
    await db.contact.createMany({
      data: aCrear.map((c) => ({
        clientId: g.tenant.id,
        ...c,
        source: "importado",
        stage: "nuevo",
      })),
    });
    void registrarActividad(g.tenant.id, "contactos_importados", `${aCrear.length} contactos (${duplicados} duplicados salteados)`);
  }

  return NextResponse.json({ ok: true, creados: aCrear.length, duplicados });
}
