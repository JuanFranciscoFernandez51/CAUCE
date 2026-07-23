import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guardOsOwnerApi } from "../../_guard";
import { ensureCategorias } from "@/app/os/[slug]/_lib/finanzas-data";

const createSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio").max(80),
  tipo: z.enum(["INGRESO", "GASTO"]),
});

export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const g = await guardOsOwnerApi(slug, "caja");
  if (g.error) return g.error;
  const categorias = await ensureCategorias(g.tenant.id);
  return NextResponse.json({ categorias });
}

export async function POST(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const g = await guardOsOwnerApi(slug, "caja");
  if (g.error) return g.error;

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }
  const { nombre, tipo } = parsed.data;

  try {
    const max = await db.categoriaFinanciera.aggregate({
      where: { clientId: g.tenant.id, tipo },
      _max: { orden: true },
    });
    const categoria = await db.categoriaFinanciera.create({
      data: { clientId: g.tenant.id, nombre, tipo, orden: (max._max.orden ?? -1) + 1 },
    });
    return NextResponse.json({ ok: true, categoria }, { status: 201 });
  } catch (err) {
    if (err && typeof err === "object" && "code" in err && err.code === "P2002") {
      return NextResponse.json(
        { error: "Ya existe una categoría con ese nombre" },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "No se pudo crear la categoría" }, { status: 500 });
  }
}
