import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guardOsApi } from "../../_guard";
import { OPERATIONS, PROPERTY_TYPES, LISTING_STATUS, slugify } from "@/app/os/[slug]/_lib/listings";

const patchSchema = z.object({
  title: z.string().trim().min(1, "El título es obligatorio").max(200).optional(),
  operation: z.enum(OPERATIONS).optional(),
  propertyType: z.enum(PROPERTY_TYPES).optional(),
  status: z.enum(LISTING_STATUS).optional(),
  priceUsd: z.number().nonnegative("El precio no puede ser negativo").nullable().optional(),
  priceArs: z.number().nonnegative("El precio no puede ser negativo").nullable().optional(),
  expensesArs: z.number().nonnegative("Las expensas no pueden ser negativas").nullable().optional(),
  address: z.string().trim().max(300).nullable().optional(),
  neighborhood: z.string().trim().max(120).nullable().optional(),
  city: z.string().trim().max(120).nullable().optional(),
  bedrooms: z.number().int().min(0).nullable().optional(),
  bathrooms: z.number().int().min(0).nullable().optional(),
  areaM2: z.number().nonnegative().nullable().optional(),
  coveredM2: z.number().nonnegative().nullable().optional(),
  description: z.string().trim().max(5000).nullable().optional(),
  amenities: z.array(z.string().trim().min(1).max(60)).max(50).optional(),
  photos: z.array(z.string().trim().url("URL de foto inválida").max(500)).max(40).optional(),
  featured: z.boolean().optional(),
  active: z.boolean().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  const { slug, id } = await params;
  const guard = await guardOsApi(slug, "sitio");
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

  // updateMany scopeado por clientId: imposible tocar propiedades de otro tenant.
  const result = await db.listing.updateMany({
    where: { id, clientId: guard.tenant.id },
    data: {
      ...(d.title !== undefined ? { title: d.title, slug: slugify(d.title) } : {}),
      ...(d.operation !== undefined ? { operation: d.operation } : {}),
      ...(d.propertyType !== undefined ? { propertyType: d.propertyType } : {}),
      ...(d.status !== undefined ? { status: d.status } : {}),
      ...(d.priceUsd !== undefined ? { priceUsd: d.priceUsd } : {}),
      ...(d.priceArs !== undefined ? { priceArs: d.priceArs } : {}),
      ...(d.expensesArs !== undefined ? { expensesArs: d.expensesArs } : {}),
      ...(d.address !== undefined ? { address: d.address || null } : {}),
      ...(d.neighborhood !== undefined ? { neighborhood: d.neighborhood || null } : {}),
      ...(d.city !== undefined ? { city: d.city || null } : {}),
      ...(d.bedrooms !== undefined ? { bedrooms: d.bedrooms } : {}),
      ...(d.bathrooms !== undefined ? { bathrooms: d.bathrooms } : {}),
      ...(d.areaM2 !== undefined ? { areaM2: d.areaM2 } : {}),
      ...(d.coveredM2 !== undefined ? { coveredM2: d.coveredM2 } : {}),
      ...(d.description !== undefined ? { description: d.description || null } : {}),
      ...(d.amenities !== undefined ? { amenities: d.amenities } : {}),
      ...(d.photos !== undefined ? { photos: d.photos } : {}),
      ...(d.featured !== undefined ? { featured: d.featured } : {}),
      ...(d.active !== undefined ? { active: d.active } : {}),
    },
  });
  if (result.count === 0) {
    return NextResponse.json({ error: "Propiedad no encontrada" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  const { slug, id } = await params;
  const guard = await guardOsApi(slug, "sitio");
  if (guard.error) return guard.error;

  const result = await db.listing.deleteMany({
    where: { id, clientId: guard.tenant.id },
  });
  if (result.count === 0) {
    return NextResponse.json({ error: "Propiedad no encontrada" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
