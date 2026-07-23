import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { guardOsApi } from "../_guard";
import { resolveOsRole, isOsOwner } from "@/app/os/[slug]/_components/os-role";

const createSchema = z.object({
  concepto: z.string().trim().min(1).max(120),
  montoArs: z.number().min(0).max(1_000_000_000),
  categoria: z.string().trim().min(1).max(60).default("Otros"),
  notas: z.string().trim().max(300).optional(),
});

async function soloDueno(slug: string) {
  const g = await guardOsApi(slug);
  if (g.error) return { error: g.error, tenant: null };
  const session = await auth();
  const role = session ? await resolveOsRole(session.user.id, g.tenant.id) : null;
  if (!isOsOwner(role)) {
    return { error: NextResponse.json({ error: "Solo el dueño" }, { status: 403 }), tenant: null };
  }
  return { error: null, tenant: g.tenant };
}

/** Alta de un costo fijo. Solo el dueño. */
export async function POST(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const g = await soloDueno(slug);
  if (g.error) return g.error;

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  const max = await db.costoFijo.aggregate({
    where: { clientId: g.tenant.id },
    _max: { orden: true },
  });
  const costo = await db.costoFijo.create({
    data: {
      clientId: g.tenant.id,
      concepto: parsed.data.concepto,
      montoArs: parsed.data.montoArs,
      categoria: parsed.data.categoria,
      notas: parsed.data.notas || null,
      orden: (max._max.orden ?? -1) + 1,
    },
  });
  return NextResponse.json({ ok: true, costo }, { status: 201 });
}

const patchSchema = z.object({
  id: z.string().min(1),
  concepto: z.string().trim().min(1).max(120).optional(),
  montoArs: z.number().min(0).max(1_000_000_000).optional(),
  categoria: z.string().trim().min(1).max(60).optional(),
  notas: z.string().trim().max(300).nullable().optional(),
  activo: z.boolean().optional(),
});

/** Edición inline de un costo fijo. Solo el dueño. */
export async function PATCH(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const g = await soloDueno(slug);
  if (g.error) return g.error;

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  const { id, ...data } = parsed.data;

  const result = await db.costoFijo.updateMany({
    where: { id, clientId: g.tenant.id },
    data,
  });
  if (result.count === 0) return NextResponse.json({ error: "No existe" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

/** Baja de un costo fijo. Solo el dueño. */
export async function DELETE(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const g = await soloDueno(slug);
  if (g.error) return g.error;

  const id = new URL(req.url).searchParams.get("id") ?? "";
  const result = await db.costoFijo.deleteMany({ where: { id, clientId: g.tenant.id } });
  if (result.count === 0) return NextResponse.json({ error: "No existe" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
