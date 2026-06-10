import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guardOsApi, cleanCustom } from "../../_guard";

const patchSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  phone: z.string().trim().max(50).nullable().optional(),
  email: z.string().trim().max(200).nullable().optional(),
  stage: z.string().trim().min(1).max(50).optional(),
  notes: z.string().max(5000).nullable().optional(),
  custom: z.record(z.string(), z.union([z.string(), z.number()])).optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  const { slug, id } = await params;
  const guard = await guardOsApi(slug, "crm");
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

  // updateMany scopeado por clientId: imposible tocar contactos de otro tenant.
  const result = await db.contact.updateMany({
    where: { id, clientId: guard.tenant.id },
    data: {
      ...(d.name !== undefined ? { name: d.name } : {}),
      ...(d.phone !== undefined ? { phone: d.phone || null } : {}),
      ...(d.email !== undefined ? { email: d.email || null } : {}),
      ...(d.stage !== undefined ? { stage: d.stage } : {}),
      ...(d.notes !== undefined ? { notes: d.notes || null } : {}),
      ...(d.custom !== undefined ? { custom: cleanCustom(d.custom) } : {}),
      lastTouchAt: new Date(),
    },
  });
  if (result.count === 0) {
    return NextResponse.json({ error: "Contacto no encontrado" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  const { slug, id } = await params;
  const guard = await guardOsApi(slug, "crm");
  if (guard.error) return guard.error;

  // Las tareas del contacto se borran junto con él; los turnos quedan (contactId → null).
  const [, result] = await db.$transaction([
    db.crmTask.deleteMany({ where: { contactId: id, clientId: guard.tenant.id } }),
    db.contact.deleteMany({ where: { id, clientId: guard.tenant.id } }),
  ]);
  if (result.count === 0) {
    return NextResponse.json({ error: "Contacto no encontrado" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
