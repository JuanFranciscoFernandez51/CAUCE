import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guardOsApi } from "../_guard";
import { DATE_RE } from "@/app/os/[slug]/_lib/dates";

const createSchema = z.object({
  contactId: z.string().min(1).optional(),
  title: z.string().trim().min(1, "El título es obligatorio").max(300),
  dueAt: z.string().regex(DATE_RE, "Fecha inválida").optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const guard = await guardOsApi(slug, "crm");
  if (guard.error) return guard.error;

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }
  const d = parsed.data;

  // Si la tarea apunta a un contacto, tiene que ser de ESTE tenant.
  if (d.contactId) {
    const contact = await db.contact.findFirst({
      where: { id: d.contactId, clientId: guard.tenant.id },
      select: { id: true },
    });
    if (!contact) {
      return NextResponse.json({ error: "Contacto no encontrado" }, { status: 404 });
    }
  }

  const task = await db.crmTask.create({
    data: {
      clientId: guard.tenant.id,
      contactId: d.contactId ?? null,
      title: d.title,
      // Fecha límite interpretada como fin de día argentino.
      dueAt: d.dueAt ? new Date(`${d.dueAt}T23:59:59-03:00`) : null,
    },
  });

  return NextResponse.json({ ok: true, task }, { status: 201 });
}
