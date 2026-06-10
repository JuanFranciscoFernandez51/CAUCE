import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guardOsApi } from "../../_guard";

const patchSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "CANCELLED", "DONE"]).optional(),
  title: z.string().trim().min(1).max(200).optional(),
  notes: z.string().max(5000).nullable().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  const { slug, id } = await params;
  const guard = await guardOsApi(slug, "turnos");
  if (guard.error) return guard.error;

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }
  const d = parsed.data;

  const result = await db.appointment.updateMany({
    where: { id, clientId: guard.tenant.id },
    data: {
      ...(d.status !== undefined ? { status: d.status } : {}),
      ...(d.title !== undefined ? { title: d.title } : {}),
      ...(d.notes !== undefined ? { notes: d.notes || null } : {}),
    },
  });
  if (result.count === 0) {
    return NextResponse.json({ error: "Turno no encontrado" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  const { slug, id } = await params;
  const guard = await guardOsApi(slug, "turnos");
  if (guard.error) return guard.error;

  const result = await db.appointment.deleteMany({
    where: { id, clientId: guard.tenant.id },
  });
  if (result.count === 0) {
    return NextResponse.json({ error: "Turno no encontrado" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
