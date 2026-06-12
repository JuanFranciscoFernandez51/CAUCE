import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guardOsApi, cleanCustom } from "../../_guard";

const patchSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(200).optional(),
  priceArs: z.number().nonnegative("El precio no puede ser negativo").nullable().optional(),
  priceUsd: z.number().nonnegative("El precio no puede ser negativo").nullable().optional(),
  stock: z.number().int("El stock debe ser un entero").min(0).optional(),
  minStock: z.number().int("El mínimo debe ser un entero").min(0).optional(),
  photo: z.string().trim().max(500).nullable().optional(),
  active: z.boolean().optional(),
  custom: z.record(z.string(), z.union([z.string(), z.number()])).optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  const { slug, id } = await params;
  const guard = await guardOsApi(slug, "catalogo");
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

  // updateMany scopeado por clientId: imposible tocar productos de otro tenant.
  const result = await db.product.updateMany({
    where: { id, clientId: guard.tenant.id },
    data: {
      ...(d.name !== undefined ? { name: d.name } : {}),
      ...(d.priceArs !== undefined ? { priceArs: d.priceArs } : {}),
      ...(d.priceUsd !== undefined ? { priceUsd: d.priceUsd } : {}),
      ...(d.stock !== undefined ? { stock: d.stock } : {}),
      ...(d.minStock !== undefined ? { minStock: d.minStock } : {}),
      ...(d.photo !== undefined ? { photo: d.photo || null } : {}),
      ...(d.active !== undefined ? { active: d.active } : {}),
      ...(d.custom !== undefined ? { custom: cleanCustom(d.custom) } : {}),
    },
  });
  if (result.count === 0) {
    return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  const { slug, id } = await params;
  const guard = await guardOsApi(slug, "catalogo");
  if (guard.error) return guard.error;

  const result = await db.product.deleteMany({
    where: { id, clientId: guard.tenant.id },
  });
  if (result.count === 0) {
    return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
