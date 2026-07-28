import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guardConceApi } from "../../_guard";

/** Editar / marcar publicada / borrar una publicación IG-ML. */

const patchSchema = z
  .object({
    caption: z.string().trim().min(1).max(4000),
    programadaPara: z.string().trim().nullable(),
    estado: z.enum(["BORRADOR", "PROGRAMADA", "PUBLICADA", "ERROR"]),
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

  const existe = await db.concePublicacion.findFirst({
    where: { id, clientId: g.tenant.id },
    select: { id: true },
  });
  if (!existe) return NextResponse.json({ error: "No existe" }, { status: 404 });

  const publicacion = await db.concePublicacion.update({
    where: { id },
    data: {
      ...(d.caption !== undefined ? { caption: d.caption } : {}),
      ...(d.programadaPara !== undefined
        ? { programadaPara: d.programadaPara ? new Date(d.programadaPara) : null }
        : {}),
      ...(d.estado !== undefined
        ? { estado: d.estado, ...(d.estado === "PUBLICADA" ? { publicadaEn: new Date() } : {}) }
        : {}),
    },
  });
  return NextResponse.json({ ok: true, publicacion });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  const { slug, id } = await params;
  const g = await guardConceApi(slug);
  if (g.error) return g.error;

  const existe = await db.concePublicacion.findFirst({
    where: { id, clientId: g.tenant.id },
    select: { id: true },
  });
  if (!existe) return NextResponse.json({ error: "No existe" }, { status: 404 });

  await db.concePublicacion.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
