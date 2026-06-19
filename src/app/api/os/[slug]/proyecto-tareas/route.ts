import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guardOsApi } from "../_guard";
import { DATE_RE } from "@/app/os/[slug]/_lib/dates";
import { TAREA_STATUSES } from "@/app/os/[slug]/_lib/proyectos";

const createSchema = z.object({
  proyectoId: z.string().trim().min(1, "Falta el proyecto"),
  title: z.string().trim().min(1, "El título es obligatorio").max(200),
  status: z.enum(TAREA_STATUSES).optional(),
  assigneeId: z.string().trim().min(1).nullable().optional(),
  dueAt: z.string().regex(DATE_RE, "Fecha inválida (YYYY-MM-DD)").nullable().optional(),
  hours: z.number().finite().nonnegative("Las horas no pueden ser negativas").nullable().optional(),
});

function dateToInstant(dateStr: string): Date {
  return new Date(`${dateStr}T12:00:00-03:00`);
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const guard = await guardOsApi(slug, "proyectos");
  if (guard.error) return guard.error;

  const proyectoId = new URL(req.url).searchParams.get("proyectoId");

  const tareas = await db.proyectoTarea.findMany({
    where: {
      clientId: guard.tenant.id,
      ...(proyectoId ? { proyectoId } : {}),
    },
    orderBy: [{ orderIdx: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      proyectoId: true,
      title: true,
      status: true,
      assigneeId: true,
      dueAt: true,
      hours: true,
      orderIdx: true,
    },
  });
  return NextResponse.json({ tareas });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const guard = await guardOsApi(slug, "proyectos");
  if (guard.error) return guard.error;
  const clientId = guard.tenant.id;

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }
  const d = parsed.data;

  // El proyecto tiene que ser de este tenant.
  const proyecto = await db.proyecto.findFirst({
    where: { id: d.proyectoId, clientId },
    select: { id: true },
  });
  if (!proyecto) {
    return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 });
  }

  // El responsable (si viene) tiene que ser un Employee del tenant.
  if (d.assigneeId) {
    const employee = await db.employee.findFirst({
      where: { id: d.assigneeId, clientId },
      select: { id: true },
    });
    if (!employee) {
      return NextResponse.json({ error: "Responsable no encontrado" }, { status: 404 });
    }
  }

  // orderIdx: al final de su columna.
  const status = d.status ?? "pendiente";
  const last = await db.proyectoTarea.findFirst({
    where: { clientId, proyectoId: d.proyectoId, status },
    orderBy: { orderIdx: "desc" },
    select: { orderIdx: true },
  });

  try {
    const tarea = await db.proyectoTarea.create({
      data: {
        clientId,
        proyectoId: d.proyectoId,
        title: d.title,
        status,
        assigneeId: d.assigneeId ?? null,
        dueAt: d.dueAt ? dateToInstant(d.dueAt) : null,
        hours: d.hours ?? null,
        orderIdx: (last?.orderIdx ?? -1) + 1,
      },
      select: {
        id: true,
        proyectoId: true,
        title: true,
        status: true,
        assigneeId: true,
        dueAt: true,
        hours: true,
        orderIdx: true,
      },
    });
    return NextResponse.json({ ok: true, tarea }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "No se pudo crear la tarea" }, { status: 500 });
  }
}
