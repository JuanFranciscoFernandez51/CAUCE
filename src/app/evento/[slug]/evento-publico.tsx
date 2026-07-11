"use client";

import { useEffect, useState } from "react";
import { Badge, Button, Card, ErrorState, Field, Input, Spinner } from "@/components/ui";
import { fmtCrono } from "@/app/os/[slug]/eventos/tiempos";

type RankingRow = {
  numero: number;
  nombre: string;
  categoria: string;
  mejorMs: number | null;
  intentos: number;
};

type EventoData = {
  negocio: string;
  nombre: string;
  fecha: string;
  lugar: string | null;
  categorias: string[];
  cupo: number;
  inscriptos: number;
  inscripcionesAbiertas: boolean;
  numerosTomados: number[];
  ranking: RankingRow[];
};

/** Ranking en vivo (poll cada 5s) + inscripción pública. */
export function EventoPublico({ slug, negocio }: { slug: string; negocio: string }) {
  const [data, setData] = useState<EventoData | null>(null);
  const [tab, setTab] = useState<"ranking" | "inscribirme">("ranking");

  useEffect(() => {
    let alive = true;
    const load = () =>
      fetch(`/api/public/evento/${slug}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (alive && d) setData(d);
        })
        .catch(() => undefined);
    void load();
    const t = setInterval(load, 5000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [slug]);

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-2 text-muted-foreground">
        <Spinner /> Cargando el evento…
      </div>
    );
  }

  const [yyyy, mm, dd] = data.fecha.split("-");

  return (
    <div className="mx-auto max-w-3xl space-y-5 px-4 py-8 sm:px-6">
      <header className="text-center">
        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">{negocio}</p>
        <h1 className="mt-1 text-3xl font-bold">{data.nombre}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {dd}/{mm}/{yyyy}
          {data.lugar ? ` · ${data.lugar}` : ""} · {data.inscriptos}/{data.cupo} inscriptos
        </p>
        {data.inscripcionesAbiertas ? (
          <Badge variant="success" className="mt-2">
            Inscripciones abiertas
          </Badge>
        ) : (
          <Badge className="mt-2">Inscripciones cerradas</Badge>
        )}
      </header>

      <div className="flex justify-center gap-1 border-b pb-px">
        {(
          [
            { key: "ranking", label: "🏁 Ranking en vivo" },
            ...(data.inscripcionesAbiertas ? [{ key: "inscribirme", label: "✍️ Inscribirme" }] : []),
          ] as { key: "ranking" | "inscribirme"; label: string }[]
        ).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`-mb-px rounded-t-md border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "ranking" ? <Ranking rows={data.ranking} /> : null}
      {tab === "inscribirme" && data.inscripcionesAbiertas ? (
        <Inscripcion slug={slug} data={data} onListo={() => setTab("ranking")} />
      ) : null}

      <p className="pt-4 text-center text-xs text-muted-foreground">
        ⚡ Powered by <a href="https://cauce.app" className="font-medium hover:text-foreground">Cauce</a>
      </p>
    </div>
  );
}

function Ranking({ rows }: { rows: RankingRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="rounded-md border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
        Todavía no hay inscriptos. ¡Sé el primero!
      </p>
    );
  }
  let pos = 0;
  return (
    <Card className="overflow-hidden p-0">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <th className="px-3 py-2">Pos</th>
            <th className="px-3 py-2">N°</th>
            <th className="px-3 py-2">Piloto</th>
            <th className="hidden px-3 py-2 sm:table-cell">Categoría</th>
            <th className="px-3 py-2 text-right">Mejor tiempo</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const tiene = r.mejorMs !== null;
            if (tiene) pos += 1;
            return (
              <tr key={r.numero} className="border-b last:border-0">
                <td className="px-3 py-2 font-bold tabular-nums">
                  {tiene ? (pos === 1 ? "🥇" : pos === 2 ? "🥈" : pos === 3 ? "🥉" : pos) : "—"}
                </td>
                <td className="px-3 py-2 font-mono tabular-nums text-muted-foreground">#{r.numero}</td>
                <td className="px-3 py-2 font-medium">{r.nombre}</td>
                <td className="hidden px-3 py-2 text-muted-foreground sm:table-cell">{r.categoria}</td>
                <td className="px-3 py-2 text-right font-mono font-semibold tabular-nums">
                  {tiene ? fmtCrono(r.mejorMs!) : `sin tiempo (${r.intentos} int.)`}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}

function Inscripcion({
  slug,
  data,
  onListo,
}: {
  slug: string;
  data: EventoData;
  onListo: () => void;
}) {
  const [numero, setNumero] = useState("");
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [categoria, setCategoria] = useState(data.categorias[0] ?? "General");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [listo, setListo] = useState(false);

  const tomado = numero !== "" && data.numerosTomados.includes(Number(numero));

  async function inscribirme(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/public/evento/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ numero: Number(numero), nombre, telefono, categoria }),
      });
      const d = await res.json().catch(() => null);
      if (!res.ok) throw new Error(d?.error ?? "No pudimos inscribirte");
      setListo(true);
      setTimeout(onListo, 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de conexión");
    } finally {
      setSaving(false);
    }
  }

  if (listo) {
    return (
      <Card className="p-6 text-center">
        <p className="text-3xl">✅</p>
        <p className="mt-2 font-semibold">¡Estás adentro con el #{numero}!</p>
        <p className="text-sm text-muted-foreground">Nos vemos en la largada.</p>
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <form onSubmit={inscribirme} className="space-y-4">
        {error ? <ErrorState message={error} /> : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Tu número (1-999)"
            help={tomado ? "⚠️ Ese número ya está tomado" : "El que va en tu pechera."}
          >
            <Input
              type="number"
              min={1}
              max={999}
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              required
            />
          </Field>
          <Field label="Categoría">
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
            >
              {data.categorias.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Tu nombre">
            <Input value={nombre} onChange={(e) => setNombre(e.target.value)} required />
          </Field>
          <Field label="Tu WhatsApp">
            <Input value={telefono} onChange={(e) => setTelefono(e.target.value)} required />
          </Field>
        </div>
        <Button type="submit" disabled={saving || tomado} className="w-full">
          {saving ? <Spinner /> : null} Inscribirme
        </Button>
      </form>
    </Card>
  );
}
