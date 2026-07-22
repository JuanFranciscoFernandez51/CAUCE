import { getAnthropic, MODEL_AGENT } from "@/lib/anthropic";
import { ESPEJOS, PIEZA_BASE, PIEZAS, VALOR_EMPLEADO_USD_MES } from "@/lib/piezas";

/**
 * Agente de marketing de Cauce: genera publicaciones de IG y captions de ads
 * con el contexto real del negocio (piezas, precios, casos espejo).
 */

const CONTEXTO_CAUCE = `
Cauce es un estudio argentino (Bahía Blanca) que le arma a las PyMEs su sistema
completo: página web + sistema de gestión (Cauce OS) + automatizaciones, todo junto.
No vende "una web": vende horas recuperadas — cada módulo reemplaza trabajo manual.

Precio: base USD ${PIEZA_BASE.setupUsd} + ${PIEZA_BASE.monthlyUsd}/mes (web + CRM + puesta en marcha),
y piezas a medida: ${PIEZAS.slice(0, 6).map((p) => `${p.label} (USD ${p.setupUsd})`).join(", ")}.
Argumento central: un empleado administrativo cuesta ~USD ${VALOR_EMPLEADO_USD_MES}/mes;
el sistema hace ese trabajo por una fracción.

Casos reales (espejos): ${ESPEJOS.map((e) => `"${e.nombre}" (${e.rubro})`).join(", ")}.
Módulos con más gancho: turnos online que se cargan solos, CRM con seguimiento por
WhatsApp en 1 clic, taller con órdenes de trabajo imprimibles, caja diaria, fichaje
de empleados, importar la agenda de contactos en 2 minutos.

Tono: argentino, directo, de dueño de negocio a dueño de negocio. Sin humo técnico:
hablar de tiempo ahorrado, plata y orden — no de "software" ni "digitalización".
Contacto: cauce-arg.vercel.app · Bahía Blanca.
`.trim();

export type PublicacionGenerada = {
  titulo: string;
  caption: string;
  idea: string;
  mediaType: "PHOTO" | "PHOTO_CAROUSEL" | "REEL";
};

/** Genera un lote de publicaciones para el feed de Cauce (quedan como borradores). */
export async function generarPublicaciones(
  cantidad: number,
  brief?: string
): Promise<PublicacionGenerada[]> {
  const anthropic = getAnthropic();
  const res = await anthropic.messages.create({
    model: MODEL_AGENT,
    max_tokens: 3000,
    system: `Sos el responsable de marketing de Cauce. Contexto del negocio:\n\n${CONTEXTO_CAUCE}\n\nGenerás publicaciones de Instagram listas para usar. Cada una tiene:
- titulo: nombre interno corto (para la lista del admin)
- caption: texto final del post (300-800 caracteres, hook en la primera línea, 1-2 emojis por bloque, cierre con CTA a mandar mensaje, 5-8 hashtags al final: #cauce #bahiablanca #pymes + específicos)
- idea: brief visual DETALLADO para diseñar la pieza (composición, textos que van sobre la imagen, colores — la marca usa azul petróleo y blanco, estilo limpio tipo SaaS). Si es carrusel, describí cada slide.
- mediaType: "PHOTO", "PHOTO_CAROUSEL" (2-6 slides) o "REEL" (si la idea es video con IA)
Variá los ángulos: dolor concreto (turnos por WhatsApp a mano, caja en cuaderno), caso espejo con números, feature puntual, comparación empleado vs sistema, prueba social.
Respondé SOLO con un array JSON válido de objetos {titulo, caption, idea, mediaType}.`,
    messages: [
      {
        role: "user",
        content: `Generá ${cantidad} publicaciones${brief ? ` sobre: ${brief}` : " variadas para esta semana"}.`,
      },
    ],
  });

  const text = res.content.map((b) => (b.type === "text" ? b.text : "")).join("");
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) throw new Error("La IA no devolvió publicaciones válidas");
  const parsed = JSON.parse(match[0]) as PublicacionGenerada[];
  return parsed
    .filter((p) => p.titulo && p.caption)
    .map((p) => ({
      titulo: String(p.titulo).slice(0, 120),
      caption: String(p.caption).slice(0, 2200),
      idea: String(p.idea ?? ""),
      mediaType: (["PHOTO", "PHOTO_CAROUSEL", "REEL"] as const).includes(
        p.mediaType as "PHOTO"
      )
        ? p.mediaType
        : "PHOTO",
    }));
}

const OBJETIVO_LABEL: Record<string, string> = {
  OUTCOME_TRAFFIC: "tráfico al sitio",
  OUTCOME_LEADS: "generación de consultas",
  OUTCOME_ENGAGEMENT: "interacción con la publicación",
  OUTCOME_AWARENESS: "alcance y reconocimiento",
};

/** Caption corto para un anuncio de Meta Ads según el objetivo. */
export async function sugerirCaptionAd(objetivo: string, brief?: string): Promise<string> {
  const anthropic = getAnthropic();
  const res = await anthropic.messages.create({
    model: MODEL_AGENT,
    max_tokens: 400,
    system: `Sos copywriter de Meta Ads para Cauce. Contexto:\n\n${CONTEXTO_CAUCE}\n\nReglas del caption de anuncio:
- 150-280 caracteres, hook con emoji al inicio
- Beneficio concreto en horas/plata, no features
- CTA acorde al objetivo (${OBJETIVO_LABEL[objetivo] ?? objetivo})
- Evitar "vos/te/tu" directo (Meta penaliza referencias personales)
- 3-5 hashtags al final
Respondé SOLO con el texto del caption, sin comillas ni explicación.`,
    messages: [
      {
        role: "user",
        content: `Objetivo: ${OBJETIVO_LABEL[objetivo] ?? objetivo}.${brief ? ` Sobre: ${brief}` : ""}`,
      },
    ],
  });
  return res.content
    .map((b) => (b.type === "text" ? b.text : ""))
    .join("")
    .trim();
}
