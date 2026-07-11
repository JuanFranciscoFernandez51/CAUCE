"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Card, ErrorState, Field, Input, Spinner } from "@/components/ui";
import { fmtCrono, mejorTiempo, ordenarRanking, PENALIZACIONES, type Intento } from "../tiempos";

type Comp = {
  id: string;
  numero: number;
  nombre: string;
  categoria: string;
  intentos: Intento[];
};

export type EventoPanelData = {
  id: string;
  nombre: string;
  fecha: string;
  lugar: string | null;
  categorias: string[];
  cupo: number;
  inscripcionesAbiertas: boolean;
  activo: boolean;
  competidores: Comp[];
};

/**
 * Panel del evento: cronómetro grande (largar/parar con penalizaciones en
 * vivo), alta rápida de competidores y ranking. El público ve lo mismo en
 * /evento/<slug>, actualizado solo.
 */
export function PanelEvento({ slug, evento }: { slug: string; evento: EventoPanelData }) {
  const router = useRouter();
  const [comps, setComps] = useState<Comp[]>(evento.competidores);
  const [corriendoId, setCorriendoId] = useState<string | null>(null);
  const [desde, setDesde] = useState<number | null>(null);
  const [ahora, setAhora] = useState(0);
  const [penales, setPenales] = useState<{ label: string; seg: number }[]>([]);
  const [error, setError] = useState("");
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Tick del cronómetro en pantalla (25 fps alcanza y sobra).
  useEffect(() => {
    if (desde === null) return;
    timer.current = setInterval(() => setAhora(Date.now()), 40);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [desde]);

  const corriendo = comps.find((c) => c.id === corriendoId) ?? null;
  const msEnVivo = desde !== null ? Math.max(0, ahora - desde) : 0;
  const penalSeg = penales.reduce((s, p) => s + p.seg, 0);

  async function guardarIntentos(comp: Comp, intentos: Intento[]) {
    setComps((cs) => cs.map((c) => (c.id === comp.id ? { ...c, intentos } : c)));
    const res = await fetch(`/api/os/${slug}/eventos/${evento.id}/competidores`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ competidorId: comp.id, intentos }),
    });
    if (!res.ok) setError("No se pudo guardar el tiempo");
    else router.refresh();
  }

  function largar(comp: Comp) {
    setCorriendoId(comp.id);
    setPenales([]);
    setDesde(Date.now());
    setAhora(Date.now());
    setError("");
  }

  function parar(dsq: boolean) {
    if (!corriendo || desde === null) return;
    const ms = Date.now() - desde;
    const intento: Intento = { ms, penalSeg, dsq };
    void guardarIntentos(corriendo, [...corriendo.intentos, intento]);
    setCorriendoId(null);
    setDesde(null);
    setPenales([]);
  }

  async function toggleEvento(campo: "inscripcionesAbiertas" | "activo", valor: boolean) {
    const res = await fetch(`/api/os/${slug}/eventos/${evento.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [campo]: valor }),
    });
    if (res.ok) router.refresh();
  }

  const ranking = ordenarRanking(comps);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold">{evento.nombre}</h1>
        {evento.activo ? <Badge variant="success">En la web</Badge> : null}
        <span className="text-sm text-muted-foreground">
          {comps.length}/{evento.cupo} inscriptos
        </span>
        <div className="ml-auto flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void toggleEvento("inscripcionesAbiertas", !evento.inscripcionesAbiertas)}
          >
            {evento.inscripcionesAbiertas ? "Cerrar inscripciones" : "Abrir inscripciones"}
          </Button>
          {!evento.activo ? (
            <Button size="sm" onClick={() => void toggleEvento("activo", true)}>
              Mostrar en la web
            </Button>
          ) : null}
        </div>
      </div>

      {error ? <ErrorState message={error} /> : null}

      {/* CRONÓMETRO */}
      <Card className="p-5 text-center">
        {corriendo ? (
          <>
            <p className="text-sm text-muted-foreground">
              Corriendo: <span className="font-semibold text-foreground">#{corriendo.numero} {corriendo.nombre}</span>
              {penalSeg > 0 ? <span className="ml-2 text-destructive">+{penalSeg}s</span> : null}
            </p>
            <p className="my-3 font-mono text-6xl font-bold tabular-nums">{fmtCrono(msEnVivo)}</p>
            <div className="flex flex-wrap justify-center gap-2">
              {PENALIZACIONES.map((p) => (
                <Button
                  key={p.label}
                  variant="secondary"
                  size="sm"
                  onClick={() => setPenales((ps) => [...ps, p])}
                >
                  {p.label} +{p.seg}s
                </Button>
              ))}
              <Button size="sm" onClick={() => parar(false)}>
                🏁 Llegó
              </Button>
              <Button variant="ghost" size="sm" onClick={() => parar(true)}>
                DSQ
              </Button>
            </div>
          </>
        ) : (
          <p className="py-4 text-sm text-muted-foreground">
            Tocá <span className="font-semibold text-foreground">▶ Largar</span> al lado de un competidor
            para arrancar el cronómetro.
          </p>
        )}
      </Card>

      {/* COMPETIDORES + RANKING */}
      <Card className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Competidores y ranking</h2>
          <a
            href={`/evento/${slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-primary hover:underline"
          >
            Ver pantalla pública →
          </a>
        </div>

        <AltaRapida slug={slug} eventoId={evento.id} categorias={evento.categorias} />

        {ranking.length === 0 ? (
          <p className="mt-3 rounded-md border border-dashed px-4 py-5 text-center text-sm text-muted-foreground">
            Sin competidores. Se anotan desde la web o cargalos acá arriba.
          </p>
        ) : (
          <ul className="mt-3 divide-y">
            {ranking.map((c, i) => {
              const mejor = mejorTiempo(c.intentos);
              return (
                <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                  <div className="flex items-center gap-3">
                    <span className="w-8 text-center font-bold tabular-nums">
                      {mejor !== null ? (i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1) : "—"}
                    </span>
                    <div>
                      <p className="font-medium">
                        <span className="font-mono text-sm text-muted-foreground">#{c.numero}</span> {c.nombre}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {c.categoria} · {c.intentos.length} intento{c.intentos.length === 1 ? "" : "s"}
                        {mejor !== null ? ` · mejor ${fmtCrono(mejor)}` : ""}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={corriendoId === c.id ? "secondary" : "primary"}
                    disabled={corriendoId !== null}
                    onClick={() => largar(c)}
                  >
                    ▶ Largar
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}

function AltaRapida({
  slug,
  eventoId,
  categorias,
}: {
  slug: string;
  eventoId: string;
  categorias: string[];
}) {
  const router = useRouter();
  const [numero, setNumero] = useState("");
  const [nombre, setNombre] = useState("");
  const [categoria, setCategoria] = useState(categorias[0] ?? "General");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function agregar(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/os/${slug}/eventos/${eventoId}/competidores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ numero: Number(numero), nombre: nombre.trim(), categoria }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "No se pudo agregar");
      setNumero("");
      setNombre("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de conexión");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={agregar} className="flex flex-wrap items-end gap-2 rounded-md border p-3">
      <Field label="N°">
        <Input type="number" min={1} max={999} value={numero} onChange={(e) => setNumero(e.target.value)} className="w-20" required />
      </Field>
      <Field label="Nombre">
        <Input value={nombre} onChange={(e) => setNombre(e.target.value)} className="w-44" required />
      </Field>
      <Field label="Categoría">
        <select
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          className="h-10 rounded-md border border-input bg-card px-3 text-sm"
        >
          {categorias.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </Field>
      <Button type="submit" size="sm" disabled={saving}>
        {saving ? <Spinner /> : null} + Competidor
      </Button>
      {error ? <p className="w-full text-xs text-destructive">{error}</p> : null}
    </form>
  );
}
