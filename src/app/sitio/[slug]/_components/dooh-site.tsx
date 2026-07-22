import type { Client } from "@prisma/client";
import { tenantBranding } from "@/lib/tenant";
import { ConsultaForm } from "./consulta-form";

/**
 * Template DOOH (Ave Fénix): réplica de su estética real — fondo #050A0B,
 * cyan #0DCCF2, Space Grotesk, todo en dark. Las ubicaciones salen de la DB
 * (módulo Pantallas) con disponibilidad EN VIVO.
 */

export type DoohPantalla = {
  id: string;
  nombre: string;
  zona: string | null;
  medidas: string | null;
  resolucion: string | null;
  fotoUrl: string | null;
  libres: number;
};

/** Blurbs comerciales por ubicación (los de su web actual). */
const BLURBS: Record<string, { kicker: string; texto: string; impactos: string; audiencia: string }> = {
  "Zelarrayan e Irigoyen": {
    kicker: "EL CORAZÓN FINANCIERO",
    texto:
      "Punto neurálgico del microcentro de la ciudad. Asegurá que tu mensaje sea leído completo gracias a los tiempos de espera en los semáforos y los puntos clave de transporte.",
    impactos: "+65.000",
    audiencia: "Público masivo",
  },
  "Vieytes y Rondeau": {
    kicker: "EL NODO FAMILIAR",
    texto:
      "Epicentro educativo y residencial. Llegá directo a las familias y tomadores de decisión que circulan a diario llevando a sus hijos a los colegios e institutos más importantes del sector.",
    impactos: "+55.000",
    audiencia: "Padres / Jóvenes",
  },
  "Colon y Brunel": {
    kicker: "INGRESO DEL CLUB OLIMPO",
    texto:
      "Impactá directamente en la vida social del club. Presencia obligada frente al polo industrial y portuario, en la ruta comercial de miles de trabajadores.",
    impactos: "+35.000",
    audiencia: "Industrial / Deportivo",
  },
  "Colon y Chile": {
    kicker: "CRUCE NEURÁLGICO",
    texto:
      "Dominá la visual sobre uno de los accesos principales. Semáforo extenso que garantiza la lectura de tu pantalla para todo el tránsito de ingreso y egreso.",
    impactos: "+35.000",
    audiencia: "Tránsito pasante",
  },
};

const PASOS = [
  { n: "1", t: "CONTACTANOS", d: "Escribinos por WhatsApp o email. Te asesoramos sobre las mejores ubicaciones para tu negocio." },
  { n: "2", t: "DISEÑAMOS", d: "Creamos o adaptamos tu spot publicitario con animaciones de alto impacto, optimizado para pantalla LED. Sin cargo." },
  { n: "3", t: "¡AL AIRE!", d: "Tu publicidad sale en pantalla en menos de 48 horas. En vivo, 24/7, impactando miles de personas." },
  { n: "4", t: "RESULTADOS", d: "Medimos los impactos y la cobertura de tu campaña. Ajustamos y escalamos para maximizar tu ROI." },
];

const VENTAJAS = [
  { n: "01", t: "OMNIPRESENCIA", d: "Tu marca deja de ser un anuncio y pasa a ser parte del paisaje urbano. Top of mind asegurado en el corazón financiero, social y familiar." },
  { n: "02", t: "COBERTURA TOTAL", d: "Eliminá el riesgo de no llegarle a alguien: el ejecutivo en la Plaza, la familia en el corredor escolar y el trabajador industrial en Av. Colón." },
  { n: "03", t: "COSTO OPTIMIZADO", d: "La contratación en bloque diluye el costo unitario, logrando el CPM más eficiente del mercado. Retorno de visibilidad máximo." },
];

