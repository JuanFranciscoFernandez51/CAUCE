import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guardOsApi } from "../../_guard";
import { DATE_RE } from "@/app/os/[slug]/_lib/dates";
import {
  PROYECTO_AREAS,
  PROYECTO_STATUSES,
} from "@/app/os/[slug]/_lib/proyectos";

const patchSchema = z.object({
  name: z.string().trim().min(1, "El nombre no puede quedar vacío").max(200).optional(),
  clienteName: z.string().trim().max(200).nullable().optional(),
  status: z.enum(PROYECTO_STATUSES).optional(),
  area: z.enum(PROYECTO_AREAS).nullable().optional(),
  budgetUsd: z.number().finite().nonnegative("El presupuesto no puede ser negativo").nullable().optional(),
  startDate: z.string().regex(DATE_RE, "Fecha inválida (YYYY-MM-DD)").nullable().optional(),
  dueDate: z.string().regex(DATE_RE, "Fecha inválida (YYYY-MM-DD)").nullable().optional(),
  description: z.string().trim().max(5000).nullable().optional(),
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

  const result = await db.proyecto.updateMany({
    where: { id, clientId },
    data: {
      ...(d.name !== undefined ? { name: d.name } : {}),
      ...(d.clienteName !== undefined ? { clienteName: d.clienteName || null } : {}),
      ...(d.status !== undefined ? { status: d.status } : {}),
      ...(d.area !== undefined ? { area: d.area } : {}),
      ...(d.budgetUsd !== undefined ? { budgetUsd: d.budgetUsd } : {}),
      ...(d.startDate !== undefined
        ? { startDate: d.startDate ? dateToInstant(d.startDate) : null }
        : {}),
      ...(d.dueDate !== undefined
        ? { dueDate: d.dueDate ? dateToInstant(d.dueDate) : null }
        : {}),
      ...(d.description !== undefined ? { description: d.description || null } : {}),
    },
  });
  if (result.count === 0) {
    return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 });
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

  // Las tareas se borran en cascada (onDelete: Cascade en el schema).
  const result = await db.proyecto.deleteMany({
    where: { id, clientId: guard.tenant.id },
  });
  if (result.count === 0) {
    return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
