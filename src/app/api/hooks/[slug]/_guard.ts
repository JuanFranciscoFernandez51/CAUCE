import { NextResponse } from "next/server";
import type { Client } from "@prisma/client";
import { getTenantBySlug, hasModule, type OsModule } from "@/lib/tenant";
import { rateLimit } from "@/lib/ratelimit";

/**
 * Guard de los hooks públicos del bot (/api/hooks/[slug]/…):
 * secret compartido (x-cauce-secret) + rate limit 30/min por slug + tenant + módulo.
 * Sin CAUCE_WEBHOOK_SECRET configurado, los hooks quedan apagados (503).
 */
export async function guardHook(
  req: Request,
  slug: string,
  requiredModule?: OsModule
): Promise<{ tenant: Client; error?: never } | { tenant?: never; error: NextResponse }> {
  const secret = process.env.CAUCE_WEBHOOK_SECRET;
  if (!secret) {
    return { error: NextResponse.json({ error: "hooks sin configurar" }, { status: 503 }) };
  }
  if (req.headers.get("x-cauce-secret") !== secret) {
    return { error: NextResponse.json({ error: "No autorizado" }, { status: 401 }) };
  }
  if (!rateLimit(`hooks:${slug}`, 30, 60_000)) {
    return {
      error: NextResponse.json({ error: "Demasiadas solicitudes, probá en un minuto" }, { status: 429 }),
    };
  }
  const tenant = await getTenantBySlug(slug);
  if (!tenant) {
    return { error: NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 }) };
  }
  if (requiredModule && !hasModule(tenant, requiredModule)) {
    return {
      error: NextResponse.json(
        { error: "Este módulo no está activado para este negocio" },
        { status: 403 }
      ),
    };
  }
  return { tenant };
}
