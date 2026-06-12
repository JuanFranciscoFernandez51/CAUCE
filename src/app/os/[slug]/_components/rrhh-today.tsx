"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Card, ErrorState, Spinner } from "@/components/ui";

export type TodayRow = {
  id: string;
  name: string;
  role: string | null;
  status: "working" | "done" | "none";
  label: string; // "Trabajando desde 09:12" | "Terminó 09:00–17:30" | "Sin fichar"
};

/** Sección "Hoy" de RRHH: estado por empleado + marcar entrada/salida. */
export function RrhhToday({ slug, rows }: { slug: string; rows: TodayRow[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function mark(employeeId: string, action: "entrada" | "salida") {
    setBusyId(employeeId);
    setError("");
    try {
      const res = await fetch(`/api/os/${slug}/time-entries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId, action }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "No se pudo registrar la fichada");
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error de conexión");
    } finally {
      setBusyId(null);
    }
  }

  const btn =
    "h-8 rounded-md border bg-card px-3 text-xs font-medium hover:bg-muted disabled:opacity-50";

  return (
    <div className="space-y-3">
      {error ? <ErrorState message={error} /> : null}
      <Card className="divide-y p-0">
        {rows.map((r) => {
          const busy = busyId === r.id;
          return (
            <div
              key={r.id}
              className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2.5 sm:px-4"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{r.name}</p>
                {r.role ? (
                  <p className="truncate text-xs text-muted-foreground">{r.role}</p>
                ) : null}
              </div>
              <Badge
                variant={
                  r.status === "working" ? "success" : r.status === "done" ? "default" : "outline"
                }
              >
                {r.label}
              </Badge>
              {busy ? (
                <Spinner className="text-muted-foreground" />
              ) : r.status === "working" ? (
                <button
                  type="button"
                  className={`${btn} text-destructive`}
                  onClick={() => mark(r.id, "salida")}
                >
                  Marcar salida
                </button>
              ) : (
                <button
                  type="button"
                  className={`${btn} text-success`}
                  onClick={() => mark(r.id, "entrada")}
                >
                  Marcar entrada
                </button>
              )}
            </div>
          );
        })}
      </Card>
    </div>
  );
}
