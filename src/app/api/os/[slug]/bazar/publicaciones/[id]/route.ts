import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guardBazarApi } from "../../_guard";
import { publicarBazarPublicacion } from "@/lib/bazar-ig";

export const maxDuration = 120;

/**
 * Una publicación: reprogramar / editar caption / publicar ya / borrar.
 * PATCH { caption?, programadaPara?, publicarAhora? }
 */
const patchSchema = z.object({
  caption: z.string().trim().min(1).max(2200).optional(),
  programadaPara: z.iso.datetime({ offset: true }).nullable().optional(),
  publicarAhora: z.boolean().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  const { slug, id } = await params;
  const g = await guardBazarApi(slug);
  if (g.error) return g.error;

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }
  const d = parsed.data;

  const pub = await db.bazarPublicacion.findFirst({ where: { id, clientId: g.tenant.id } });
  if (!pub) return NextResponse.json({ error: "No existe" }, { status: 404 });
  if (pub.estado === "PUBLICADA") {
    return NextResponse.json({ error: "Esa publicación ya salió" }, { status: 409 });
  }

  if (d.publicarAhora) {
    if (d.caption) {
      await db.bazarPublicacion.update({ where: { id: pub.id }, data: { caption: d.caption } });
    }
    const resultado = await publicarBazarPublicacion(pub.id);
    return NextResponse.json(
      { ok: resultado.estado === "PUBLICADA", publicacion: resultado },
      { status: resultado.estado === "PUBLICADA" ? 200 : 502 }
    );
  }

  const actualizada = await db.bazarPublicacion.update({
    where: { id: pub.id },
    data: {
      ...(d.caption ? { caption: d.caption } : {}),
      ...(d.programadaPara !== undefined
        ? {
            programadaPara: d.programadaPara ? new Date(d.programadaPara) : null,
            estado: d.programadaPara ? "PROGRAMADA" : "BORRADOR",
            error: null,
          }
        : {}),
    },
  });
  return NextResponse.json({ ok: true, publicacion: actualizada });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  const { slug, id } = await params;
  const g = await guardBazarApi(slug);
  if (g.error) return g.error;

  const borrada = await db.bazarPublicacion.deleteMany({
    where: { id, clientId: g.tenant.id, estado: { not: "PUBLICADA" } },
  });
  if (borrada.count === 0) {
    return NextResponse.json({ error: "No existe o ya está publicada" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
