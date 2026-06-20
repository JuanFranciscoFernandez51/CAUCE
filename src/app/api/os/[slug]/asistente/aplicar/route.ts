import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { guardOsApi } from "../../_guard";
import { resolveOsRole, isOsOwner } from "@/app/os/[slug]/_components/os-role";
import { accionSchema, aplicarAccion } from "@/lib/asistente";

export const dynamic = "force-dynamic";

/**
 * Aplica una propuesta del asistente YA confirmada por el dueño.
 * Revalida todo: guardOsApi (sesión + tenant) + isOsOwner + zod de la acción.
 * Nunca confía en lo que mandó el front: re-parsea la acción contra el schema.
 */
export async function POST(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const g = await guardOsApi(slug);
  if (g.error) return g.error;
  const tenant = g.tenant;

  const session = await auth();
  const role = session ? await resolveOsRole(session.user.id, tenant.id) : null;
  if (!isOsOwner(role)) {
    return NextResponse.json({ error: "Solo el dueño puede aplicar cambios" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = accionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Cambio inválido" },
      { status: 400 }
    );
  }

  try {
    const mensaje = await aplicarAccion(tenant, parsed.data);
    return NextResponse.json({ ok: true, mensaje });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "No se pudo aplicar el cambio" },
      { status: 400 }
    );
  }
}
