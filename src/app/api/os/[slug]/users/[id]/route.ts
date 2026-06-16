import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { guardOsApi } from "../../_guard";
import { resolveOsRole, isOsOwner } from "@/app/os/[slug]/_components/os-role";

const patchSchema = z.object({ osRole: z.enum(["dueno", "equipo"]) });

/** Cambiar el rol de un usuario del equipo. Solo el dueño. */
export async function PATCH(req: Request, ctx: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await ctx.params;
  const g = await guardOsApi(slug);
  if (g.error) return g.error;
  const session = await auth();
  const role = session ? await resolveOsRole(session.user.id, g.tenant.id) : null;
  if (!isOsOwner(role)) return NextResponse.json({ error: "Solo el dueño" }, { status: 403 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Rol inválido" }, { status: 400 });

  // El usuario tiene que ser de este tenant.
  const target = await db.user.findFirst({ where: { id, clientId: g.tenant.id } });
  if (!target) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

  await db.user.update({ where: { id }, data: { osRole: parsed.data.osRole } });
  return NextResponse.json({ ok: true });
}

/** Quitar acceso (borrar) a un usuario del equipo. Solo el dueño, y nunca a sí mismo. */
export async function DELETE(_req: Request, ctx: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await ctx.params;
  const g = await guardOsApi(slug);
  if (g.error) return g.error;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const role = await resolveOsRole(session.user.id, g.tenant.id);
  if (!isOsOwner(role)) return NextResponse.json({ error: "Solo el dueño" }, { status: 403 });

  if (id === session.user.id) {
    return NextResponse.json({ error: "No podés quitarte el acceso a vos mismo" }, { status: 400 });
  }
  const target = await db.user.findFirst({ where: { id, clientId: g.tenant.id } });
  if (!target) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

  await db.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
