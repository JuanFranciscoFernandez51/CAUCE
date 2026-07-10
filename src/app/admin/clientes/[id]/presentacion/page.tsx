import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { fmtUsd, fmtArs, getPricing } from "@/lib/pricing";
import { tenantBranding, MODULE_LABELS, tenantModules, type OsModule } from "@/lib/tenant";
import { AREA_LABELS } from "@/lib/casos";
import { PACK_LABELS } from "../../../_components/format";
import { PresentacionActions } from "./presentacion-actions";

export const dynamic = "force-dynamic";

type FlowStep = { paso?: number; titulo?: string; detalle?: string };

const LEVEL_LABELS: Record<string, string> = {
  N1: "Nivel 1 — Atención automática",
  N2: "Nivel 2 — Flujos conectados",
  N3: "Nivel 3 — Software de gestión",
  N4: "Nivel 4 — Operación a medida",
};

// Qué incluye cada módulo, en lenguaje claro para el cliente
const MODULE_BLURB: Record<OsModule, string> = {
  crm: "Todos tus clientes y consultas en un solo lugar, con su historial y seguimiento.",
  turnos: "Agenda online: tus clientes reservan solos y vos ves el día de un vistazo.",
  catalogo: "Tu catálogo y tu stock siempre al día, con precios y fotos.",
  taller: "Órdenes de trabajo del ingreso a la entrega, con aviso automático al cliente.",
  ventas: "Ventas con seña, permuta y cuotas: cada operación con su saldo al día.",
  rrhh: "Tu equipo, sus horarios y sus fichadas, ordenados.",
  caja: "Ingresos, gastos y cuentas con reportes claros de cómo viene el mes.",
  proyectos: "Tus proyectos y tareas, de la propuesta a la entrega.",
  sitio: "Tu página web pública, lista para mostrar y vender.",
};

