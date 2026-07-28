import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { CASOS_REALES, getCasoReal } from "@/lib/casos-reales";
import { shotsDeSettings } from "@/lib/casos";
import { PublicShell } from "@/components/public/shell";
import { PrintFicha } from "./print-ficha";
import { Galeria } from "./galeria";

export function generateStaticParams() {
  return CASOS_REALES.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const caso = getCasoReal(slug);
  return {
    title: caso ? `${caso.nombre} — caso real de Cauce` : "Caso",
    description: caso?.resumen,
  };
}

export const revalidate = 3600;

export default async function CasoRealPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const caso = getCasoReal(slug);
  if (!caso) notFound();

  // Prioridad: capturas de SU web real; si no hay, las del tenant en Cauce.
  let shots: { titulo: string; url: string; href?: string }[] = caso.shotsReales ?? [];
  if (shots.length === 0) {
    const tenant = await db.client.findUnique({ where: { slug: caso.shotsSlug } });
    shots = shotsDeSettings(tenant?.settings).slice(0, 6);
  }

  return (
    <PublicShell>
      {/* Print: solo la ficha, en hoja limpia */}
      <style>{`
        @media print {
          @page { size: A4; margin: 12mm; }
          header, footer, .no-print { display: none !important; }
          .ficha { max-width: none !important; }
        }
      `}</style>

      <div className="ficha mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <Link href="/casos" className="no-print text-sm text-muted-foreground hover:text-foreground">
          ← Casos reales
        </Link>

        {/* Cabecera de marca */}
        <div className="mt-4 flex flex-wrap items-center gap-5">
          {caso.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={caso.logo}
              alt={caso.nombre}
              className={`h-16 w-auto rounded-md object-contain ${caso.logoOscuro ? "bg-slate-900 p-2" : ""}`}
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-md bg-primary text-3xl font-bold text-primary-foreground">
              {caso.nombre[0]}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="title-mega text-3xl sm:text-4xl">{caso.nombre}</h1>
            <p className="text-sm text-muted-foreground">{caso.rubro}</p>
          </div>
          <div className="no-print flex gap-2">
            {caso.webUrl ? (
            <a
              href={caso.webUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 items-center rounded-full bg-[#111111] px-5 text-sm font-medium text-white transition hover:bg-black"
            >
              Ver su web viva →
            </a>
            ) : null}
            <PrintFicha />
          </div>
        </div>

        <p className="mt-6 text-lg text-muted-foreground">{caso.resumen}</p>

        {/* Resultados */}
        <h2 className="mt-12 font-display text-2xl font-medium tracking-tight">Lo que el sistema les resolvió</h2>
        <ul className="mt-4 space-y-3">
          {caso.resultados.map((r) => (
            <li key={r} className="flex gap-3 text-sm">
              <span aria-hidden className="text-primary">✓</span>
              <span className="text-muted-foreground">{r}</span>
            </li>
          ))}
        </ul>

        {/* Módulos */}
        <h2 className="mt-12 font-display text-2xl font-medium tracking-tight">Qué tiene su sistema adentro</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {caso.modulos.map((m) => (
            <div key={m.nombre} className="rounded-2xl border border-black/5 bg-card p-5">
              <p className="font-semibold">{m.nombre}</p>
              <p className="mt-1 text-sm text-muted-foreground">{m.detalle}</p>
            </div>
          ))}
        </div>

        {/* Proceso paso a paso */}
        {caso.proceso?.length ? (
          <>
            <h2 className="mt-12 font-display text-2xl font-medium tracking-tight">Cómo trabaja, paso a paso</h2>
            <ol className="mt-4 space-y-3">
              {caso.proceso.map((paso, i) => (
                <li key={paso} className="flex gap-3 text-sm">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-bold text-primary">
                    {i + 1}
                  </span>
                  <span className="text-muted-foreground">{paso}</span>
                </li>
              ))}
            </ol>
          </>
        ) : null}

        {/* Automatizaciones: lo que pasa solo */}
        {caso.automatizaciones?.length ? (
          <>
            <h2 className="mt-12 font-display text-2xl font-medium tracking-tight">Lo que pasa solo</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Las automatizaciones del sistema: cada cosa dispara la siguiente, sin que nadie tenga
              que acordarse.
            </p>
            <div className="mt-4 space-y-4">
              {caso.automatizaciones.map((a) => (
                <div key={a.titulo} className="rounded-2xl border border-black/5 bg-card p-5">
                  <p className="font-semibold">⚡ {a.titulo}</p>
                  <ol className="mt-2 space-y-1.5">
                    {a.flujo.map((paso, i) => (
                      <li key={paso} className="flex gap-2 text-sm text-muted-foreground">
                        <span aria-hidden className="shrink-0 text-primary">
                          {i === 0 ? "▸" : "→"}
                        </span>
                        {paso}
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </>
        ) : null}

        {/* Documentos reales descargables */}
        {caso.documentos?.length ? (
          <>
            <h2 className="mt-12 font-display text-2xl font-medium tracking-tight">
              Los documentos que salen solos
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              PDFs reales generados por el sistema, con su marca — datos difuminados por privacidad.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {caso.documentos.map((d) => (
                <a
                  key={d.url}
                  href={d.url.replace("/upload/", "/upload/fl_attachment/")}
                  className="group overflow-hidden rounded-2xl border border-black/5 bg-card shadow-[0_2px_24px_-10px_rgba(17,17,17,0.1)] transition hover:-translate-y-0.5"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={d.url} alt={d.titulo} className="aspect-[3/4] w-full object-cover object-top" />
                  <div className="flex items-center justify-between gap-2 p-3">
                    <p className="text-sm font-medium">{d.titulo}</p>
                    <span className="text-primary transition group-hover:translate-y-0.5">⬇</span>
                  </div>
                </a>
              ))}
            </div>
          </>
        ) : null}

        {/* Capturas reales */}
        {shots.length > 0 ? (
          <>
            <h2 className="mt-12 font-display text-2xl font-medium tracking-tight">Su sistema, de verdad</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Capturas reales — no mockups.
            </p>
            <Galeria shots={shots} />
          </>
        ) : null}

        {/* Su sistema por dentro (admin real, datos protegidos) */}
        {caso.shotsAdmin?.length ? (
          <>
            <h2 className="mt-12 font-display text-2xl font-medium tracking-tight">Su sistema por dentro</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              El panel de administración real — con los datos difuminados por privacidad.
            </p>
            <Galeria shots={caso.shotsAdmin} />
          </>
        ) : null}

        {/* CTA */}
        <div className="menta-dark no-print mt-14 rounded-[32px] px-6 py-12 text-center sm:px-10">
          <span className="inline-flex items-center rounded-full border border-white/15 px-4 py-1.5 text-xs font-medium text-accent">
            ¿Tu negocio se parece?
          </span>
          <h2 className="title-mega mt-4 text-3xl sm:text-4xl">Armamos uno así, pero tuyo</h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-muted-foreground">
            Nos sentamos con vos, entendemos cómo trabajás y el sistema se adapta a tu manera —
            con tu marca, tu rubro y tus precios.
          </p>
          <a
            href={`https://wa.me/5492915757101?text=${encodeURIComponent(`Hola! Vi el caso de ${caso.nombre} y quiero algo así para mi negocio.`)}`}
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-flex h-12 items-center rounded-full bg-white px-7 text-sm font-semibold text-[#111111] transition hover:bg-white/90"
          >
            Quiero el mío — hablemos por WhatsApp
          </a>
        </div>
      </div>
    </PublicShell>
  );
}
