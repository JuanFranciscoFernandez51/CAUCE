import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guardOsApi } from "../../_guard";

const itemSchema = z.object({
  descripcion: z.string().trim().min(1).max(300),
  cantidad: z.number().int().min(1).max(10000),
  precioArs: z.number().min(0).max(1_000_000_000),
  tipo: z.enum(["repuesto", "mano_obra"]),
});

const patchSchema = z.object({
  estado: z
    .enum(["INGRESADA", "EN_DIAGNOSTICO", "APROBADA", "EN_REPARACION", "LISTA", "ENTREGADA", "CANCELADA"])
    .optional(),
  diagnostico: z.string().max(5000).nullable().optional(),
  trabajos: z.string().max(5000).nullable().optional(),
  items: z.array(itemSchema).optional(),
  pagadoArs: z.number().min(0).max(1_000_000_000).optional(),
});

/** Edita una OT: estado, diagnóstico, trabajos, items (recalcula total), pagos. */
export async function PATCH(req: Request, ctx: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await ctx.params;
  const g = await guardOsApi(slug, "taller");
  if (g.error) return g.error;

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }
  const d = parsed.data;

  const ot = await db.ordenTrabajo.findFirst({
    where: { id, clientId: g.tenant.id },
    include: { contact: { select: { name: true, phone: true } } },
  });
  if (!ot) return NextResponse.json({ error: "No existe" }, { status: 404 });

  const totalArs = d.items
    ? d.items.reduce((s, i) => s + i.cantidad * i.precioArs, 0)
    : undefined;

  const updated = await db.ordenTrabajo.update({
    where: { id: ot.id },
    data: {
      ...(d.estado !== undefined ? { estado: d.estado } : {}),
      ...(d.estado === "ENTREGADA" ? { entregadaAt: new Date() } : {}),
      ...(d.diagnostico !== undefined ? { diagnostico: d.diagnostico || null } : {}),
      ...(d.trabajos !== undefined ? { trabajos: d.trabajos || null } : {}),
      ...(d.items !== undefined ? { items: d.items, totalArs } : {}),
      ...(d.pagadoArs !== undefined ? { pagadoArs: d.pagadoArs } : {}),
    },
  });

  // Pasó a LISTA → aviso automático al cliente con el WhatsApp armado.
  if (d.estado === "LISTA" && ot.estado !== "LISTA" && ot.contact) {
    const hoy = new Date().toLocaleDateString("en-CA", { timeZone: "America/Argentina/Buenos_Aires" });
    const saldo = updated.totalArs - updated.pagadoArs;
    const saldoTxt = saldo > 0 ? ` Total: $${Math.round(updated.totalArs).toLocaleString("es-AR")}.` : "";
    await db.outreachTarea
      .create({
        data: {
          clientId: g.tenant.id,
          tipo: "trabajo-listo",
          contactId: ot.contactId,
          nombre: ot.contact.name,
          telefono: ot.contact.phone,
          mensaje: `Hola ${ot.contact.name.split(" ")[0]}! Tu ${ot.equipo} ya está lista para retirar 🙌${saldoTxt} Te esperamos.`,
          fechaProgramada: hoy,
        },
      })
      .catch(() => undefined);
  }

  return NextResponse.json({ ok: true });
}
