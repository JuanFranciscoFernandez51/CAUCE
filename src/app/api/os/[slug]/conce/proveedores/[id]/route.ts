import { NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { guardConceApi } from "../../_guard";

/**
 * Edición del proveedor: campos sueltos (inline desde la lista) y las tres
 * tablas Json de la ficha (contactos, cuentas bancarias y lista de precios).
 */

const contactoSchema = z.object({
  id: z.string().trim().max(40),
  nombre: z.string().trim().max(120),
  rol: z.string().trim().max(60),
  telefono: z.string().trim().max(50),
  email: z.string().trim().max(120),
});

const cuentaSchema = z.object({
  id: z.string().trim().max(40),
  banco: z.string().trim().max(80),
  tipo: z.string().trim().max(40),
  numero: z.string().trim().max(40),
  cbu: z.string().trim().max(30),
  alias: z.string().trim().max(60),
  titular: z.string().trim().max(120),
  moneda: z.string().trim().max(5),
});

const precioSchema = z.object({
  id: z.string().trim().max(40),
  concepto: z.string().trim().max(160),
  precio: z.number().min(0).nullable(),
  moneda: z.string().trim().max(5),
  notas: z.string().trim().max(200),
});

const patchSchema = z
  .object({
    nombre: z.string().trim().min(1).max(120),
    rubro: z.string().trim().max(80).nullable(),
    cuit: z.string().trim().max(20).nullable(),
    telefono: z.string().trim().max(50).nullable(),
    email: z.string().trim().max(120).nullable(),
    direccion: z.string().trim().max(200).nullable(),
    ciudad: z.string().trim().max(80).nullable(),
    sitio: z.string().trim().max(200).nullable(),
    notas: z.string().trim().max(2000).nullable(),
    activo: z.union([z.boolean(), z.enum(["si", "no"])]),
    contactos: z.array(contactoSchema).max(30),
    cuentasBancarias: z.array(cuentaSchema).max(20),
    listaPrecios: z.array(precioSchema).max(200),
  })
  .partial();

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ slug: string; id: string }> }
) {
  const { slug, id } = await ctx.params;
  const g = await guardConceApi(slug);
  if (g.error) return g.error;

  const existe = await db.proveedor.findFirst({
    where: { id, clientId: g.tenant.id },
    select: { id: true },
  });
  if (!existe) return NextResponse.json({ error: "No existe" }, { status: 404 });

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }
  const { activo, contactos, cuentasBancarias, listaPrecios, ...resto } = parsed.data;

  const data: Prisma.ProveedorUpdateInput = { ...resto };
  if (activo !== undefined) data.activo = typeof activo === "boolean" ? activo : activo === "si";
  if (contactos !== undefined) {
    data.contactos = contactos.filter((c) => c.nombre.trim()) as unknown as Prisma.InputJsonValue;
  }
  if (cuentasBancarias !== undefined) {
    data.cuentasBancarias = cuentasBancarias.filter(
      (c) => c.banco.trim() || c.cbu.trim() || c.alias.trim()
    ) as unknown as Prisma.InputJsonValue;
  }
  if (listaPrecios !== undefined) {
    data.listaPrecios = listaPrecios.filter(
      (p) => p.concepto.trim()
    ) as unknown as Prisma.InputJsonValue;
  }

  const proveedor = await db.proveedor.update({ where: { id }, data });
  return NextResponse.json({ ok: true, proveedor });
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ slug: string; id: string }> }
) {
  const { slug, id } = await ctx.params;
  const g = await guardConceApi(slug);
  if (g.error) return g.error;

  const existe = await db.proveedor.findFirst({
    where: { id, clientId: g.tenant.id },
    select: { id: true },
  });
  if (!existe) return NextResponse.json({ error: "No existe" }, { status: 404 });

  await db.proveedor.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
