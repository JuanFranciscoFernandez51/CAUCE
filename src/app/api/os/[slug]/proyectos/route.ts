import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guardOsApi } from "../_guard";
import { DATE_RE } from "@/app/os/[slug]/_lib/dates";
import {
  PROYECTO_AREAS,
  PROYECTO_STATUSES,
} from "@/app/os/[slug]/_lib/proyectos";

const createSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(200),
  clienteName: z.string().trim().max(200).optional(),
  status: z.enum(PROYECTO_STATUSES).optional(),
  area: z.enum(PROYECTO_AREAS).nullable().optional(),
  budgetUsd: z.number().finite().nonnegative("El presupuesto no puede ser negativo").optional(),
  startDate: z.string().regex(DATE_RE, "Fecha inválida (YYYY-MM-DD)").nullable().optional(),
  dueDate: z.string().regex(DATE_RE, "Fecha inválida (YYYY-MM-DD)").nullable().optional(),
  description: z.string().trim().max(5000).optional(),
});

/** "YYYY-MM-DD" → instante al mediodía ART (fecha estable, sin corrimiento de día). */
function dateToInstant(dateStr: string): Date {
  return new Date(`${dateStr}T12:00:00-03:00`);
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const guard = await guardOsApi(slug, "proyectos");
  if (guard.error) return guard.error;

  const proyectos = await db.proyecto.findMany({
    where: { clientId: guard.tenant.id },
    orderBy: [{ updatedAt: "desc" }],
    select: {
      id: true,
      name: true,
      clienteName: true,
      status: true,
      area: true,
      budgetUsd: true,
      startDate: true,
      dueDate: true,
      description: true,
      _count: { select: { tareas: true } },
    },
  });
  return NextResponse.json({ proyectos });
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

  try {
    const proyecto = await db.proyecto.create({
      data: {
        clientId,
        name: d.name,
        clienteName: d.clienteName || null,
        status: d.status ?? "propuesta",
        area: d.area ?? null,
        budgetUsd: d.budgetUsd ?? null,
        startDate: d.startDate ? dateToInstant(d.startDate) : null,
        dueDate: d.dueDate ? dateToInstant(d.dueDate) : null,
        description: d.description || null,
      },
      select: { id: true },
    });
    return NextResponse.json({ ok: true, proyecto }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "No se pudo crear el proyecto" }, { status: 500 });
  }
}
