import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { CASOS_REALES, getCasoReal } from "@/lib/casos-reales";
import { shotsDeSettings } from "@/lib/casos";
import { PublicShell } from "@/components/public/shell";
import { Badge, Card } from "@/components/ui";
import { PrintFicha } from "./print-ficha";

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
  let shots: { titulo: string; url: string }[] = caso.shotsReales ?? [];
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
            <h1 className="text-3xl font-bold">{caso.nombre}</h1>
            <p className="text-sm text-muted-foreground">{caso.rubro}</p>
          </div>
          <div className="no-print flex gap-2">
            {caso.webUrl ? (
            <a
              href={caso.webUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Ver su web viva →
            </a>
            ) : null}
            <PrintFicha />
          </div>
        </div>

        <p className="mt-6 text-lg text-muted-foreground">{caso.resumen}</p>

        {/* Resultados */}
        <h2 className="mt-10 text-xl font-bold">Lo que el sistema les resolvió</h2>
        <ul className="mt-4 space-y-3">
          {caso.resultados.map((r) => (
            <li key={r} className="flex gap-3 text-sm">
              <span aria-hidden className="text-primary">✓</span>
              <span className="text-muted-foreground">{r}</span>
            </li>
          ))}
        </ul>

        {/* Módulos */}
        <h2 className="mt-10 text-xl font-bold">Qué tiene su sistema adentro</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {caso.modulos.map((m) => (
            <Card key={m.nombre} className="p-4">
              <p className="font-semibold">{m.nombre}</p>
              <p className="mt-1 text-sm text-muted-foreground">{m.detalle}</p>
            </Card>
          ))}
        </div>

        {/* Capturas reales */}
        {shots.length > 0 ? (
          <>
            <h2 className="mt-10 text-xl font-bold">Su sistema, de verdad</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Capturas reales — no mockups.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {shots.map((s) => (
                <figure key={s.url} className="overflow-hidden rounded-lg border bg-card">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.url} alt={s.titulo} className="w-full" loading="lazy" />
                  <figcaption className="border-t px-3 py-2 text-xs text-muted-foreground">
                    {s.titulo}
                  </figcaption>
                </figure>
              ))}
            </div>
          </>
        ) : null}

        {/* CTA */}
        <div className="no-print mt-12 rounded-lg border bg-muted/40 p-6 text-center">
          <Badge variant="primary">¿Tu negocio se parece?</Badge>
          <h2 className="mt-3 text-2xl font-bold">Armamos uno así, pero tuyo</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
            Nos sentamos con vos, entendemos cómo trabajás y el sistema se adapta a tu manera —
            con tu marca, tu rubro y tus precios.
          </p>
          <a
            href={`https://wa.me/5492915757101?text=${encodeURIComponent(`Hola! Vi el caso de ${caso.nombre} y quiero algo así para mi negocio.`)}`}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex h-11 items-center rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            Quiero el mío — hablemos por WhatsApp
          </a>
        </div>
      </div>
    </PublicShell>
  );
}
