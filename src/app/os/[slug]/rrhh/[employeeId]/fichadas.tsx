"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Card, ErrorState, Spinner } from "@/components/ui";
import { fmtDayLabel } from "../../_lib/dates";

export type FichadaRow = {
  id: string;
  date: string; // "YYYY-MM-DD" argentino
  in: string; // "HH:MM"
  out: string | null; // null = abierta
  ms: number;
  abierta: boolean;
  source: string;
};

/**
 * Fichadas del mes en lista, agrupadas por día, editables en la fila
 * (corregir horas, borrar) + alta manual de una fichada olvidada.
 */
export function FichadasEmpleado({
  slug,
  employeeId,
  month,
  rows,
}: {
  slug: string;
  employeeId: string;
  month: string; // "YYYY-MM"
  rows: FichadaRow[];
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [agregando, setAgregando] = useState(false);

  // Agrupar por día (rows ya vienen ordenadas por clockIn asc).
  const dias = new Map<string, FichadaRow[]>();
  for (const r of rows) {
    const list = dias.get(r.date) ?? [];
    list.push(r);
    dias.set(r.date, list);
  }

  async function guardar(id: string, date: string, hIn: string, hOut: string) {
    setBusyId(id);
    setError("");
    try {
      const res = await fetch(`/api/os/${slug}/time-entries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, in: hIn, out: hOut || null }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "No se pudo guardar");
      setEditId(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error de conexión");
    } finally {
      setBusyId(null);
    }
  }

  async function borrar(id: string) {
    if (!window.confirm("¿Borrar esta fichada?")) return;
    setBusyId(id);
    setError("");
    try {
      const res = await fetch(`/api/os/${slug}/time-entries/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "No se pudo borrar");
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error de conexión");
    } finally {
      setBusyId(null);
    }
  }

  async function crear(date: string, hIn: string, hOut: string) {
    setBusyId("nueva");
    setError("");
    try {
      const res = await fetch(`/api/os/${slug}/time-entries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId, date, in: hIn, out: hOut || null }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "No se pudo crear");
      setAgregando(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error de conexión");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Fichadas</h2>
        <Button variant="secondary" size="sm" onClick={() => setAgregando((v) => !v)}>
          {agregando ? "Cancelar" : "+ Fichada manual"}
        </Button>
      </div>

      {error ? <ErrorState message={error} /> : null}

      {agregando ? (
        <FichadaForm
          date={`${month}-01`}
          hIn="09:00"
          hOut="17:00"
          busy={busyId === "nueva"}
          submitLabel="Agregar"
          onSubmit={crear}
          onCancel={() => setAgregando(false)}
        />
      ) : null}

      {dias.size === 0 && !agregando ? (
        <Card className="px-4 py-6 text-center text-sm text-muted-foreground">
          Sin fichadas este mes. Se fichan desde la pantalla de RRHH, o cargá una manual.
        </Card>
      ) : (
        [...dias.entries()].map(([date, list]) => {
          const totalDia = list.reduce((a, r) => a + r.ms, 0);
          return (
            <Card key={date} className="p-0">
              <div className="flex items-center justify-between border-b bg-muted/50 px-3 py-1.5 sm:px-4">
                <p className="text-xs font-semibold capitalize">{fmtDayLabel(date)}</p>
                <p className="text-xs tabular-nums text-muted-foreground">{fmtHs(totalDia)}</p>
              </div>
              <div className="divide-y">
                {list.map((r) =>
                  editId === r.id ? (
                    <FichadaForm
                      key={r.id}
                      date={r.date}
                      hIn={r.in}
                      hOut={r.out ?? ""}
                      busy={busyId === r.id}
                      submitLabel="Guardar"
                      onSubmit={(d, i, o) => guardar(r.id, d, i, o)}
                      onCancel={() => setEditId(null)}
                    />
                  ) : (
                    <div
                      key={r.id}
                      className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 text-sm sm:px-4"
                    >
                      <span className="font-mono tabular-nums">
                        {r.in} – {r.out ?? "…"}
                      </span>
                      {r.abierta ? <Badge variant="success">Trabajando</Badge> : null}
                      {r.source === "manual" ? (
                        <span className="text-xs text-muted-foreground">manual</span>
                      ) : null}
                      <span className="ml-auto tabular-nums text-muted-foreground">
                        {fmtHs(r.ms)}
                      </span>
                      {busyId === r.id ? (
                        <Spinner className="text-muted-foreground" />
                      ) : (
                        <span className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => setEditId(r.id)}
                            className="rounded px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                            title="Corregir horas"
                          >
                            ✏️
                          </button>
                          <button
                            type="button"
                            onClick={() => void borrar(r.id)}
                            className="rounded px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-muted hover:text-destructive"
                            title="Borrar fichada"
                          >
                            🗑️
                          </button>
                        </span>
                      )}
                    </div>
                  )
                )}
              </div>
            </Card>
          );
        })
      )}
    </section>
  );
}

/** Fila de edición/alta: fecha + entrada + salida (vacía = abierta). */
function FichadaForm({
  date,
  hIn,
  hOut,
  busy,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  date: string;
  hIn: string;
  hOut: string;
  busy: boolean;
  submitLabel: string;
  onSubmit: (date: string, hIn: string, hOut: string) => void;
  onCancel: () => void;
}) {
  const [d, setD] = useState(date);
  const [i, setI] = useState(hIn);
  const [o, setO] = useState(hOut);

  const field =
    "h-8 rounded-md border border-input bg-card px-2 text-sm text-card-foreground focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-50";

  return (
    <div className="flex flex-wrap items-center gap-2 px-3 py-2 sm:px-4">
      <input
        type="date"
        className={field}
        value={d}
        onChange={(e) => setD(e.target.value)}
        disabled={busy}
        aria-label="Fecha"
      />
      <input
        type="time"
        className={field}
        value={i}
        onChange={(e) => setI(e.target.value)}
        disabled={busy}
        aria-label="Entrada"
      />
      <span className="text-muted-foreground">–</span>
      <input
        type="time"
        className={field}
        value={o}
        onChange={(e) => setO(e.target.value)}
        disabled={busy}
        aria-label="Salida (vacía = sigue abierta)"
        title="Dejala vacía si sigue trabajando"
      />
      <div className="ml-auto flex items-center gap-2">
        <Button variant="ghost" size="sm" type="button" onClick={onCancel} disabled={busy}>
          Cancelar
        </Button>
        <Button size="sm" type="button" onClick={() => onSubmit(d, i, o)} disabled={busy || !d || !i}>
          {busy ? <Spinner /> : null}
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}

function fmtHs(ms: number): string {
  const totalMin = Math.round(ms / 60_000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0 && m === 0) return "—";
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}
