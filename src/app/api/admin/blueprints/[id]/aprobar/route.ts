import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { guard, serverError } from "../../../_utils";
import { PROCESOS_CATALOGO } from "@/lib/procesos-catalogo";

const slugify = (s: string): string =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 30);

/**
 * Aprobar un blueprint: convierte el lead en cliente (si no lo era),
 * deja el blueprint APPROVED y crea los procesos del plan (keys del
 * catálogo en código) ya ACTIVOS en el sistema del cliente.
 */
export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guard();
  if (denied) return denied;
  const { id } = await ctx.params;
  try {
    const bp = await db.blueprint.findUniqueOrThrow({
      where: { id },
      include: { lead: true },
    });
    if (!bp.lead) {
      return NextResponse.json({ error: "El blueprint no tiene lead asociado" }, { status: 400 });
    }
    const lead = bp.lead;

    // Cliente: reusar el del lead o crearlo con acceso propio.
    let clientId = lead.clientId;
    if (!clientId) {
      const base = slugify(lead.business || lead.name) || `cliente${Date.now() % 100000}`;
      let slug = base;
      let i = 1;
      while (await db.client.findUnique({ where: { slug } })) {
        slug = `${base}${i++}`.slice(0, 38);
      }
      const created = await db.client.create({
        data: {
          name: lead.business || lead.name,
          slug,
          rubro: lead.rubro,
          pack: bp.suggestedPack,
          status: "ACTIVE",
          mrr: bp.suggestedMonthly,
          setupPaid: 0,
          contactName: lead.name,
          email: lead.email,
          whatsapp: lead.whatsapp,
          modules: ["crm", "sitio"],
          branding: { displayName: lead.business || lead.name },
        },
      });
      await db.user.create({
        data: {
          username: slug,
          name: lead.name,
          role: "CLIENT",
          osRole: "dueno",
          clientId: created.id,
          passwordHash: await bcrypt.hash(`${slug}2026`, 10),
        },
      });
      clientId = created.id;
    }

    // Procesos del plan (sin duplicar por nombre si ya existen).
    const byKey = new Map(PROCESOS_CATALOGO.map((p) => [p.key, p]));
    const existentes = await db.proceso.findMany({
      where: { clientId },
      select: { nombre: true },
    });
    const yaEstan = new Set(existentes.map((p) => p.nombre));
    const nuevos = bp.recipeIds
      .map((k) => byKey.get(k))
      .filter((p): p is (typeof PROCESOS_CATALOGO)[number] => Boolean(p && !yaEstan.has(p.nombre)));
    if (nuevos.length > 0) {
      await db.proceso.createMany({
        data: nuevos.map((p, i) => ({
          clientId,
          nombre: p.nombre,
          queHace: p.queHace,
          cuando: p.cuando,
          estado: "ACTIVO" as const,
          orden: existentes.length + i,
        })),
      });
    }

    await db.blueprint.update({ where: { id }, data: { status: "APPROVED" } });
    await db.lead.update({ where: { id: lead.id }, data: { status: "CONVERTED", clientId } });

    return NextResponse.json({ clientId });
  } catch (e) {
    return serverError(e);
  }
}
