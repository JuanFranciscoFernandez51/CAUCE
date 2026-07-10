import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guardOsApi, cleanCustom } from "../_guard";

const createSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(200),
  priceArs: z.number().nonnegative("El precio no puede ser negativo").nullable().optional(),
  priceUsd: z.number().nonnegative("El precio no puede ser negativo").nullable().optional(),
  stock: z.number().int("El stock debe ser un entero").min(0).optional(),
  minStock: z.number().int("El mínimo debe ser un entero").min(0).optional(),
  talles: z.record(z.string(), z.number().int().min(0)).nullable().optional(),
  photo: z.string().trim().max(500).nullable().optional(),
  active: z.boolean().optional(),
  custom: z.record(z.string(), z.union([z.string(), z.number()])).optional(),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const guard = await guardOsApi(slug, "catalogo");
  if (guard.error) return guard.error;

  const q = new URL(req.url).searchParams.get("q")?.trim();
  const products = await db.product.findMany({
    where: {
      clientId: guard.tenant.id,
      ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
    },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      priceArs: true,
      priceUsd: true,
      stock: true,
      minStock: true,
      photo: true,
      active: true,
      custom: true,
    },
  });
  return NextResponse.json({ products });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const guard = await guardOsApi(slug, "catalogo");
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

  const product = await db.product.create({
    data: {
      clientId: guard.tenant.id,
      name: d.name,
      priceArs: d.priceArs ?? null,
      priceUsd: d.priceUsd ?? null,
      // Con talles cargados, el stock total es la suma de los talles.
      stock: d.talles ? Object.values(d.talles).reduce((a, b) => a + b, 0) : (d.stock ?? 0),
      minStock: d.minStock ?? 0,
      talles: d.talles ?? undefined,
      photo: d.photo || null,
      active: d.active ?? true,
      custom: cleanCustom(d.custom),
    },
  });

  return NextResponse.json({ ok: true, product }, { status: 201 });
}
