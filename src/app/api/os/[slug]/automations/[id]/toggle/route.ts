import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { pausar, activar } from "@/lib/provision";
import { guardOsApi } from "../../../_guard";
import { resolveOsRole, isOsOwner } from "@/app/os/[slug]/_components/os-role";

/** Pausar / reanudar una automatización. Solo el dueño del tenant (o admin Cauce). */
export async function POST(_req: Request, ctx: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await ctx.params;
  const g = await guardOsApi(slug);
  if (g.error) return g.error;

  const session = await auth();
  const role = session ? await resolveOsRole(session.user.id, g.tenant.id) : null;
  if (!isOsOwner(role)) {
    return NextResponse.json({ error: "Solo el dueño de la cuenta puede pausar o reanudar" }, { status: 403 });
  }

  // La automatización tiene que ser de ESTE tenant.
  const auto = await db.automation.findFirst({ where: { id, clientId: g.tenant.id } });
  if (!auto) return NextResponse.json({ error: "Automatización no encontrada" }, { status: 404 });

  try {
    if (auto.status === "ACTIVE") {
      await pausar(auto.id);
      return NextResponse.json({ ok: true, status: "PAUSED" });
    }
    await activar(auto.id);
    return NextResponse.json({ ok: true, status: "ACTIVE" });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "No se pudo cambiar el estado" },
      { status: 500 }
    );
  }
}
