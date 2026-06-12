import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guardOsApi } from "../../_guard";

const patchSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(200).optional(),
  phone: z.string().trim().max(50).nullable().optional(),
  role: z.string().trim().max(100).nullable().optional(),
  active: z.boolean().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  const { slug, id } = await params;
  const guard = await guardOsApi(slug, "rrhh");
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

  // updateMany scopeado por clientId: imposible tocar empleados de otro tenant.
  const result = await db.employee.updateMany({
    where: { id, clientId: guard.tenant.id },
    data: {
      ...(d.name !== undefined ? { name: d.name } : {}),
      ...(d.phone !== undefined ? { phone: d.phone || null } : {}),
      ...(d.role !== undefined ? { role: d.role || null } : {}),
      ...(d.active !== undefined ? { active: d.active } : {}),
    },
  });
  if (result.count === 0) {
    return NextResponse.json({ error: "Empleado no encontrado" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
