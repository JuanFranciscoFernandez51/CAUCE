import { NextResponse } from "next/server";
import type { Client } from "@prisma/client";
import { guardOsApi } from "../_guard";
import { esConcesionaria } from "@/lib/conce-server";

/**
 * Guard de las APIs del módulo Concesionaria: guard estándar del OS (sesión →
 * tenant → pertenencia → módulo "sitio") + que el tenant use el template
 * concesionaria.
 */
export async function guardConceApi(
  slug: string
): Promise<{ tenant: Client; error?: never } | { tenant?: never; error: NextResponse }> {
  const guard = await guardOsApi(slug, "sitio");
  if (guard.error) return guard;
  if (!esConcesionaria(guard.tenant)) {
    return {
      error: NextResponse.json(
        { error: "Este sistema no tiene concesionaria activada" },
        { status: 404 }
      ),
    };
  }
  return guard;
}
