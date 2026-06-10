import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import type { ZodType } from "zod";

/**
 * Guardia de admin para route handlers (defensa en profundidad:
 * el middleware ya protege /api/admin, pero acá validamos de nuevo).
 * Devuelve una NextResponse 401 si no hay sesión admin, o null si está OK.
 */
export async function guard(): Promise<NextResponse | null> {
  try {
    await requireAdmin();
    return null;
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
}

/** Parsea y valida el body JSON con zod. Devuelve {data} o {error: NextResponse}. */
export async function parseBody<T>(
  req: Request,
  schema: ZodType<T>
): Promise<{ data: T; error: null } | { data: null; error: NextResponse }> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return {
      data: null,
      error: NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 }),
    };
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return {
      data: null,
      error: NextResponse.json(
        { error: first ? `${first.path.join(".")}: ${first.message}` : "Datos inválidos" },
        { status: 400 }
      ),
    };
  }
  return { data: parsed.data, error: null };
}

/** Respuesta uniforme para errores inesperados. */
export function serverError(e: unknown): NextResponse {
  console.error("[api/admin]", e);
  const msg = e instanceof Error ? e.message : "Error inesperado";
  return NextResponse.json({ error: msg }, { status: 500 });
}
