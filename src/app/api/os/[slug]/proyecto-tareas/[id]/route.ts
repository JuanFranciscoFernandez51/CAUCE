import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guardOsApi } from "../../_guard";
import { DATE_RE } from "@/app/os/[slug]/_lib/dates";
import { TAREA_STATUSES } from "@/app/os/[slug]/_lib/proyectos";

const patchSchema = z.object({
  title: z.string().trim().min(1, "El título no puede quedar vacío").max(200).optional(),
  status: z.enum(TAREA_STATUSES).optional(),
  // null = sacar responsable; string = asignar (se valida que sea del tenant).
  assigneeId: z.string().trim().min(1).nullable().optional(),
  dueAt: z.string().regex(DATE_RE, "Fecha inválida (YYYY-MM-DD)").nullable().optional(),
  hours: z.number().finite().nonnegative("Las horas no pueden ser negativas").nullable().optional(),
});

function dateToInstant(dateStr: string): Date {
  return new Date(`${dateStr}T12:00:00-03:00`);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  const { slug, id } = await params;
  const guard = await guardOsApi(slug, "proyectos");
  if (guard.error) return guard.error;
  const clientId = guard.tenant.id;

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }
  const d = parsed.data;

  // La tarea tiene que existir y ser del tenant.
  const current = await db.proyectoTarea.findFirst({
    where: { id, clientId },
    select: { id: true, proyectoId: true, status: true },
  });
  if (!current) {
    return NextResponse.json({ error: "Tarea no encontrada" }, { status: 404 });
  }

  // Responsable: null lo saca, string lo asigna validando que sea del tenant.
  let nextAssignee: string | null | undefined;
  if (d.assigneeId !== undefined) {
    if (d.assigneeId === null) {
      nextAssignee = null;
    } else {
      const employee = await db.employee.findFirst({
        where: { id: d.assigneeId, clientId },
        select: { id: true },
      });
      if (!employee) {
        return NextResponse.json({ error: "Responsable no encontrado" }, { status: 404 });
      }
      nextAssignee = employee.id;
    }
  }

  // Si cambia de columna (status), va al final de la nueva columna.
  let nextOrderIdx: number | undefined;
  if (d.status !== undefined && d.status !== current.status) {
    const last = await db.proyectoTarea.findFirst({
      where: { clientId, proyectoId: current.proyectoId, status: d.status },
      orderBy: { orderIdx: "desc" },
      select: { orderIdx: true },
    });
    nextOrderIdx = (last?.orderIdx ?? -1) + 1;
  }

  const result = await db.proyectoTarea.updateMany({
    where: { id, clientId },
    data: {
      ...(d.title !== undefined ? { title: d.title } : {}),
      ...(d.status !== undefined ? { status: d.status } : {}),
      ...(nextOrderIdx !== undefined ? { orderIdx: nextOrderIdx } : {}),
      ...(nextAssignee !== undefined ? { assigneeId: nextAssignee } : {}),
      ...(d.dueAt !== undefined ? { dueAt: d.dueAt ? dateToInstant(d.dueAt) : null } : {}),
      ...(d.hours !== undefined ? { hours: d.hours } : {}),
    },
  });
  if (result.count === 0) {
    return NextResponse.json({ error: "Tarea no encontrada" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  const { slug, id } = await params;
  const guard = await guardOsApi(slug, "proyectos");
  if (guard.error) return guard.error;

  const result = await db.proyectoTarea.deleteMany({
    where: { id, clientId: guard.tenant.id },
  });
  if (result.count === 0) {
    return NextResponse.json({ error: "Tarea no encontrada" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
