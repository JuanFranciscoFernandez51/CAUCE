import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guardOsApi } from "../_guard";
import { TIME_RE } from "@/app/os/[slug]/_lib/dates";

const putSchema = z.object({
  blocks: z
    .array(
      z.object({
        weekday: z.number().int().min(0).max(6),
        startTime: z.string().regex(TIME_RE, "Hora de inicio inválida"),
        endTime: z.string().regex(TIME_RE, "Hora de fin inválida"),
        slotMinutes: z.number().int().min(5).max(480),
      })
    )
    .max(20),
});

/** Reemplaza TODA la disponibilidad semanal del tenant (delete + createMany en transacción). */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const guard = await guardOsApi(slug, "turnos");
  if (guard.error) return guard.error;
  const tenant = guard.tenant;

  const body = await req.json().catch(() => null);
  const parsed = putSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  for (const b of parsed.data.blocks) {
    if (b.endTime <= b.startTime) {
      return NextResponse.json(
        { error: "Cada franja tiene que terminar después de empezar" },
        { status: 400 }
      );
    }
  }

  await db.$transaction([
    db.availability.deleteMany({ where: { clientId: tenant.id } }),
    db.availability.createMany({
      data: parsed.data.blocks.map((b) => ({ ...b, clientId: tenant.id })),
    }),
  ]);

  return NextResponse.json({ ok: true, count: parsed.data.blocks.length });
}
