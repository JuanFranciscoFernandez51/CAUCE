import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guardOsApi } from "../_guard";
import { RECORD_TYPES } from "@/app/os/[slug]/_lib/ficha";

/**
 * Entradas de la ficha/historia de un contacto (ContactRecord + Attachments).
 * SIEMPRE scopeado por clientId; además se verifica que el contacto sea del tenant.
 * Las entradas se ACUMULAN: POST nunca pisa entradas anteriores.
 */

const fieldsSchema = z
  .record(z.string(), z.union([z.string(), z.number()]))
  .optional();

const attachmentSchema = z.object({
  url: z.string().trim().min(1).max(2000),
  publicId: z.string().trim().max(500).optional().nullable(),
  name: z.string().trim().min(1).max(300),
  mime: z.string().trim().max(200).optional().nullable(),
  bytes: z.number().int().nonnegative().optional().nullable(),
});

const createSchema = z.object({
  contactId: z.string().trim().min(1),
  type: z.enum(RECORD_TYPES),
  date: z.string().trim().optional(), // "YYYY-MM-DD" o ISO; default hoy
  title: z.string().trim().max(300).optional().nullable(),
  summary: z.string().trim().max(5000).optional().nullable(),
  fields: fieldsSchema,
  authorId: z.string().trim().min(1).optional().nullable(),
  attachments: z.array(attachmentSchema).max(20).optional(),
});

/** Limpia el objeto de campos del rubro (descarta vacíos). */
function cleanFields(
  fields: Record<string, string | number> | undefined
): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  if (!fields) return out;
  for (const [k, v] of Object.entries(fields)) {
    if (v === "" || v === null || v === undefined) continue;
    out[k] = v;
  }
  return out;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const guard = await guardOsApi(slug, "crm");
  if (guard.error) return guard.error;

  const contactId = new URL(req.url).searchParams.get("contactId")?.trim();
  if (!contactId) {
    return NextResponse.json({ error: "Falta contactId" }, { status: 400 });
  }

  // El contacto debe ser del tenant.
  const contact = await db.contact.findFirst({
    where: { id: contactId, clientId: guard.tenant.id },
    select: { id: true },
  });
  if (!contact) {
    return NextResponse.json({ error: "Contacto no encontrado" }, { status: 404 });
  }

  const records = await db.contactRecord.findMany({
    where: { clientId: guard.tenant.id, contactId },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    include: { attachments: { orderBy: { createdAt: "asc" } } },
  });
  return NextResponse.json({ records });
}

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
  const data = parsed.data;

  // El contacto debe pertenecer al tenant.
  const contact = await db.contact.findFirst({
    where: { id: data.contactId, clientId: guard.tenant.id },
    select: { id: true },
  });
  if (!contact) {
    return NextResponse.json({ error: "Contacto no encontrado" }, { status: 404 });
  }

  // El profesional (si se eligió) también debe ser del tenant.
  let authorId: string | null = null;
  if (data.authorId) {
    const emp = await db.employee.findFirst({
      where: { id: data.authorId, clientId: guard.tenant.id },
      select: { id: true },
    });
    if (!emp) {
      return NextResponse.json({ error: "Profesional no encontrado" }, { status: 400 });
    }
    authorId = emp.id;
  }

  // Fecha: "YYYY-MM-DD" se interpreta a mediodía ART para no correrse de día.
  let date = new Date();
  if (data.date) {
    const d = /^\d{4}-\d{2}-\d{2}$/.test(data.date)
      ? new Date(`${data.date}T12:00:00-03:00`)
      : new Date(data.date);
    if (!Number.isNaN(d.getTime())) date = d;
  }

  const record = await db.contactRecord.create({
    data: {
      clientId: guard.tenant.id,
      contactId: contact.id,
      type: data.type,
      date,
      title: data.title?.trim() || null,
      summary: data.summary?.trim() || null,
      fields: cleanFields(data.fields),
      authorId,
      attachments: data.attachments?.length
        ? {
            create: data.attachments.map((a) => ({
              clientId: guard.tenant.id,
              url: a.url,
              publicId: a.publicId || null,
              name: a.name,
              mime: a.mime || null,
              bytes: a.bytes ?? null,
            })),
          }
        : undefined,
    },
    include: { attachments: true },
  });

  // Cargar una entrada cuenta como contacto con el cliente.
  await db.contact.update({
    where: { id: contact.id },
    data: { lastTouchAt: new Date() },
  });

  return NextResponse.json({ ok: true, record }, { status: 201 });
}
