import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guardHook } from "../_guard";
import { argDateStr } from "@/app/os/[slug]/_lib/dates";

const leadSchema = z.object({
  nombre: z.string().trim().min(1, "nombre es obligatorio").max(200),
  telefono: z.string().trim().min(1, "telefono es obligatorio").max(50),
  consulta: z.string().trim().max(5000).optional(),
});

/**
 * POST /api/hooks/[slug]/lead — el bot FAQ carga un lead directo al CRM del tenant.
 * Crea o actualiza el Contact por teléfono (source "bot") y agrega la consulta como nota.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const guard = await guardHook(req, slug, "crm");
  if (guard.error) return guard.error;
  const tenant = guard.tenant;

  const body = await req.json().catch(() => null);
  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }
  const d = parsed.data;

  const now = new Date();
  const notaBot = d.consulta ? `[bot ${argDateStr(now)}] ${d.consulta}` : null;

  const existing = await db.contact.findFirst({
    where: { clientId: tenant.id, phone: d.telefono },
  });

  let contactId: string;
  if (existing) {
    const updated = await db.contact.update({
      where: { id: existing.id },
      data: {
        lastTouchAt: now,
        ...(notaBot
          ? { notes: existing.notes ? `${existing.notes}\n${notaBot}` : notaBot }
          : {}),
      },
    });
    contactId = updated.id;
  } else {
    const created = await db.contact.create({
      data: {
        clientId: tenant.id,
        name: d.nombre,
        phone: d.telefono,
        source: "bot",
        stage: "nuevo",
        notes: notaBot,
        lastTouchAt: now,
      },
    });
    contactId = created.id;
  }

  return NextResponse.json({ ok: true, contactId }, { status: 201 });
}
