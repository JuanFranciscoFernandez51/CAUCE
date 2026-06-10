"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, ButtonLink, Card, ErrorState, Input, Spinner } from "@/components/ui";
import { WEEKDAY_LABELS } from "../_lib/labels";

export type AvailabilityRow = {
  weekday: number;
  startTime: string;
  endTime: string;
  slotMinutes: number;
};

type Franja = { startTime: string; endTime: string; slotMinutes: number };
type DayState = { active: boolean; franjas: Franja[] };

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Lun..Dom
const DEFAULT_FRANJA: Franja = { startTime: "09:00", endTime: "18:00", slotMinutes: 60 };

function buildInitial(rows: AvailabilityRow[]): Record<number, DayState> {
  const out: Record<number, DayState> = {};
  for (const d of DAY_ORDER) out[d] = { active: false, franjas: [] };
  for (const r of rows) {
    const day = out[r.weekday];
    if (!day || day.franjas.length >= 2) continue;
    day.active = true;
    day.franjas.push({
      startTime: r.startTime,
      endTime: r.endTime,
      slotMinutes: r.slotMinutes,
    });
  }
  return out;
}

export function AvailabilityForm({
  slug,
  initial,
}: {
  slug: string;
  initial: AvailabilityRow[];
}) {
  const router = useRouter();
  const [days, setDays] = useState<Record<number, DayState>>(() => buildInitial(initial));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  function setDay(weekday: number, next: DayState) {
    setDays((prev) => ({ ...prev, [weekday]: next }));
    setSaved(false);
  }

  function toggleDay(weekday: number, active: boolean) {
    const day = days[weekday];
    setDay(weekday, {
      active,
      franjas: active && day.franjas.length === 0 ? [{ ...DEFAULT_FRANJA }] : day.franjas,
    });
  }

  function setFranja(weekday: number, idx: number, patch: Partial<Franja>) {
    const day = days[weekday];
    const franjas = day.franjas.map((f, i) => (i === idx ? { ...f, ...patch } : f));
    setDay(weekday, { ...day, franjas });
  }

  function addFranja(weekday: number) {
    const day = days[weekday];
    if (day.franjas.length >= 2) return;
    const last = day.franjas[day.franjas.length - 1];
    setDay(weekday, {
      ...day,
      franjas: [
        ...day.franjas,
        { startTime: "16:00", endTime: "20:00", slotMinutes: last?.slotMinutes ?? 60 },
      ],
    });
  }

  function removeFranja(weekday: number, idx: number) {
    const day = days[weekday];
    const franjas = day.franjas.filter((_, i) => i !== idx);
    setDay(weekday, { active: franjas.length > 0, franjas });
  }

  async function onSave() {
    setError("");
    const blocks: AvailabilityRow[] = [];
    for (const d of DAY_ORDER) {
      const day = days[d];
      if (!day.active) continue;
      for (const f of day.franjas) {
        if (!f.startTime || !f.endTime) {
          setError(`Completá los horarios de ${WEEKDAY_LABELS[d]}`);
          return;
        }
        if (f.endTime <= f.startTime) {
          setError(`En ${WEEKDAY_LABELS[d]}, el fin tiene que ser después del inicio`);
          return;
        }
        if (!f.slotMinutes || f.slotMinutes < 5) {
          setError(`En ${WEEKDAY_LABELS[d]}, la duración del turno mínima es 5 minutos`);
          return;
        }
        blocks.push({ weekday: d, ...f });
      }
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/os/${slug}/availability`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blocks }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "No se pudo guardar");
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de conexión");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {error ? <ErrorState message={error} /> : null}
      <Card className="divide-y p-0">
        {DAY_ORDER.map((d) => {
          const day = days[d];
          return (
            <div key={d} className="px-4 py-3">
              <label className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={day.active}
                  onChange={(e) => toggleDay(d, e.target.checked)}
                  className="h-4 w-4 accent-[var(--primary)]"
                />
                <span className="text-sm font-medium">{WEEKDAY_LABELS[d]}</span>
                {!day.active ? (
                  <span className="text-xs text-muted-foreground">Cerrado</span>
                ) : null}
              </label>

              {day.active ? (
                <div className="mt-2 space-y-2 pl-6">
                  {day.franjas.map((f, i) => (
                    <div key={i} className="flex flex-wrap items-center gap-2">
                      <Input
                        type="time"
                        value={f.startTime}
                        onChange={(e) => setFranja(d, i, { startTime: e.target.value })}
                        className="h-9 w-auto"
                        aria-label={`${WEEKDAY_LABELS[d]} franja ${i + 1} inicio`}
                      />
                      <span className="text-xs text-muted-foreground">a</span>
                      <Input
                        type="time"
                        value={f.endTime}
                        onChange={(e) => setFranja(d, i, { endTime: e.target.value })}
                        className="h-9 w-auto"
                        aria-label={`${WEEKDAY_LABELS[d]} franja ${i + 1} fin`}
                      />
                      <span className="text-xs text-muted-foreground">· turnos de</span>
                      <Input
                        type="number"
                        min={5}
                        step={5}
                        value={f.slotMinutes}
                        onChange={(e) =>
                          setFranja(d, i, { slotMinutes: Number(e.target.value) })
                        }
                        className="h-9 w-20"
                        aria-label={`${WEEKDAY_LABELS[d]} franja ${i + 1} minutos por turno`}
                      />
                      <span className="text-xs text-muted-foreground">min</span>
                      <button
                        type="button"
                        onClick={() => removeFranja(d, i)}
                        className="text-xs text-muted-foreground hover:text-destructive"
                      >
                        Quitar
                      </button>
                    </div>
                  ))}
                  {day.franjas.length < 2 ? (
                    <button
                      type="button"
                      onClick={() => addFranja(d)}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      + Agregar franja (ej: turno tarde)
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={onSave} disabled={saving}>
          {saving ? <Spinner /> : null}
          {saving ? "Guardando…" : "Guardar disponibilidad"}
        </Button>
        <ButtonLink href={`/os/${slug}/turnos`} variant="ghost">
          Volver a la agenda
        </ButtonLink>
        {saved ? (
          <span className="text-sm font-medium text-success">Disponibilidad guardada ✓</span>
        ) : null}
      </div>
    </div>
  );
}
