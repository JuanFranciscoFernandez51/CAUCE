import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guardOsApi } from "../_guard";
import { DATE_RE, TIME_RE } from "@/app/os/[slug]/_lib/dates";

const actionSchema = z.object({
  employeeId: z.string().trim().min(1, "Falta el empleado"),
  action: z.enum(["entrada", "salida"]),
});

// Alta manual de una fichada pasada: día + entrada (+ salida opcional).
const manualSchema = z.object({
  employeeId: z.string().trim().min(1, "Falta el empleado"),
  date: z.string().regex(DATE_RE, "Fecha inválida"),
  in: z.string().regex(TIME_RE, "Hora de entrada inválida"),
  out: z.string().regex(TIME_RE, "Hora de salida inválida").nullable().optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const guard = await guardOsApi(slug, "rrhh");
  if (guard.error) return guard.error;

  const body = await req.json().catch(() => null);

  // Alta manual (viene con "date"): crea la fichada en el día/hora indicados.
  if (body && typeof body === "object" && "date" in body) {
    const manual = manualSchema.safeParse(body);
    if (!manual.success) {
      return NextResponse.json(
        { error: manual.error.issues[0]?.message ?? "Datos inválidos" },
        { status: 400 }
      );
    }
    const { employeeId, date, in: hIn, out: hOut } = manual.data;
    const employee = await db.employee.findFirst({
      where: { id: employeeId, clientId: guard.tenant.id },
      select: { id: true },
    });
    if (!employee) {
      return NextResponse.json({ error: "Empleado no encontrado" }, { status: 404 });
    }
    const clockIn = new Date(`${date}T${hIn}:00-03:00`);
    const clockOut = hOut ? new Date(`${date}T${hOut}:00-03:00`) : null;
    if (clockOut && clockOut <= clockIn) {
      return NextResponse.json(
        { error: "La salida tiene que ser después de la entrada" },
        { status: 400 }
      );
    }
    const entry = await db.timeEntry.create({
      data: {
        clientId: guard.tenant.id,
        employeeId: employee.id,
        clockIn,
        clockOut,
        source: "manual",
      },
    });
    return NextResponse.json({ ok: true, entry }, { status: 201 });
  }

  const parsed = actionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }
  const { employeeId, action } = parsed.data;

  // Verificar que el empleado pertenezca a ESTE tenant (jamás confiar en el body).
  const employee = await db.employee.findFirst({
    where: { id: employeeId, clientId: guard.tenant.id },
    select: { id: true, active: true },
  });
  if (!employee) {
    return NextResponse.json({ error: "Empleado no encontrado" }, { status: 404 });
  }

  const open = await db.timeEntry.findFirst({
    where: { clientId: guard.tenant.id, employeeId: employee.id, clockOut: null },
    orderBy: { clockIn: "desc" },
  });

  if (action === "entrada") {
    if (!employee.active) {
      return NextResponse.json(
        { error: "El empleado está desactivado — reactivalo para fichar" },
        { status: 400 }
      );
    }
    if (open) {
      return NextResponse.json(
        { error: "Ya tiene una entrada abierta — marcá la salida primero" },
        { status: 409 }
      );
    }
    const entry = await db.timeEntry.create({
      data: {
        clientId: guard.tenant.id,
        employeeId: employee.id,
        clockIn: new Date(),
        source: "web",
      },
    });
    return NextResponse.json({ ok: true, entry }, { status: 201 });
  }

  // salida
  if (!open) {
    return NextResponse.json(
      { error: "No tiene ninguna entrada abierta para cerrar" },
      { status: 409 }
    );
  }
  const entry = await db.timeEntry.update({
    where: { id: open.id },
    data: { clockOut: new Date() },
  });
  return NextResponse.json({ ok: true, entry });
}
