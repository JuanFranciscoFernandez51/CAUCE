import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guardOsApi } from "../../_guard";
import { DATE_RE } from "@/app/os/[slug]/_lib/dates";

const patchSchema = z.object({
  title: z.string().trim().min(1).max(300).optional(),
  done: z.boolean().optional(),
  dueAt: z.string().regex(DATE_RE).nullable().optional(),
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

  const result = await db.crmTask.updateMany({
    where: { id, clientId: guard.tenant.id },
    data: {
      ...(d.title !== undefined ? { title: d.title } : {}),
      ...(d.done !== undefined ? { done: d.done } : {}),
      ...(d.dueAt !== undefined
        ? { dueAt: d.dueAt ? new Date(`${d.dueAt}T23:59:59-03:00`) : null }
        : {}),
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
  const guard = await guardOsApi(slug, "crm");
  if (guard.error) return guard.error;

  const result = await db.crmTask.deleteMany({ where: { id, clientId: guard.tenant.id } });
  if (result.count === 0) {
    return NextResponse.json({ error: "Tarea no encontrada" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
