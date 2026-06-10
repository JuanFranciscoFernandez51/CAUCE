import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guardOsApi, cleanCustom } from "../_guard";

const createSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(200),
  phone: z.string().trim().max(50).optional(),
  email: z.string().trim().max(200).optional(),
  stage: z.string().trim().max(50).optional(),
  notes: z.string().max(5000).optional(),
  custom: z.record(z.string(), z.union([z.string(), z.number()])).optional(),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const guard = await guardOsApi(slug);
  if (guard.error) return guard.error;

  const q = new URL(req.url).searchParams.get("q")?.trim();
  const contacts = await db.contact.findMany({
    where: {
      clientId: guard.tenant.id,
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { phone: { contains: q } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, phone: true, email: true, stage: true, source: true },
  });
  return NextResponse.json({ contacts });
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

  const contact = await db.contact.create({
    data: {
      clientId: guard.tenant.id,
      name: data.name,
      phone: data.phone || null,
      email: data.email || null,
      stage: data.stage || "nuevo",
      notes: data.notes || null,
      source: "manual",
      custom: cleanCustom(data.custom),
      lastTouchAt: new Date(),
    },
  });

  return NextResponse.json({ ok: true, contact }, { status: 201 });
}
