import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { guardConceApi } from "../_guard";

/**
 * Buscador de clientes del CRM para el alta de mandatos y boletos.
 * Filtra los Contact del tenant por nombre, teléfono, email o DNI/CUIT.
 * Devuelve el `custom` porque ahí viven el DNI y el domicilio.
 */
export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const g = await guardConceApi(slug);
  if (g.error) return g.error;

  const q = (new URL(req.url).searchParams.get("q") ?? "").trim();

  const contactos = await db.contact.findMany({
    where: {
      clientId: g.tenant.id,
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" as const } },
              { phone: { contains: q, mode: "insensitive" as const } },
              { email: { contains: q, mode: "insensitive" as const } },
              // El DNI vive en custom:Json → lo buscamos por string.
              { custom: { string_contains: q } },
            ],
          }
        : {}),
    },
    orderBy: [{ lastTouchAt: "desc" }, { createdAt: "desc" }],
    take: 40,
    select: { id: true, name: true, phone: true, email: true, custom: true },
  });

  return NextResponse.json({
    contactos: contactos.map((c) => {
      const custom =
        c.custom && typeof c.custom === "object" && !Array.isArray(c.custom)
          ? (c.custom as Record<string, unknown>)
          : {};
      return {
        id: c.id,
        nombre: c.name,
        telefono: c.phone ?? "",
        email: c.email ?? "",
        dni: String(custom.dni ?? custom.cuit ?? ""),
        domicilio: String(custom.domicilio ?? ""),
      };
    }),
  });
}
