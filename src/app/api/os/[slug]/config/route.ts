import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { guardOsApi } from "../_guard";
import { resolveOsRole, isOsOwner } from "@/app/os/[slug]/_components/os-role";

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Color inválido (ej: #2E6BFF)");
const schema = z.object({
  displayName: z.string().trim().min(1).max(80),
  primary: hex,
  accent: hex,
  estilo: z
    .object({
      esquinas: z.enum(["rectas", "suaves", "redondeadas"]),
      nav: z.enum(["izquierda", "arriba"]),
      densidad: z.enum(["comoda", "compacta"]),
      grupos: z.enum(["abierto", "desplegable"]),
    })
    .optional(),
});

/** Editar la marca del tenant (nombre visible + colores). Solo el dueño. */
export async function PUT(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
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
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json({ error: first?.message ?? "Datos inválidos" }, { status: 400 });
  }

  const current = (g.tenant.branding as Record<string, unknown> | null) ?? {};
  await db.client.update({
    where: { id: g.tenant.id },
    data: {
      branding: {
        ...current,
        displayName: parsed.data.displayName,
        primary: parsed.data.primary,
        accent: parsed.data.accent,
        ...(parsed.data.estilo ? { estilo: parsed.data.estilo } : {}),
      },
    },
  });
  return NextResponse.json({ ok: true });
}
