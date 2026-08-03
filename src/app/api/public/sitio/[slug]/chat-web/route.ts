import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getTenantBySlug } from "@/lib/tenant";
import { aiAvailable, getAnthropic } from "@/lib/anthropic";

/**
 * Chat de la web pública, con la forma que espera un cliente de Gemini
 * ({contents} → {candidates}). Así los sitios que ya venían con ese chat
 * cambian una sola URL y siguen andando, pero contra nuestro modelo y con
 * la conversación guardada.
 */
export const runtime = "nodejs";

type Parte = { text?: string };
type Turno = { role?: string; parts?: Parte[] };

const salida = (texto: string) =>
  NextResponse.json({ candidates: [{ content: { parts: [{ text: texto }] } }] });

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) return salida("No encontré el negocio.");

  const body = (await req.json().catch(() => null)) as { contents?: Turno[] } | null;
  const turnos = (body?.contents ?? []).slice(-12);
  const ultimo = [...turnos].reverse().find((t) => (t.role ?? "user") === "user");
  const pregunta = (ultimo?.parts ?? []).map((p) => p.text ?? "").join(" ").trim();
  if (!pregunta) return salida("Contame en qué te puedo ayudar.");

  if (!aiAvailable()) {
    const wa = tenant.whatsapp?.replace(/\D/g, "");
    return salida(
      `Ahora mismo no puedo responderte por acá.${wa ? ` Escribinos por WhatsApp: https://wa.me/${wa}` : ""}`
    );
  }

  const st = (tenant.settings ?? {}) as { horarios?: string; sucursales?: { direccion?: string }[] };
  const pantallas = await db.pantalla
    .findMany({
      where: { clientId: tenant.id, activa: true },
      select: { nombre: true, zona: true, medidas: true, resolucion: true },
      take: 20,
    })
    .catch(() => []);

  const contexto = [
    `Sos el asistente de ${tenant.name}${tenant.rubro ? `, ${tenant.rubro}` : ""}.`,
    "Respondés en español rioplatense, cordial y breve (máximo 4 líneas).",
    "Nunca inventes precios, disponibilidad ni datos que no estén acá abajo.",
    "Si te piden algo que no sabés, ofrecé el WhatsApp o el formulario de contacto.",
    st.horarios ? `Horarios: ${st.horarios}` : "",
    st.sucursales?.[0]?.direccion ? `Dirección: ${st.sucursales[0].direccion}` : "",
    tenant.whatsapp ? `WhatsApp: https://wa.me/${tenant.whatsapp.replace(/\D/g, "")}` : "",
    pantallas.length
      ? `Pantallas del circuito:\n${pantallas.map((p) => `- ${p.nombre} (${p.zona ?? "s/zona"})${p.medidas ? `, ${p.medidas}` : ""}`).join("\n")}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const client = getAnthropic();
    const r = await client.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 500,
      system: [{ type: "text", text: contexto, cache_control: { type: "ephemeral" } }],
      messages: turnos.map((t) => ({
        role: (t.role === "model" ? "assistant" : "user") as "user" | "assistant",
        content: (t.parts ?? []).map((p) => p.text ?? "").join(" ").trim() || "…",
      })),
    });
    const texto = r.content.map((c) => (c.type === "text" ? c.text : "")).join("").trim();

    // La charla queda registrada: es un lead, no una consulta que se pierde.
    await db.contact
      .create({
        data: {
          clientId: tenant.id,
          name: "Visitante del chat",
          phone: "",
          source: "chat de la web",
          stage: "nuevo",
          notes: `[chat] ${pregunta}`.slice(0, 2000),
          lastTouchAt: new Date(),
        },
      })
      .catch(() => {});

    return salida(texto || "Perdón, no te entendí. ¿Me lo repetís?");
  } catch {
    return salida("Se me complicó responderte. Probá de nuevo o escribinos por WhatsApp.");
  }
}
