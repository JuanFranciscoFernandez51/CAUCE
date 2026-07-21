import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guardOsApi } from "../../_guard";
import { DATE_RE, TIME_RE } from "@/app/os/[slug]/_lib/dates";

const patchSchema = z.object({
  date: z.string().regex(DATE_RE, "Fecha inválida"),
  in: z.string().regex(TIME_RE, "Hora de entrada inválida"),
  out: z.string().regex(TIME_RE, "Hora de salida inválida").nullable(),
});

/** Corrige una fichada: día + hora de entrada/salida (en hora argentina). */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  const { slug, id } = await params;
  const guard = await guardOsApi(slug, "rrhh");
  if (guard.error) return guard.error;

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }
  const { date, in: hIn, out: hOut } = parsed.data;

  const entry = await db.timeEntry.findFirst({
    where: { id, clientId: guard.tenant.id },
    select: { id: true },
  });
  if (!entry) {
    return NextResponse.json({ error: "Fichada no encontrada" }, { status: 404 });
  }

  const clockIn = new Date(`${date}T${hIn}:00-03:00`);
  const clockOut = hOut ? new Date(`${date}T${hOut}:00-03:00`) : null;
  if (clockOut && clockOut <= clockIn) {
    return NextResponse.json(
      { error: "La salida tiene que ser después de la entrada" },
      { status: 400 }
    );
  }

  const updated = await db.timeEntry.update({
    where: { id: entry.id },
    data: { clockIn, clockOut, source: "manual" },
  });
  return NextResponse.json({ ok: true, entry: updated });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  const { slug, id } = await params;
  const guard = await guardOsApi(slug, "rrhh");
  if (guard.error) return guard.error;

  const entry = await db.timeEntry.findFirst({
    where: { id, clientId: guard.tenant.id },
    select: { id: true },
  });
  if (!entry) {
    return NextResponse.json({ error: "Fichada no encontrada" }, { status: 404 });
  }

  await db.timeEntry.delete({ where: { id: entry.id } });
  return NextResponse.json({ ok: true });
}