const FAQ = [
  ["¿Cuánto tiempo dura cada spot publicitario en las pantallas?", "Cada spot dura de 10 a 15 segundos, rotando en bloques junto con otros anunciantes. Según el plan, tu publicidad se repite entre 100 y 200 veces por día en cada pantalla."],
  ["¿Ustedes diseñan el video o lo tengo que traer hecho?", "¡Las dos opciones! Podés traer tu pieza en MP4 o imagen y la adaptamos, o nuestro equipo crea tu spot desde cero con animaciones y efectos, ¡sin cargo!"],
  ["¿Puedo elegir en qué pantallas aparece mi publicidad?", "¡Sí! Podés contratar una pantalla individual o armar un circuito personalizado. Te asesoramos según tu público objetivo: microcentro, zonas residenciales o accesos."],
  ["¿Cuál es la contratación mínima?", "La mínima es 1 mes por pantalla, con planes cortos para eventos y lanzamientos. A mayor cantidad de meses y pantallas, mejor precio unitario."],
  ["¿En qué horarios funcionan las pantallas?", "Todos los días del año, de 7:00 a 24:00. Presencia constante en todas las horas de mayor tráfico, incluyendo fines de semana y feriados."],
  ["¿Puedo cambiar el contenido durante la campaña?", "¡Claro! Podés actualizar tu spot las veces que necesites sin costo adicional. ¿Promo nueva? En menos de 24 horas está al aire."],
  ["¿Qué tipo de negocios se benefician más?", "Prácticamente cualquiera: inmobiliarias, concesionarias, clínicas, restaurantes, indumentaria, constructoras, eventos y más."],
  ["¿También venden e instalan pantallas LED?", "¡Sí! Proveemos e instalamos tótems, pantallas indoor, outdoor y gran formato: estructura, instalación, configuración y soporte, llave en mano con garantía."],
];

const CYAN = "#0DCCF2";

