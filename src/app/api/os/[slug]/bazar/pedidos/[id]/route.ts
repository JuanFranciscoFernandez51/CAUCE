import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guardBazarApi } from "../../_guard";
import { marcarPedidoPagado } from "@/lib/bazar-server";
import { PEDIDO_ESTADOS } from "@/lib/bazar";

/**
 * PATCH de un pedido desde Despacho: mover de estado (kanban 1-click o drag)
 * o editar inline seguimiento, teléfono, dirección y notas.
 * Pasar a PAGADO dispara TODOS los efectos
 * (stock, vendidos, cupón, ingreso en Finanzas) vía marcarPedidoPagado.
 */
const schema = z.object({
  estado: z.enum(PEDIDO_ESTADOS).optional(),
  seguimiento: z.string().trim().max(120).nullable().optional(),
  // Edición rápida desde la tarjeta del tablero de reparto.
  telefono: z.string().trim().min(1, "El teléfono no puede quedar vacío").max(40).optional(),
  direccion: z.string().trim().max(200).nullable().optional(),
  notas: z.string().trim().max(500).nullable().optional(),
  /** Si se marca pagado a mano: a qué cuenta entra la plata. */
  medio: z.enum(["mp", "efectivo"]).optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  const { slug, id } = await params;
  const g = await guardBazarApi(slug);
  if (g.error) return g.error;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }
  const d = parsed.data;

  const pedido = await db.bazarPedido.findFirst({ where: { id, clientId: g.tenant.id } });
  if (!pedido) return NextResponse.json({ error: "No existe" }, { status: 404 });

  // Marcar PAGADO (a mano): efectos completos + conexión a Finanzas.
  if (d.estado === "PAGADO" && pedido.estado === "NUEVO") {
    const actualizado = await marcarPedidoPagado({
      clientId: g.tenant.id,
      pedidoId: pedido.id,
      medio: d.medio ?? "mp",
    });
    return NextResponse.json({ ok: true, pedido: actualizado });
  }

  const actualizado = await db.bazarPedido.update({
    where: { id: pedido.id },
    data: {
      ...(d.estado ? { estado: d.estado } : {}),
      ...(d.seguimiento !== undefined ? { seguimiento: d.seguimiento || null } : {}),
      ...(d.telefono ? { telefono: d.telefono } : {}),
      ...(d.direccion !== undefined ? { direccion: d.direccion || null } : {}),
      ...(d.notas !== undefined ? { notas: d.notas || null } : {}),
    },
  });

  return NextResponse.json({ ok: true, pedido: actualizado });
}
