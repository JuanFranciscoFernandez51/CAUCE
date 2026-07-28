import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { rateLimit, clientIp } from "@/lib/ratelimit";
import { getTenantBySlug, hasModule } from "@/lib/tenant";
import { esConcesionaria } from "@/lib/conce-server";
import { aiAvailable, getAnthropic } from "@/lib/anthropic";
import {
  fmtKm,
  fmtPrecioVehiculo,
  nombreVehiculo,
  primeraFotoVehiculo,
  tipoLabel,
} from "@/lib/conce";

export const maxDuration = 60;

/**
 * Chatbot "¿Qué auto es para vos?" del sitio de la concesionaria.
 * Arma el contexto con el stock REAL (resumen de cada vehículo) y responde
 * con Claude; si no hay ANTHROPIC_API_KEY, cae a un recomendador por reglas
 * (presupuesto + tipo de uso) para que la demo funcione igual.
 * Devuelve { texto, sugerencias: [{slug, titulo, precio, foto}] }.
 */

const schema = z.object({
  mensajes: z
    .array(
      z.object({
        rol: z.enum(["user", "bot"]),
        texto: z.string().trim().min(1).max(1000),
      })
    )
    .min(1)
    .max(12),
});

type VehiculoCtx = {
  id: string;
  slug: string;
  titulo: string;
  precio: number | null;
  moneda: string;
  precioTxt: string;
  tipo: string;
  condicion: string;
  km: number;
  anio: number;
  transmision: string | null;
  combustible: string | null;
  visitas: number;
  foto: string | null;
};

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  if (!rateLimit(`rc-asesor:${slug}:${clientIp(req)}`, 15, 60_000)) {
    return NextResponse.json(
      { error: "Demasiadas consultas seguidas, esperá un minuto." },
      { status: 429 }
    );
  }

  const tenant = await getTenantBySlug(slug);
  if (!tenant || !hasModule(tenant, "sitio") || !esConcesionaria(tenant)) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }
  const mensajes = parsed.data.mensajes;

  // Catálogo real (compacto) como contexto.
  const stock = await db.conceVehiculo.findMany({
    where: { clientId: tenant.id, estado: "disponible" },
    orderBy: [{ destacado: "desc" }, { visitas: "desc" }],
    take: 90,
    select: {
      id: true,
      slug: true,
      marca: true,
      modelo: true,
      version: true,
      anio: true,
      km: true,
      precio: true,
      moneda: true,
      condicion: true,
      tipo: true,
      transmision: true,
      combustible: true,
      visitas: true,
      fotos: true,
    },
  });
  const catalogo: VehiculoCtx[] = stock.map((v) => ({
    id: v.id,
    slug: v.slug,
    titulo: `${nombreVehiculo(v)} ${v.anio}`,
    precio: v.precio,
    moneda: v.moneda,
    precioTxt: fmtPrecioVehiculo(v.precio, v.moneda),
    tipo: v.tipo,
    condicion: v.condicion,
    km: v.km,
    anio: v.anio,
    transmision: v.transmision,
    combustible: v.combustible,
    visitas: v.visitas,
    foto: primeraFotoVehiculo(v.fotos),
  }));

  const porSlug = new Map(catalogo.map((v) => [v.slug, v]));
  const aSugerencia = (v: VehiculoCtx) => ({
    slug: v.slug,
    titulo: v.titulo,
    precio: v.precioTxt,
    foto: v.foto,
  });

  // ── Con IA ──
  if (aiAvailable()) {
    try {
      const listado = catalogo
        .map(
          (v) =>
            `- [${v.slug}] ${v.titulo} · ${tipoLabel(v.tipo)} · ${v.condicion} · ${
              v.condicion === "0km" ? "0 km" : fmtKm(v.km)
            } · ${v.precioTxt}${v.transmision ? ` · ${v.transmision}` : ""}${
              v.combustible ? ` · ${v.combustible}` : ""
            }`
        )
        .join("\n");

      const system = [
        "Sos el asesor comercial virtual de Ri Cars Automotores, concesionaria multimarca de Bahía Blanca (0KM y usados).",
        "Hablás en español argentino, cercano y directo, sin exagerar. Respuestas CORTAS (máximo ~80 palabras).",
        "Tu trabajo: entender uso (ciudad/ruta/trabajo/familia), presupuesto y preferencias, y recomendar 2 o 3 vehículos DEL STOCK REAL de abajo. Si te falta información clave, hacé UNA pregunta corta antes de recomendar.",
        "Nunca inventes vehículos, precios ni datos: usá solo el stock listado. Si nada encaja, decilo con honestidad y sugerí lo más cercano o dejar una consulta.",
        "Cuando recomiendes, terminá tu respuesta con una línea EXACTA con este formato (sin comentarios después):",
        "SLUGS: slug-1, slug-2, slug-3",
        "usando los slugs entre corchetes del stock. Si todavía no recomendás nada, NO incluyas la línea SLUGS.",
        "",
        "STOCK DISPONIBLE HOY:",
        listado,
      ].join("\n");

      const client = getAnthropic();
      const response = await client.messages.create({
        model: "claude-sonnet-5",
        max_tokens: 600,
        system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
        messages: mensajes.map((m) => ({
          role: m.rol === "user" ? ("user" as const) : ("assistant" as const),
          content: m.texto,
        })),
      });

      if (response.stop_reason === "refusal") throw new Error("refusal");
      const bruto = response.content
        .map((b) => (b.type === "text" ? b.text : ""))
        .join("\n")
        .trim();
      if (!bruto) throw new Error("vacío");

      // Parsear la línea SLUGS y sacarla del texto visible.
      const match = bruto.match(/SLUGS:\s*(.+)\s*$/im);
      const slugs = match
        ? match[1]
            .split(",")
            .map((s) => s.trim().replace(/^\[|\]$/g, ""))
            .filter(Boolean)
        : [];
      const texto = bruto.replace(/SLUGS:\s*.+$/im, "").trim();
      const sugerencias = slugs
        .map((s) => porSlug.get(s))
        .filter((v): v is VehiculoCtx => Boolean(v))
        .slice(0, 3)
        .map(aSugerencia);

      return NextResponse.json({ texto: texto || bruto, sugerencias });
    } catch {
      // caemos al recomendador por reglas
    }
  }

  // ── Fallback por reglas (presupuesto + tipo de uso) ──
  const todoElUsuario = mensajes
    .filter((m) => m.rol === "user")
    .map((m) => m.texto.toLowerCase())
    .join(" ");

  // Presupuesto: "30 millones" / "30m" / "$30.000.000" / "usd 20000" / "20 mil dolares"
  let presupuesto: { moneda: "ARS" | "USD"; max: number } | null = null;
  const usdMatch = todoElUsuario.match(/(?:usd|u\$s|dolares|dólares)\s*\$?\s*([\d.,]+)/);
  const millonesMatch = todoElUsuario.match(/([\d.,]+)\s*(?:millones|millón|m\b|palos)/);
  const numeroGrande = todoElUsuario.match(/\$?\s*(\d{1,3}(?:\.\d{3}){2,})/);
  if (usdMatch) {
    const n = Number(usdMatch[1].replace(/\./g, "").replace(",", "."));
    if (n > 500) presupuesto = { moneda: "USD", max: n };
  } else if (millonesMatch) {
    const n = Number(millonesMatch[1].replace(",", "."));
    if (n > 0 && n < 500) presupuesto = { moneda: "ARS", max: n * 1_000_000 };
  } else if (numeroGrande) {
    const n = Number(numeroGrande[1].replace(/\./g, ""));
    if (n >= 1_000_000) presupuesto = { moneda: "ARS", max: n };
  }

  // Uso → tipos preferidos
  const tiposPreferidos: string[] = [];
  const quiere = (...palabras: string[]) => palabras.some((p) => todoElUsuario.includes(p));
  if (quiere("moto")) tiposPreferidos.push("moto");
  if (quiere("famili", "hijos", "chicos", "espacio", "grande")) tiposPreferidos.push("suv", "sedan");
  if (quiere("trabajo", "carga", "campo", "obra", "herramient")) tiposPreferidos.push("pickup", "utilitario");
  if (quiere("ciudad", "chico", "primer auto", "económico", "economico")) tiposPreferidos.push("hatchback", "sedan");
  if (quiere("ruta", "viaj")) tiposPreferidos.push("suv", "sedan", "pickup");
  if (quiere("0km", "0 km", "nuevo")) tiposPreferidos.push("0km");

  let candidatos = catalogo.filter((v) => {
    if (presupuesto) {
      if (v.precio == null) return false;
      if (v.moneda !== presupuesto.moneda) return false;
      if (v.precio > presupuesto.max) return false;
    }
    return true;
  });
  if (tiposPreferidos.length > 0) {
    const filtrados = candidatos.filter(
      (v) => tiposPreferidos.includes(v.tipo) || (tiposPreferidos.includes("0km") && v.condicion === "0km")
    );
    if (filtrados.length > 0) candidatos = filtrados;
  }

  // Sin datos todavía → preguntamos.
  if (!presupuesto && tiposPreferidos.length === 0) {
    return NextResponse.json({
      texto:
        "¡Buenísimo! Para recomendarte bien: ¿lo querés más para ciudad, ruta, trabajo o familia? ¿Y qué presupuesto manejás? (por ejemplo “hasta 30 millones” o “USD 20.000”)",
      sugerencias: [],
    });
  }

  const top = candidatos.sort((a, b) => b.visitas - a.visitas).slice(0, 3);
  if (top.length === 0) {
    return NextResponse.json({
      texto:
        "Con ese presupuesto no tengo algo exacto en el stock ahora mismo 😕. Pero entra mercadería toda la semana: dejanos tu consulta en la página de contacto o escribinos al WhatsApp 291 503-8204 y te avisamos apenas entre algo.",
      sugerencias: [],
    });
  }

  return NextResponse.json({
    texto: `Mirá, con lo que me contás te recomiendo esta${top.length > 1 ? "s" : ""} opci${top.length > 1 ? "ones" : "ón"} de nuestro stock 👇 Tocá cualquiera para ver todas las fotos y la ficha completa. ¿Querés que ajustemos por precio o tipo?`,
    sugerencias: top.map(aSugerencia),
  });
}