export function DoohSite({
  tenant,
  pantallas,
}: {
  tenant: Client;
  pantallas: DoohPantalla[];
}) {
  const branding = tenantBranding(tenant);
  const wa = `https://wa.me/${(tenant.whatsapp ?? "").replace(/\D/g, "")}`;
  const tel = tenant.phone ?? "";
  const email = tenant.email ?? "";

  // "Impactos hoy": 190k repartidos según la hora argentina (7 a 24).
  const ahora = new Date();
  const horaArg = Number(
    ahora.toLocaleTimeString("en-GB", { hour: "2-digit", hour12: false, timeZone: "America/Argentina/Buenos_Aires" })
  );
  const fraccion = Math.min(1, Math.max(0.02, (horaArg - 7 + 1) / 17));
  const impactosHoy = Math.round(190000 * fraccion * 0.33 + (ahora.getMinutes() * 137) % 977);

  const destacadas = pantallas.filter((p) => BLURBS[p.nombre]);
  const resto = pantallas.filter((p) => !BLURBS[p.nombre]);

  return (
    <div
      className="min-h-screen bg-[#050A0B] text-slate-100"
      style={{ fontFamily: "'Space Grotesk', ui-sans-serif, system-ui, sans-serif" }}
    >
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&display=swap');`}</style>

      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-[#050A0B]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          {branding.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={branding.logo} alt={branding.displayName} className="h-8 w-auto" />
          ) : (
            <span className="font-bold tracking-wide" style={{ color: CYAN }}>
              {branding.displayName}
            </span>
          )}
          <nav className="hidden items-center gap-5 text-[11px] font-semibold uppercase tracking-widest text-slate-300 md:flex">
            <a href="#ubicaciones" className="hover:text-white">Ubicaciones</a>
            <a href="#como" className="hover:text-white">Cómo funciona</a>
            <a href="#venta" className="hover:text-white">Venta y colocación</a>
            <a href="#faq" className="hover:text-white">FAQ</a>
            <a href="#contacto" className="hover:text-white">Contacto</a>
          </nav>
          <a
            href={`${wa}?text=${encodeURIComponent("Hola! Quiero cotizar una campaña en las pantallas LED.")}`}
            className="rounded-none px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#050A0B]"
            style={{ backgroundColor: CYAN }}
          >
            Cotizar ahora
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{ background: `radial-gradient(60% 60% at 70% 20%, ${CYAN}22 0%, transparent 70%)` }}
        />
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-[1.4fr_1fr] md:py-24">
          <div>
            <div className="mb-6 flex flex-wrap items-center gap-3 text-[11px] font-semibold uppercase tracking-widest">
              <span className="flex items-center gap-2 border border-white/10 px-3 py-1.5 text-slate-300">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" /> En vivo en Bahía Blanca
              </span>
              <span className="border px-3 py-1.5" style={{ borderColor: `${CYAN}44`, color: CYAN }}>
                ↗ {impactosHoy.toLocaleString("es-AR")} impactos hoy
              </span>
            </div>
            <h1 className="text-5xl font-bold leading-[0.95] tracking-tight md:text-7xl">
              CIRCUITO DE{" "}
              <em className="not-italic" style={{ color: CYAN, fontStyle: "italic" }}>
                PANTALLAS
              </em>{" "}
              LEDS
            </h1>
            <p className="mt-6 max-w-md text-lg text-slate-300">
              Impactá al 85% de tu público objetivo en Bahía Blanca todos los días. Posiciones
              estratégicas para escalar tus ventas.
            </p>
            <a
              href={`${wa}?text=${encodeURIComponent("Hola! Quiero cotizar mi campaña en el circuito de pantallas.")}`}
              className="mt-8 inline-block px-8 py-4 text-sm font-bold uppercase tracking-wider text-[#050A0B] transition hover:opacity-90"
              style={{ backgroundColor: CYAN }}
            >
              Cotizar mi campaña
            </a>
          </div>
          <div className="flex flex-col justify-center gap-4">
            {[
              ["190k+", "Visualizaciones diarias", CYAN],
              ["85%", "Cobertura población", "#F59E0B"],
              ["5.7M", "Impactos mensuales", CYAN],
            ].map(([v, l, c]) => (
              <div key={l} className="border border-white/10 bg-white/[0.03] px-6 py-5">
                <p className="text-4xl font-bold tabular-nums">{v}</p>
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-widest" style={{ color: c as string }}>
                  {l}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ubicaciones destacadas */}
      <section id="ubicaciones" className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-3xl font-bold uppercase leading-tight md:text-5xl">
          Ubicaciones que <span style={{ color: CYAN }}>multiplican tu impacto.</span>
        </h2>
        <p className="mt-3 max-w-xl text-slate-400">
          Posiciones estratégicas dominando el microcentro, accesos y zonas residenciales de Bahía Blanca.
        </p>

        <div className="mt-10 space-y-6">
          {destacadas.map((p) => {
            const b = BLURBS[p.nombre];
            return (
              <div key={p.id} className="grid gap-6 border border-white/10 bg-white/[0.02] p-6 md:grid-cols-[1fr_2fr] md:p-8">
                <div className="space-y-3">
                  <span className="flex w-fit items-center gap-2 border border-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-slate-300">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" /> En vivo
                  </span>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-slate-500">Impactos diarios</p>
                    <p className="text-2xl font-bold" style={{ color: CYAN }}>{b.impactos}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-slate-500">Perfil audiencia</p>
                    <p className="font-semibold">{b.audiencia}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-slate-500">Disponibilidad</p>
                    <p className={`font-semibold ${p.libres === 0 ? "text-red-400" : ""}`} style={p.libres > 0 ? { color: CYAN } : undefined}>
                      {p.libres === 0 ? "Completa — lista de espera" : `${p.libres} lugares libres`}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "#F59E0B" }}>
                    {b.kicker}
                  </p>
                  <h3 className="mt-1 text-2xl font-bold md:text-3xl">{p.nombre}</h3>
                  <p className="mt-3 text-slate-300">{b.texto}</p>
                  <p className="mt-3 text-xs uppercase tracking-widest text-slate-500">
                    {[p.medidas, p.resolucion].filter(Boolean).join(" · ")}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Resto del circuito */}
        {resto.length > 0 ? (
          <div className="mt-12 border border-white/10 bg-white/[0.02] p-6 md:p-8">
            <h3 className="text-xl font-bold uppercase">¡Y eso no es todo!</h3>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              Más pantallas cubriendo puntos neurálgicos de alto tráfico en la ciudad, Monte Hermoso,
              Sierra de la Ventana, Tandil y más localidades.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {resto.map((p) => (
                <span key={p.id} className="border border-white/10 px-3 py-1.5 text-xs text-slate-300">
                  {p.nombre}
                  {p.zona ? <span className="text-slate-500"> · {p.zona}</span> : null}
                  {p.libres > 0 ? (
                    <span className="ml-1.5 font-semibold" style={{ color: CYAN }}>{p.libres} libres</span>
                  ) : (
                    <span className="ml-1.5 text-red-400">completa</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      {/* Ventajas */}
      <section className="border-y border-white/5 bg-white/[0.015]">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: CYAN }}>
            Ventajas del circuito LED
          </p>
          <h2 className="mt-2 text-3xl font-bold uppercase md:text-5xl">¿Por qué elegirnos?</h2>
          <p className="mt-3 max-w-xl text-slate-400">
            No es solo publicidad, es dominio de ciudad. Una cobertura que garantiza visibilidad + identidad.
          </p>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {VENTAJAS.map((v) => (
              <div key={v.n} className="border border-white/10 p-6">
                <p className="text-3xl font-bold text-white/20">{v.n}</p>
                <h3 className="mt-2 font-bold uppercase tracking-wide" style={{ color: CYAN }}>{v.t}</h3>
                <p className="mt-2 text-sm text-slate-300">{v.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section id="como" className="mx-auto max-w-6xl px-4 py-16">
        <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: CYAN }}>
          Proceso simple
        </p>
        <h2 className="mt-2 text-3xl font-bold uppercase md:text-5xl">¿Cómo funciona?</h2>
        <p className="mt-3 max-w-xl text-slate-400">
          En 4 pasos simples tu marca ya está impactando en toda la ciudad.
        </p>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PASOS.map((p) => (
            <div key={p.n} className="border border-white/10 p-6">
              <p className="text-4xl font-bold" style={{ color: CYAN }}>{p.n}</p>
              <h3 className="mt-2 font-bold uppercase tracking-wide">{p.t}</h3>
              <p className="mt-2 text-sm text-slate-300">{p.d}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 text-center">
          <a
            href={`${wa}?text=${encodeURIComponent("Hola! Quiero empezar mi campaña en pantallas LED.")}`}
            className="inline-block px-8 py-4 text-sm font-bold uppercase tracking-wider text-[#050A0B]"
            style={{ backgroundColor: CYAN }}
          >
            Empezá tu campaña hoy
          </a>
          <p className="mt-2 text-[10px] uppercase tracking-widest text-slate-500">
            Sin compromiso · Respuesta inmediata
          </p>
        </div>
      </section>

      {/* Venta y colocación */}
      <section id="venta" className="border-y border-white/5 bg-white/[0.015]">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: CYAN }}>
              Expertos en tecnología
            </p>
            <h2 className="mt-2 text-3xl font-bold uppercase md:text-5xl">Venta y colocación.</h2>
            <p className="mt-4 text-slate-300">
              Proveemos e instalamos gran variedad de pantallas LED: tótems, indoor y outdoor. Nos
              encargamos de la estructura e instalación.
            </p>
            <ul className="mt-6 space-y-4 text-sm">
              <li>
                <p className="font-bold uppercase tracking-wide">Hardware de élite</p>
                <p className="text-slate-400">Módulos de alta definición con el brillo y durabilidad líder del mercado.</p>
              </li>
              <li>
                <p className="font-bold uppercase tracking-wide">Instalación llave en mano</p>
                <p className="text-slate-400">Equipo técnico especializado para montajes complejos y configuración integral.</p>
              </li>
              <li>
                <p className="font-bold uppercase tracking-wide">Soporte y garantía</p>
                <p className="text-slate-400">Mantenimiento preventivo y asistencia técnica para asegurar tu inversión.</p>
              </li>
            </ul>
            <a
              href={`${wa}?text=${encodeURIComponent("Hola! Quiero consultar por venta o colocación de pantallas LED.")}`}
              className="mt-6 inline-block border px-6 py-3 text-xs font-bold uppercase tracking-wider"
              style={{ borderColor: CYAN, color: CYAN }}
            >
              Consultar por venta o colocación
            </a>
          </div>
          <div className="grid grid-cols-2 gap-3 self-center">
            {["/avefenix/inst_1.jpg", "/avefenix/led_1.jpg", "/avefenix/big_1.jpg", "/avefenix/spo_1.jpg"].map((src) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={src} src={src} alt="Instalaciones de pantallas LED" className="aspect-square w-full border border-white/10 object-cover" />
            ))}
          </div>
        </div>
      </section>

      {/* CTA + formulario (lead directo al CRM) */}
      <section id="contacto" className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <h2 className="text-4xl font-bold uppercase leading-[0.95] md:text-6xl">
              ¿Listo para <span style={{ color: CYAN }}>iluminar</span> Bahía?
            </h2>
            <p className="mt-4 max-w-md text-slate-300">
              Tu marca o comercio, en el centro de todas las miradas. Unite a nuestra red exclusiva de
              alcance masivo.
            </p>
            <p className="mt-6 text-sm text-slate-400">
              📞 {tel} · ✉️ {email}
            </p>
            <p className="mt-1 text-[10px] uppercase tracking-widest text-slate-500">
              Sin compromiso · Consulta gratuita
            </p>
          </div>
          <div className="border border-white/10 bg-white/[0.02] p-6">
            <ConsultaForm slug={tenant.slug} />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t border-white/5 bg-white/[0.015]">
        <div className="mx-auto max-w-4xl px-4 py-16">
          <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: CYAN }}>
            Resolvé tus dudas
          </p>
          <h2 className="mt-2 text-3xl font-bold uppercase md:text-5xl">Preguntas frecuentes.</h2>
          <div className="mt-8 divide-y divide-white/10 border-y border-white/10">
            {FAQ.map(([q, a], i) => (
              <details key={q} className="group py-4">
                <summary className="flex cursor-pointer items-baseline gap-4 text-left font-semibold marker:content-none">
                  <span className="text-sm text-white/25">{String(i + 1).padStart(2, "0")}</span>
                  <span className="flex-1">{q}</span>
                  <span className="text-white/40 transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 pl-9 text-sm text-slate-300">{a}</p>
              </details>
            ))}
          </div>
          <p className="mt-6 text-center text-sm text-slate-400">
            ¿Tenés otra duda que no aparece acá?{" "}
            <a
              href={`${wa}?text=${encodeURIComponent("Hola! Tengo una consulta sobre las pantallas LED.")}`}
              className="font-semibold underline"
              style={{ color: CYAN }}
            >
              Consultanos por WhatsApp
            </a>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-xs text-slate-500">
          <p>
            {branding.displayName} — La red de publicidad digital exterior líder en Bahía Blanca.
          </p>
          <p>
            {tel} · {email}
          </p>
          <p>© {new Date().getFullYear()} AVE FÉNIX LED</p>
        </div>
      </footer>

      {/* WhatsApp flotante */}
      <a
        href={`${wa}?text=${encodeURIComponent("Hola! Quiero info de las pantallas LED.")}`}
        className="fixed bottom-5 right-5 z-50 flex h-13 w-13 items-center justify-center rounded-full bg-[#25D366] p-3.5 shadow-lg transition hover:scale-105"
        aria-label="WhatsApp"
      >
        <svg viewBox="0 0 24 24" fill="white" className="h-7 w-7">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      </a>
    </div>
  );
}
