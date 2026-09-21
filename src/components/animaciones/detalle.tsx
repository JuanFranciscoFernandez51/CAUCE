"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ANIMACIONES } from "./registro";
import { PreviewViva } from "./preview-viva";

type Prop = { nombre: string; tipo: string; opcional: boolean; porDefecto: string | null; nota: string | null };
type Fuente = { codigo: string; dependencias: string[]; props: Prop[] };

const WA = "https://wa.me/5492915757101?text=";

/**
 * Ficha de una animación, estilo React Bits: demo grande, anterior/siguiente,
 * descripción, y en el admin las pestañas de uso, props, dependencias y código.
 */
export function DetalleAnimacion({ id, modo }: { id: string; modo: "admin" | "publico" }) {
  const i = ANIMACIONES.findIndex((a) => a.id === id);
  const a = ANIMACIONES[i];
  const base = modo === "admin" ? "/admin/animaciones" : "/animaciones";
  const [tab, setTab] = useState<"uso" | "props" | "codigo">("uso");
  const [fuente, setFuente] = useState<Fuente | null>(null);
  const [copiado, setCopiado] = useState<string | null>(null);
  const [recarga, setRecarga] = useState(0);

  useEffect(() => {
    if (modo !== "admin" || !a) return;
    fetch(`/api/admin/animaciones/codigo?ruta=${encodeURIComponent(a.ruta)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setFuente)
      .catch(() => setFuente(null));
  }, [modo, a]);

  if (!a) {
    return (
      <div className="py-24 text-center">
        <p className="text-lg font-semibold">No encontré esa animación.</p>
        <Link href={base} className="mt-3 inline-block text-sm underline">Volver al catálogo</Link>
      </div>
    );
  }

  const ant = ANIMACIONES[(i - 1 + ANIMACIONES.length) % ANIMACIONES.length];
  const sig = ANIMACIONES[(i + 1) % ANIMACIONES.length];
  const parecidas = ANIMACIONES.filter((x) => x.categoria === a.categoria && x.id !== a.id).slice(0, 3);

  async function copiar(clave: string, texto: string) {
    await navigator.clipboard.writeText(texto);
    setCopiado(clave);
    setTimeout(() => setCopiado(null), 1800);
  }

  const instalar = fuente?.dependencias.length ? `npm i ${fuente.dependencias.join(" ")}` : null;

  return (
    <div className="space-y-6">
      {/* Migas + anterior / siguiente */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Link href={base} className="hover:text-foreground">Animaciones</Link>
          <span>/</span>
          <span>{a.categoria}</span>
        </div>
        <div className="flex gap-2">
          <Link href={`${base}/${ant.id}`} className="rounded-lg border border-border px-3 py-1.5 transition hover:bg-muted" title={ant.nombre}>
            ← {ant.nombre}
          </Link>
          <Link href={`${base}/${sig.id}`} className="rounded-lg border border-border px-3 py-1.5 transition hover:bg-muted" title={sig.nombre}>
            {sig.nombre} →
          </Link>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">{a.categoria} · {a.origen}</p>
        <h1 className="mt-1 text-3xl font-bold sm:text-4xl">{a.nombre}</h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">{a.descripcion}</p>
      </div>

      {/* Demo grande */}
      <div className="overflow-hidden rounded-2xl border border-border">
        <div className="relative">
          <PreviewViva key={recarga} pesada={a.pesada}>
            <a.Preview />
          </PreviewViva>
          {a.categoria === "Fondos" ? (
            <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
              Fondo de página · va detrás del contenido
            </span>
          ) : null}
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-border bg-card px-4 py-2.5 text-xs text-muted-foreground">
          <span>Mové el mouse, hacé click, arrastrá: la demo es real.</span>
          <button type="button" onClick={() => setRecarga((n) => n + 1)} className="rounded-md border border-border px-2.5 py-1 transition hover:bg-muted">
            ↻ Reiniciar
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5 lg:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Para qué le sirve al negocio</p>
          <p className="mt-2 text-lg leading-relaxed">{a.argumento}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Ficha</p>
          <dl className="mt-2 space-y-1.5 text-sm">
            <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Categoría</dt><dd>{a.categoria}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Tecnología</dt><dd>{a.pesada ? "WebGL / 3D" : "CSS + JS"}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-muted-foreground">En el celu</dt><dd>{a.pesada ? "Versión liviana" : "Completa"}</dd></div>
          </dl>
        </div>
      </div>

      {modo === "admin" ? (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex flex-wrap items-center gap-1 border-b border-border px-3 py-2">
            {([["uso", "Uso"], ["props", `Props${fuente ? ` (${fuente.props.length})` : ""}`], ["codigo", "Código fuente"]] as const).map(([k, l]) => (
              <button
                key={k}
                type="button"
                onClick={() => setTab(k)}
                className={`rounded-md px-3 py-1.5 text-sm transition ${tab === k ? "bg-foreground font-semibold text-background" : "text-muted-foreground hover:bg-muted"}`}
              >
                {l}
              </button>
            ))}
            <code className="ml-auto truncate text-[11px] text-muted-foreground">{a.ruta}</code>
          </div>

          <div className="space-y-4 p-4">
            {tab === "uso" ? (
              <>
                {instalar ? <Bloque titulo="Instalar" texto={instalar} copiado={copiado === "npm"} onCopiar={() => copiar("npm", instalar)} /> : null}
                <Bloque titulo="Usar" texto={a.uso} copiado={copiado === "uso"} onCopiar={() => copiar("uso", a.uso)} />
                {fuente?.dependencias.length === 0 ? <p className="text-xs text-muted-foreground">No necesita librerías extra.</p> : null}
              </>
            ) : null}

            {tab === "props" ? (
              fuente?.props.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="text-xs uppercase tracking-wide text-muted-foreground">
                      <tr><th className="py-2 pr-4">Prop</th><th className="py-2 pr-4">Tipo</th><th className="py-2 pr-4">Por defecto</th><th className="py-2">Nota</th></tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {fuente.props.map((p) => (
                        <tr key={p.nombre}>
                          <td className="py-2 pr-4 font-mono text-xs">{p.nombre}{p.opcional ? "" : " *"}</td>
                          <td className="py-2 pr-4 font-mono text-xs text-muted-foreground">{p.tipo}</td>
                          <td className="py-2 pr-4 font-mono text-xs">{p.porDefecto ?? "—"}</td>
                          <td className="py-2 text-xs text-muted-foreground">{p.nota ?? ""}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{fuente ? "Este componente no declara props tipadas; mirá el código fuente." : "Cargando…"}</p>
              )
            ) : null}

            {tab === "codigo" ? (
              fuente ? (
                <Bloque titulo={`${a.nombre}.tsx · ${fuente.codigo.split("\n").length} líneas`} texto={fuente.codigo} copiado={copiado === "src"} onCopiar={() => copiar("src", fuente.codigo)} alto />
              ) : (
                <p className="text-sm text-muted-foreground">Cargando…</p>
              )
            ) : null}
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-5">
          <div>
            <p className="font-semibold">¿Querés {a.nombre} en tu web?</p>
            <p className="text-sm text-muted-foreground">Lo adaptamos a tus colores, tu logo y tus fotos.</p>
          </div>
          <a
            href={`${WA}${encodeURIComponent(`Hola! Vi la animación "${a.nombre}" en Cauce y la quiero en mi web.`)}`}
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition hover:opacity-90"
          >
            La quiero en mi web
          </a>
        </div>
      )}

      {parecidas.length ? (
        <div>
          <p className="mb-3 text-sm font-semibold">Más de {a.categoria}</p>
          <div className="grid gap-4 sm:grid-cols-3">
            {parecidas.map((x) => (
              <Link key={x.id} href={`${base}/${x.id}`} className="block overflow-hidden rounded-xl border border-border bg-card transition hover:-translate-y-0.5 hover:shadow-lg">
                <PreviewViva pesada={x.pesada}>
                  <x.Preview />
                </PreviewViva>
                <p className="truncate px-3.5 py-2.5 text-sm font-semibold">{x.nombre}</p>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Bloque({ titulo, texto, copiado, onCopiar, alto }: { titulo: string; texto: string; copiado: boolean; onCopiar: () => void; alto?: boolean }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="flex items-center justify-between gap-3 border-b border-border bg-muted/50 px-3 py-1.5">
        <span className="text-xs font-medium text-muted-foreground">{titulo}</span>
        <button type="button" onClick={onCopiar} className="rounded-md bg-foreground px-2.5 py-1 text-[11px] font-semibold text-background transition hover:opacity-90">
          {copiado ? "✓ Copiado" : "Copiar"}
        </button>
      </div>
      <pre className={`overflow-auto bg-[#0b0b0f] p-4 text-[12px] leading-relaxed text-white/85 ${alto ? "max-h-[560px]" : ""}`}>
        <code>{texto}</code>
      </pre>
    </div>
  );
}
