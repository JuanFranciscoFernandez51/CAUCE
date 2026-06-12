import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guardOsApi } from "../_guard";

const createSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(200),
  phone: z.string().trim().max(50).optional(),
  role: z.string().trim().max(100).optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const guard = await guardOsApi(slug, "rrhh");
  if (guard.error) return guard.error;

  const employees = await db.employee.findMany({
    where: { clientId: guard.tenant.id },
    orderBy: [{ active: "desc" }, { name: "asc" }],
    select: { id: true, name: true, phone: true, role: true, active: true },
  });
  return NextResponse.json({ employees });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const guard = await guardOsApi(slug, "rrhh");
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

  const employee = await db.employee.create({
    data: {
      clientId: guard.tenant.id,
      name: d.name,
      phone: d.phone || null,
      role: d.role || null,
    },
  });

  return NextResponse.json({ ok: true, employee }, { status: 201 });
}
