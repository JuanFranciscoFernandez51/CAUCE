import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getAnthropic, aiAvailable, MODEL_AGENT } from "@/lib/anthropic";
import { tenantModules } from "@/lib/tenant";
import { guardOsApi } from "../_guard";
import { resolveOsRole, isOsOwner } from "@/app/os/[slug]/_components/os-role";
import {
  buildTenantSummary,
  buildAlertas,
  buildSystemPrompt,
  buildAsistenteTools,
  accionSchema,
  describirAccion,
  type AccionConfirmada,
} from "@/lib/asistente";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(4000),
      })
    )
    .min(1)
    .max(40),
});

/**
 * Conversación con el asistente del tenant.
 * Devuelve { reply, propuesta? }. La propuesta NO se aplica acá:
 * el front la confirma y recién entonces POSTea /asistente/aplicar.
 */
export async function POST(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const g = await guardOsApi(slug);
  if (g.error) return g.error;
  const tenant = g.tenant;

  if (!aiAvailable()) {
    return NextResponse.json(
      { error: "El asistente no está disponible (falta configurar la IA)" },
      { status: 503 }
    );
  }

  const session = await auth();
  const role = session ? await resolveOsRole(session.user.id, tenant.id) : null;
  const owner = isOsOwner(role);

  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Mensaje inválido" },
      { status: 400 }
    );
  }

  const modules = tenantModules(tenant);
  const [summary, alertas] = await Promise.all([
    buildTenantSummary(tenant, modules),
    buildAlertas(tenant, modules),
  ]);
  const system = await buildSystemPrompt(tenant, modules, summary, owner, alertas);

  let res;
  try {
    res = await getAnthropic().messages.create({
      model: MODEL_AGENT,
      max_tokens: 1200,
      system,
      // Sólo el dueño tiene herramientas de escritura; el equipo sólo consulta.
      // Las de alta dependen del módulo activo del tenant.
      ...(owner ? { tools: buildAsistenteTools(modules) } : {}),
      messages: parsed.data.messages.map((m) => ({ role: m.role, content: m.content })),
    });
  } catch {
    return NextResponse.json(
      { error: "No pude pensar la respuesta ahora. Probá de nuevo en un momento." },
      { status: 502 }
    );
  }

  const reply = res.content
    .map((b) => (b.type === "text" ? b.text : ""))
    .join("\n")
    .trim();

  // ¿Propuso un cambio? Validamos la primera tool_use contra el schema.
  let propuesta: { titulo: string; detalle: string; accion: AccionConfirmada } | null = null;
  if (owner) {
    const toolUse = res.content.find((b) => b.type === "tool_use");
    if (toolUse && toolUse.type === "tool_use") {
      const accion = accionSchema.safeParse({ tool: toolUse.name, input: toolUse.input });
      if (accion.success) {
        const desc = describirAccion(accion.data);
        propuesta = { ...desc, accion: accion.data };
      }
    }
  }

  return NextResponse.json({
    reply: reply || (propuesta ? "Te dejé este cambio listo para confirmar:" : "—"),
    propuesta,
  });
}
