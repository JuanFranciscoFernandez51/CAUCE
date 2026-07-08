import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { guardOsApi } from "../../../_guard";
import { resolveOsRole, isOsOwner } from "@/app/os/[slug]/_components/os-role";

/** Pausa/reactiva un proceso del cliente. Solo el dueño. */
export async function POST(
  _req: Request,
  ctx: { params: Promise<{ slug: string; id: string }> }
) {
  const { slug, id } = await ctx.params;
  const g = await guardOsApi(slug);
  if (g.error) return g.error;
  const session = await auth();
  const role = session ? await resolveOsRole(session.user.id, g.tenant.id) : null;
  if (!isOsOwner(role)) return NextResponse.json({ error: "Solo el dueño" }, { status: 403 });

  const proceso = await db.proceso.findFirst({ where: { id, clientId: g.tenant.id } });
  if (!proceso) return NextResponse.json({ error: "No existe" }, { status: 404 });

  const updated = await db.proceso.update({
    where: { id: proceso.id },
    data: { estado: proceso.estado === "ACTIVO" ? "PAUSADO" : "ACTIVO" },
  });
  return NextResponse.json({ ok: true, estado: updated.estado });
}
