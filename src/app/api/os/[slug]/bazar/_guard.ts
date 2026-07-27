import { NextResponse } from "next/server";
import type { Client } from "@prisma/client";
import { guardOsApi } from "../_guard";
import { esBazar } from "@/lib/bazar-server";

/**
 * Guard de las APIs del módulo Bazar: guard estándar del OS (sesión → tenant →
 * pertenencia → módulo "sitio") + que el tenant use el template bazar.
 */
export async function guardBazarApi(
  slug: string
): Promise<{ tenant: Client; error?: never } | { tenant?: never; error: NextResponse }> {
  const guard = await guardOsApi(slug, "sitio");
  if (guard.error) return guard;
  if (!esBazar(guard.tenant)) {
    return {
      error: NextResponse.json(
        { error: "Este sistema no tiene tienda bazar activada" },
        { status: 404 }
      ),
    };
  }
  return guard;
}