export default async function PresentacionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Guard admin: la ruta vive bajo /admin (middleware ya protege), igual verificamos.
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") notFound();

  const client = await db.client.findUnique({
    where: { id },
    include: {
      procesos: { orderBy: [{ orden: "asc" }, { createdAt: "asc" }] },
      leads: {
        orderBy: { createdAt: "desc" },
        include: { blueprints: { orderBy: { createdAt: "desc" }, take: 1 } },
      },
    },
  });
  if (!client) notFound();

  // Blueprint vía el lead asociado al cliente (Lead.clientId → Blueprint.leadId)
  const blueprint =
    client.leads.flatMap((l) => l.blueprints).sort((a, b) => +b.createdAt - +a.createdAt)[0] ?? null;

  const branding = tenantBranding(client);
  const modules = tenantModules(client);
  const pricing = await getPricing().catch(() => null);
  const dolarArs = pricing?.dolarArs ?? null;

  // Sistema en números
  const [contacts, appointments, products, listings, employees] = await Promise.all([
    db.contact.count({ where: { clientId: client.id } }),
    db.appointment.count({ where: { clientId: client.id } }),
    db.product.count({ where: { clientId: client.id } }),
    db.listing.count({ where: { clientId: client.id } }),
    db.employee.count({ where: { clientId: client.id } }),
  ]);

  const flow = ((blueprint?.flow as FlowStep[] | null) ?? []).filter((s) => s && (s.titulo || s.detalle));

  // Inversión: pack del cliente, mensual (mrr o sugerido), setup sugerido
  const packLabel = PACK_LABELS[client.pack] ?? client.pack;
  const monthly = client.mrr > 0 ? client.mrr : blueprint?.suggestedMonthly ?? 0;
  const setup = blueprint?.suggestedSetup ?? 0;

  const sitioUrl = `/sitio/${client.slug}`;
  const tieneSitio = modules.includes("sitio");
  const tieneTurnos = modules.includes("turnos");

  // Capturas reales del sitio y el sistema (las genera scripts/capturar-cliente.ts → Cloudinary)
  const shots =
    ((client.settings as Record<string, unknown> | null)?.shots as
      | { titulo: string; grupo: string; url: string }[]
      | undefined) ?? [];
  const shotsWeb = shots.filter((s) => s.grupo === "web");
  const shotsSistema = shots.filter((s) => s.grupo === "sistema");

  const fecha = new Date().toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const numeros: { label: string; value: number }[] = [];
  if (contacts > 0) numeros.push({ label: "Contactos en tu CRM", value: contacts });
  if (appointments > 0) numeros.push({ label: "Turnos agendados", value: appointments });
  if (products > 0) numeros.push({ label: "Productos cargados", value: products });
  if (listings > 0) numeros.push({ label: "Publicaciones activas", value: listings });
  if (employees > 0) numeros.push({ label: "Integrantes del equipo", value: employees });

  const primary = branding.primary;
  const accent = branding.accent;

  function ars(usd: number): string | null {
    if (!dolarArs || usd <= 0) return null;
    return fmtArs(Math.round(usd * dolarArs));
  }

  return (
    <div
      className="presentacion fixed inset-0 z-40 overflow-auto bg-gray-100 print:static print:overflow-visible print:bg-white"
      style={
        { "--brand": primary, "--brand-accent": accent } as React.CSSProperties
      }
    >
      {/* Estilos de impresión: A4, page-breaks, sin chrome */}
      <style>{`
        @media print {
          @page { size: A4; margin: 14mm; }
          html, body { background: #fff !important; }
          /* Ocultar todo el chrome del admin (sidebar, header) y dejar solo la presentación */
          body * { visibility: hidden !important; }
          .presentacion, .presentacion * { visibility: visible !important; }
          .presentacion {
            position: absolute !important;
            inset: 0 !important;
            z-index: 9999 !important;
          }
          .slide {
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            border-radius: 0 !important;
            width: 100% !important;
            min-height: auto !important;
            break-after: page;
            padding: 0 !important;
          }
          .slide:last-child { break-after: auto; }
          .avoid-break { break-inside: avoid; }
        }
      `}</style>

      <div className="mx-auto flex max-w-[820px] flex-col gap-6 px-4 py-8 print:max-w-none print:gap-0 print:p-0">
        {/* ── PORTADA ─────────────────────────────────────── */}
        <section className="slide flex min-h-[60vh] flex-col justify-between rounded-2xl bg-white p-12 shadow-md print:min-h-0">
          <div className="flex items-center gap-4">
            {branding.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={branding.logo}
                alt={branding.displayName}
                className="h-16 w-16 rounded-xl border object-contain"
              />
            ) : (
              <div
                className="flex h-16 w-16 items-center justify-center rounded-xl text-2xl font-bold text-white"
                style={{ backgroundColor: primary }}
              >
                {branding.displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-2xl font-bold tracking-tight" style={{ color: primary }}>
                {branding.displayName}
              </p>
              {client.rubro ? (
                <p className="text-sm text-gray-500">{client.rubro}</p>
              ) : null}
            </div>
          </div>

          <div className="py-10">
            <div
              className="mb-5 h-1.5 w-20 rounded-full"
              style={{ backgroundColor: accent }}
            />
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-gray-900 sm:text-5xl">
              Tu negocio,
              <br />
              funcionando solo
            </h1>
            <p className="mt-4 max-w-md text-lg text-gray-600">
              Propuesta de transformación digital — armamos tu web, tu software de gestión y tus
              automatizaciones para que la operación corra sola.
            </p>
          </div>

          <div className="flex items-end justify-between border-t pt-5">
            <p className="text-sm text-gray-500">{fecha}</p>
            <p className="text-sm font-semibold text-gray-700">
              por <span style={{ color: primary }}>Cauce</span>
            </p>
          </div>
        </section>

        {/* ── DIAGNÓSTICO ──────────────────────────────────── */}
        <section className="slide rounded-2xl bg-white p-12 shadow-md">
          <SectionTitle accent={accent} kicker="01 — El diagnóstico" title="Qué resolvemos" />
          {blueprint ? (
            <>
              <p className="text-lg leading-relaxed text-gray-700">{blueprint.summary}</p>
              <p className="mt-4 inline-block rounded-full px-4 py-1.5 text-sm font-semibold"
                 style={{ backgroundColor: `${primary}1a`, color: primary }}>
                {LEVEL_LABELS[blueprint.level] ?? blueprint.level}
              </p>

              {flow.length > 0 ? (
                <div className="avoid-break mt-8">
                  <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400">
                    Cómo va a funcionar
                  </h3>
                  <ol className="space-y-4">
                    {flow.map((step, i) => (
                      <li key={i} className="flex gap-4">
                        <span
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                          style={{ backgroundColor: primary }}
                        >
                          {step.paso ?? i + 1}
                        </span>
                        <div>
                          {step.titulo ? (
                            <p className="font-semibold text-gray-900">{step.titulo}</p>
                          ) : null}
                          {step.detalle ? (
                            <p className="text-gray-600">{step.detalle}</p>
                          ) : null}
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              ) : null}
            </>
          ) : (
            <p className="text-lg leading-relaxed text-gray-700">
              Trabajamos sobre tu operación para sacarte de encima las tareas repetitivas: atención,
              seguimiento de clientes y gestión, todo en un mismo lugar y funcionando solo.
            </p>
          )}
        </section>

        {/* ── LO QUE ENTREGAMOS ────────────────────────────── */}
        <section className="slide rounded-2xl bg-white p-12 shadow-md">
          <SectionTitle accent={accent} kicker="02 — Lo que entregamos" title="Tres patas" />

          {/* (a) Web */}
          <div className="avoid-break mb-8">
            <Pata num="a" accent={accent} title="Tu página web" />
            {tieneSitio ? (
              <p className="mt-2 text-gray-700">
                Tu web pública, lista para mostrar y recibir clientes. Está online en{" "}
                <span className="font-medium" style={{ color: primary }}>
                  {sitioUrl}
                </span>
                {tieneTurnos ? " e incluye la reserva de turnos online." : "."}
              </p>
            ) : (
              <p className="mt-2 text-gray-700">
                Una presencia online profesional con tu marca, pensada para que te encuentren y te
                contacten.
              </p>
            )}
          </div>

          {/* (b) Software de gestión */}
          <div className="avoid-break mb-8">
            <Pata num="b" accent={accent} title="Tu software de gestión" />
            {modules.length > 0 ? (
              <ul className="mt-3 space-y-2.5">
                {modules.map((m) => (
                  <li key={m} className="flex gap-3">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: accent }} />
                    <p className="text-gray-700">
                      <span className="font-semibold text-gray-900">{MODULE_LABELS[m]}</span>
                      {" — "}
                      {MODULE_BLURB[m]}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-gray-700">
                Tu propio software con tu marca, para llevar la operación del día a día sin planillas
                sueltas.
              </p>
            )}
          </div>

          {/* (c) Procesos */}
          <div className="avoid-break">
            <Pata num="c" accent={accent} title="Tus procesos" />
            {client.procesos.length > 0 ? (
              <ul className="mt-3 space-y-2.5">
                {client.procesos.map((p) => (
                  <li key={p.id} className="flex gap-3">
                    <span className="mt-1 text-base">⚡</span>
                    <div>
                      <p className="font-semibold text-gray-900">{p.nombre}</p>
                      <p className="text-gray-600">{p.queHace}</p>
                      <p className="mt-0.5 text-xs uppercase tracking-wide text-gray-400">
                        {p.cuando}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-gray-700">
                Procesos que hacen el trabajo solos: responder consultas, avisar de cada oportunidad y
                cargar todo en tu sistema sin que toques nada.
              </p>
            )}
          </div>
        </section>

        {/* ── ASÍ QUEDÓ (capturas reales) ──────────────────── */}
        {shots.length > 0 ? (
          <section className="slide rounded-2xl bg-white p-12 shadow-md">
            <SectionTitle accent={accent} kicker="03 — Así quedó" title="Tu negocio, ya armado" />
            {shotsWeb.length > 0 ? (
              <div className="mb-8">
                <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Tu página web</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  {shotsWeb.map((s) => (
                    <figure key={s.url} className="avoid-break overflow-hidden rounded-xl border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={s.url} alt={s.titulo} className="w-full border-b object-cover" />
                      <figcaption className="bg-gray-50 px-3 py-2 text-sm font-medium text-gray-600">{s.titulo}</figcaption>
                    </figure>
                  ))}
                </div>
              </div>
            ) : null}
            {shotsSistema.length > 0 ? (
              <div>
                <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Tu sistema de gestión</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  {shotsSistema.map((s) => (
                    <figure key={s.url} className="avoid-break overflow-hidden rounded-xl border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={s.url} alt={s.titulo} className="w-full border-b object-cover" />
                      <figcaption className="bg-gray-50 px-3 py-2 text-sm font-medium text-gray-600">{s.titulo}</figcaption>
                    </figure>
                  ))}
                </div>
              </div>
            ) : null}
          </section>
        ) : null}

        {/* ── SISTEMA EN NÚMEROS ───────────────────────────── */}
        {numeros.length > 0 ? (
          <section className="slide rounded-2xl bg-white p-12 shadow-md">
            <SectionTitle accent={accent} kicker="03 — Tu sistema" title="En números" />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {numeros.map((n) => (
                <div key={n.label} className="avoid-break rounded-xl border bg-gray-50 p-5">
                  <p className="text-3xl font-bold" style={{ color: primary }}>
                    {n.value.toLocaleString("es-AR")}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">{n.label}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* ── INVERSIÓN ────────────────────────────────────── */}
        <section className="slide rounded-2xl bg-white p-12 shadow-md">
          <SectionTitle accent={accent} kicker="04 — Inversión" title="Tu plan" />
          <div
            className="avoid-break rounded-2xl p-8 text-white"
            style={{ backgroundColor: primary }}
          >
            <p className="text-sm font-medium uppercase tracking-wide opacity-80">Pack</p>
            <p className="text-3xl font-bold">{packLabel}</p>

            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <div>
                <p className="text-sm opacity-80">Puesta en marcha (una vez)</p>
                <p className="text-2xl font-semibold">
                  {setup > 0 ? fmtUsd(setup) : "A coordinar"}
                </p>
                {setup > 0 && ars(setup) ? (
                  <p className="text-sm opacity-70">≈ {ars(setup)}</p>
                ) : null}
              </div>
              <div>
                <p className="text-sm opacity-80">Abono mensual</p>
                <p className="text-2xl font-semibold">
                  {monthly > 0 ? `${fmtUsd(monthly)}/mes` : "A coordinar"}
                </p>
                {monthly > 0 && ars(monthly) ? (
                  <p className="text-sm opacity-70">≈ {ars(monthly)}/mes</p>
                ) : null}
              </div>
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-500">
            Los valores en pesos son de referencia al dólar del día y pueden ajustarse.
          </p>
        </section>

        {/* ── PRÓXIMOS PASOS ───────────────────────────────── */}
        <section className="slide rounded-2xl bg-white p-12 shadow-md">
          <SectionTitle accent={accent} kicker="05 — Puesta en marcha" title="Próximos pasos" />
          <ol className="space-y-4">
            {[
              "Confirmás esta propuesta y arrancamos.",
              "Configuramos tu web, tu software y tus automatizaciones con tu marca.",
              "Probamos todo junto y te lo dejamos andando.",
              "Quedás con soporte y mejoras todos los meses.",
            ].map((paso, i) => (
              <li key={i} className="flex gap-4">
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ backgroundColor: accent }}
                >
                  {i + 1}
                </span>
                <p className="pt-1 text-gray-700">{paso}</p>
              </li>
            ))}
          </ol>

          <div className="avoid-break mt-10 rounded-2xl border bg-gray-50 p-6">
            <p className="text-sm font-semibold uppercase tracking-wide text-gray-400">
              Hablemos
            </p>
            <p className="mt-1 text-lg font-semibold text-gray-900">Cauce</p>
            <p className="text-gray-600">Software para PyMEs que funciona solo.</p>
            <p className="mt-2 text-sm text-gray-500">cauce.app</p>
          </div>
        </section>
      </div>

      <PresentacionActions accent={accent} />
    </div>
  );
}

function SectionTitle({ kicker, title, accent }: { kicker: string; title: string; accent: string }) {
  return (
    <div className="avoid-break mb-6">
      <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: accent }}>
        {kicker}
      </p>
      <h2 className="mt-1 text-3xl font-bold tracking-tight text-gray-900">{title}</h2>
    </div>
  );
}

function Pata({ num, title, accent }: { num: string; title: string; accent: string }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold text-white"
        style={{ backgroundColor: accent }}
      >
        {num}
      </span>
      <h3 className="text-xl font-bold text-gray-900">{title}</h3>
    </div>
  );
}
