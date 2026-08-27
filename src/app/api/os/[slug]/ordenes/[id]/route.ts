import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { esVidrios, ordenDatos } from "@/lib/vidrios";
import { guardOsApi } from "../../_guard";

/** Cambios de estado de una orden: trabajo (pendiente→colocado) y facturación. */
const schema = z.object({
  estado: z.enum(["PENDIENTE", "CONFIRMADA", "COLOCADO", "ENTREGADO"]).optional(),
  fechaColocacion: z.string().nullable().optional(),
  facturacion: z.enum(["sin_facturar", "a_facturar", "facturada"]).optional(),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await ctx.params;
  const g = await guardOsApi(slug);
  if (g.error) return g.error;
  if (!esVidrios(g.tenant)) return NextResponse.json({ error: "No disponible" }, { status: 404 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Revisá los datos" }, { status: 400 });
  const d = parsed.data;

  const orden = await db.presupuestoDoc.findFirst({ where: { id, clientId: g.tenant.id } });
  if (!orden) return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });

  const datos = ordenDatos(orden);
  const nuevoEstado = d.estado ?? orden.estado;
  const nuevaFecha = d.fechaColocacion !== undefined ? d.fechaColocacion : datos.fechaColocacion;

  // El taller trabaja con UN calendario: confirmar una orden agenda el ingreso
  // como turno; cambiar la fecha lo mueve; entregar/cancelar lo cierra.
  const num = String(orden.numero).padStart(4, "0");
  const titulo = `Colocación #${num} · ${orden.nombre}`;
  const turnoPrevio = await db.appointment.findFirst({
    where: { clientId: g.tenant.id, custom: { path: ["ordenId"], equals: orden.id } },
  });

  if (nuevoEstado === "CONFIRMADA" && nuevaFecha) {
    // El cliente de la orden ya vive en el CRM (se crea al guardarla).
    const contacto = await db.contact.findFirst({
      where: {
        clientId: g.tenant.id,
        OR: [
          { name: { equals: orden.nombre, mode: "insensitive" } },
          ...(orden.telefono ? [{ phone: orden.telefono }] : []),
        ],
      },
      select: { id: true },
    });
    const inicio = new Date(`${nuevaFecha}T09:00:00-03:00`);
    const fin = new Date(inicio.getTime() + 90 * 60000);
    if (turnoPrevio) {
      await db.appointment.update({
        where: { id: turnoPrevio.id },
        data: { startsAt: inicio, endsAt: fin, title: titulo, status: "CONFIRMED" },
      });
    } else {
      await db.appointment.create({
        data: {
          clientId: g.tenant.id,
          contactId: contacto?.id ?? null,
          title: titulo,
          startsAt: inicio,
          endsAt: fin,
          status: "CONFIRMED",
          source: "orden",
          notes: [orden.telefono, (datos.vehiculo?.marca ?? "") + " " + (datos.vehiculo?.modelo ?? "")].filter(Boolean).join(" · "),
          custom: { ordenId: orden.id, numero: orden.numero },
        },
      });
    }
  } else if (turnoPrevio) {
    if (nuevoEstado === "COLOCADO" || nuevoEstado === "ENTREGADO") {
      await db.appointment.update({ where: { id: turnoPrevio.id }, data: { status: "DONE" } });
    } else if (nuevoEstado === "PENDIENTE") {
      await db.appointment.delete({ where: { id: turnoPrevio.id } });
    }
  }

  await db.presupuestoDoc.update({
    where: { id: orden.id },
    data: {
      ...(d.estado ? { estado: d.estado } : {}),
      ...(d.facturacion || d.fechaColocacion !== undefined
        ? {
            datos: {
              ...datos,
              ...(d.facturacion ? { facturacion: d.facturacion } : {}),
              ...(d.fechaColocacion !== undefined ? { fechaColocacion: d.fechaColocacion ?? undefined } : {}),
            },
          }
        : {}),
    },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await ctx.params;
  const g = await guardOsApi(slug);
  if (g.error) return g.error;
  if (!esVidrios(g.tenant)) return NextResponse.json({ error: "No disponible" }, { status: 404 });
  await db.presupuestoDoc.deleteMany({ where: { id, clientId: g.tenant.id } });
  return NextResponse.json({ ok: true });
}
