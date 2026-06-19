import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guardOsApi } from "../_guard";
import { OPERATIONS, PROPERTY_TYPES, LISTING_STATUS, slugify } from "@/app/os/[slug]/_lib/listings";

const baseSchema = {
  title: z.string().trim().min(1, "El título es obligatorio").max(200),
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
};

const createSchema = z.object(baseSchema);

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const guard = await guardOsApi(slug, "sitio");
  if (guard.error) return guard.error;

  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim();
  const operation = url.searchParams.get("operation")?.trim();
  const propertyType = url.searchParams.get("type")?.trim();

  const listings = await db.listing.findMany({
    where: {
      clientId: guard.tenant.id,
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { neighborhood: { contains: q, mode: "insensitive" } },
              { city: { contains: q, mode: "insensitive" } },
              { address: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(operation && (OPERATIONS as readonly string[]).includes(operation) ? { operation } : {}),
      ...(propertyType && (PROPERTY_TYPES as readonly string[]).includes(propertyType)
        ? { propertyType }
        : {}),
    },
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ listings });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const guard = await guardOsApi(slug, "sitio");
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

  const listing = await db.listing.create({
    data: {
      clientId: guard.tenant.id,
      slug: slugify(d.title),
      title: d.title,
      operation: d.operation ?? "venta",
      propertyType: d.propertyType ?? "departamento",
      status: d.status ?? "disponible",
      priceUsd: d.priceUsd ?? null,
      priceArs: d.priceArs ?? null,
      expensesArs: d.expensesArs ?? null,
      address: d.address || null,
      neighborhood: d.neighborhood || null,
      city: d.city || null,
      bedrooms: d.bedrooms ?? null,
      bathrooms: d.bathrooms ?? null,
      areaM2: d.areaM2 ?? null,
      coveredM2: d.coveredM2 ?? null,
      description: d.description || null,
      amenities: d.amenities ?? [],
      photos: d.photos ?? [],
      featured: d.featured ?? false,
      active: d.active ?? true,
    },
  });

  return NextResponse.json({ ok: true, listing }, { status: 201 });
}
