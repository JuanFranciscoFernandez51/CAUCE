"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ApptStatus } from "@prisma/client";
import { Button, Spinner } from "@/components/ui";
import { APPT_STATUS, STATUS_DOT } from "../_lib/labels";
import { dayNum, fmtDayLabel } from "../_lib/dates";

/** Turno serializado para el cliente (fechas como ISO + hora ya formateada). */
export type CalAppt = {
  id: string;
  title: string;
  date: string; // "YYYY-MM-DD" (día argentino)
  time: string; // "HH:MM" argentino
  status: ApptStatus;
  employeeId: string | null;
  employeeName: string | null;
};

type Cell = { date: string; inMonth: boolean };
type EmployeeOption = { id: string; name: string };

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const GRID = { gridTemplateColumns: "repeat(7, minmax(0, 1fr))" };

export function MonthCalendar({
  slug,
  base,
  weeks,
  appointments,
  employees,
  today,
}: {
  slug: string;
  base: string;
  weeks: Cell[][];
  appointments: CalAppt[];
  employees: EmployeeOption[];
  today: string;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  // Estado local optimista de los turnos (se muestra; el server es la verdad).
  // El parent remonta este componente vía `key` cuando cambia el mes/recurso,
  // así que no hace falta resincronizar props→state acá.
  const [appts, setAppts] = useState<CalAppt[]>(appointments);

  const [dragId, setDragId] = useState<string | null>(null);
  const [overDay, setOverDay] = useState<string | null>(null);
  const [editing, setEditing] = useState<CalAppt | null>(null);
  const [toast, setToast] = useState<{ kind: "error" | "ok"; text: string } | null>(null);

  const byDay = new Map<string, CalAppt[]>();
  for (const a of appts) {
    const list = byDay.get(a.date) ?? [];
    list.push(a);
    byDay.set(a.date, list);
  }
  for (const list of byDay.values()) list.sort((a, b) => a.time.localeCompare(b.time));

  function flash(kind: "error" | "ok", text: string) {
    setToast({ kind, text });
    window.setTimeout(() => setToast(null), 3500);
  }

  // ── Reprogramar por drag&drop: cambia el día, mantiene la hora ──────────
  async function moveTo(id: string, newDate: string) {
    const appt = appts.find((a) => a.id === id);
    if (!appt || appt.date === newDate) return;
    const prevDate = appt.date;
    // Optimista.
    setAppts((cur) => cur.map((a) => (a.id === id ? { ...a, date: newDate } : a)));
    try {
      const res = await fetch(`/api/os/${slug}/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: newDate }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "No se pudo reprogramar");
      flash("ok", `Movido al ${fmtDayLabel(newDate)}`);
      startTransition(() => router.refresh());
    } catch (e) {
      // Rollback.
      setAppts((cur) => cur.map((a) => (a.id === id ? { ...a, date: prevDate } : a)));
      flash("error", e instanceof Error ? e.message : "Error al reprogramar");
    }
  }

  // ── Edición inline (hora/estado/recurso/título + borrar) ────────────────
  function patchLocal(id: string, patch: Partial<CalAppt>) {
    setAppts((cur) => cur.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  }
  function removeLocal(id: string) {
    setAppts((cur) => cur.filter((a) => a.id !== id));
  }

  return (
    <section className="space-y-3">
      {toast ? (
        <div
          className={`rounded-md border px-3 py-2 text-sm ${
            toast.kind === "error"
              ? "border-destructive/30 bg-destructive/10 text-destructive"
              : "border-success/30 bg-success/10 text-success"
          }`}
          role="status"
        >
          {toast.text}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm">
        <div
          className="grid border-b bg-muted text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
          style={GRID}
        >
          {WEEKDAYS.map((w) => (
            <div key={w} className="px-1 py-1.5">
              {w}
            </div>
          ))}
        </div>
        <div className="grid" style={GRID}>
          {weeks.flat().map((cell) => {
            const list = byDay.get(cell.date) ?? [];
            const isToday = cell.date === today;
            const isOver = overDay === cell.date;
            return (
              <div
                key={cell.date}
                onDragOver={(e) => {
                  if (dragId) {
                    e.preventDefault();
                    if (overDay !== cell.date) setOverDay(cell.date);
                  }
                }}
                onDragLeave={() => {
                  if (overDay === cell.date) setOverDay(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const id = e.dataTransfer.getData("text/plain") || dragId;
                  setOverDay(null);
                  setDragId(null);
                  if (id) void moveTo(id, cell.date);
                }}
                className={`relative min-h-20 border-b border-r p-1 text-left align-top transition-colors sm:min-h-24 ${
                  cell.inMonth ? "" : "bg-muted/40 text-muted-foreground"
                } ${isOver ? "bg-primary-soft ring-2 ring-inset ring-primary" : ""}`}
              >
                {/* Cabecera del día: número + botón "+" para alta rápida */}
                <div className="mb-1 flex items-center justify-between">
                  <span
                    className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs ${
                      isToday ? "bg-primary font-semibold text-primary-foreground" : ""
                    }`}
                  >
                    {dayNum(cell.date)}
                  </span>
                  <a
                    href={`${base}/turnos/nuevo?fecha=${cell.date}`}
                    title={`Nuevo turno el ${fmtDayLabel(cell.date)}`}
                    className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground opacity-0 transition hover:bg-muted hover:text-foreground focus:opacity-100 group-hover:opacity-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    +
                  </a>
                </div>

                {/* Click en zona vacía del día = alta rápida */}
                <button
                  type="button"
                  aria-label={`Crear turno el ${fmtDayLabel(cell.date)}`}
                  className="absolute inset-0 z-0 cursor-pointer"
                  tabIndex={-1}
                  onClick={() =>
                    router.push(`${base}/turnos/nuevo?fecha=${cell.date}`)
                  }
                />

                <div className="relative z-10 space-y-0.5">
                  {list.slice(0, 3).map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", a.id);
                        e.dataTransfer.effectAllowed = "move";
                        setDragId(a.id);
                      }}
                      onDragEnd={() => {
                        setDragId(null);
                        setOverDay(null);
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditing(a);
                      }}
                      title={`${a.time} · ${APPT_STATUS[a.status].label} · ${a.title}`}
                      className={`flex w-full cursor-grab items-center gap-1 truncate rounded px-1 py-0.5 text-left text-[11px] leading-tight transition hover:bg-muted active:cursor-grabbing ${
                        dragId === a.id ? "opacity-40" : ""
                      } ${a.status === "CANCELLED" ? "line-through opacity-60" : ""}`}
                    >
                      <span
                        className={`h-1.5 w-1.5 shrink-0 rounded-full ${STATUS_DOT[a.status]}`}
                      />
                      <span className="font-mono tabular-nums">{a.time}</span>
                      <span className="truncate">{a.title}</span>
                    </button>
                  ))}
                  {list.length > 3 ? (
                    <a
                      href={`${base}/turnos?vista=lista&fecha=${cell.date}`}
                      onClick={(e) => e.stopPropagation()}
                      className="block rounded px-1 text-[10px] text-muted-foreground hover:text-foreground hover:underline"
                    >
                      +{list.length - 3} más
                    </a>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Arrastrá un turno a otro día para reprogramarlo. Tocá un turno para editarlo, o un día vacío
        para crear uno.
      </p>

      {editing ? (
        <EditDialog
          slug={slug}
          appt={editing}
          employees={employees}
          onClose={() => setEditing(null)}
          onSaved={(patch) => {
            patchLocal(editing.id, patch);
            setEditing(null);
            flash("ok", "Turno actualizado");
            startTransition(() => router.refresh());
          }}
          onDeleted={() => {
            removeLocal(editing.id);
            setEditing(null);
            flash("ok", "Turno eliminado");
            startTransition(() => router.refresh());
          }}
          onError={(msg) => flash("error", msg)}
        />
      ) : null}
    </section>
  );
}

// ── Modal liviano de edición inline ───────────────────────────────────────
function EditDialog({
  slug,
  appt,
  employees,
  onClose,
  onSaved,
  onDeleted,
  onError,
}: {
  slug: string;
  appt: CalAppt;
  employees: EmployeeOption[];
  onClose: () => void;
  onSaved: (patch: Partial<CalAppt>) => void;
  onDeleted: () => void;
  onError: (msg: string) => void;
}) {
  const [title, setTitle] = useState(appt.title);
  const [time, setTime] = useState(appt.time);
  const [status, setStatus] = useState<ApptStatus>(appt.status);
  const [employeeId, setEmployeeId] = useState<string>(appt.employeeId ?? "");
  const [busy, setBusy] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  async function save() {
    if (!title.trim()) return onError("El título no puede quedar vacío");
    setBusy(true);
    const body: Record<string, unknown> = {};
    if (title.trim() !== appt.title) body.title = title.trim();
    if (time !== appt.time) body.time = time;
    if (status !== appt.status) body.status = status;
    if ((employeeId || null) !== (appt.employeeId ?? null)) {
      body.employeeId = employeeId || null;
    }
    if (Object.keys(body).length === 0) {
      setBusy(false);
      return onClose();
    }
    try {
      const res = await fetch(`/api/os/${slug}/appointments/${appt.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "No se pudo guardar");
      const empName =
        employeeId ? (employees.find((e) => e.id === employeeId)?.name ?? null) : null;
      onSaved({
        title: title.trim(),
        time,
        status,
        employeeId: employeeId || null,
        employeeName: empName,
      });
    } catch (e) {
      setBusy(false);
      onError(e instanceof Error ? e.message : "Error al guardar");
    }
  }

  async function del() {
    setBusy(true);
    try {
      const res = await fetch(`/api/os/${slug}/appointments/${appt.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "No se pudo eliminar");
      }
      onDeleted();
    } catch (e) {
      setBusy(false);
      onError(e instanceof Error ? e.message : "Error al eliminar");
    }
  }

  const fieldCls =
    "w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-card-foreground focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-50";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-lg border bg-card p-4 text-card-foreground shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold">Editar turno</h3>
            <p className="text-xs capitalize text-muted-foreground">{fmtDayLabel(appt.date)}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium">Título</span>
            <input
              className={fieldCls}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={busy}
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-xs font-medium">Hora</span>
              <input
                type="time"
                className={fieldCls}
                value={time}
                onChange={(e) => setTime(e.target.value)}
                disabled={busy}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium">Estado</span>
              <select
                className={fieldCls}
                value={status}
                onChange={(e) => setStatus(e.target.value as ApptStatus)}
                disabled={busy}
              >
                {(Object.keys(APPT_STATUS) as ApptStatus[]).map((s) => (
                  <option key={s} value={s}>
                    {APPT_STATUS[s].label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {employees.length > 0 ? (
            <label className="block">
              <span className="mb-1 block text-xs font-medium">Recurso</span>
              <select
                className={fieldCls}
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                disabled={busy}
              >
                <option value="">Sin asignar</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {/* Estado rápido por botones, además del select */}
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(APPT_STATUS) as ApptStatus[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                disabled={busy}
                className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition ${
                  status === s
                    ? "border-primary bg-primary-soft text-primary"
                    : "bg-card text-muted-foreground hover:bg-muted"
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[s]}`} />
                {APPT_STATUS[s].label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-2">
          {confirmDel ? (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-destructive">¿Eliminar?</span>
              <button
                type="button"
                onClick={del}
                disabled={busy}
                className="rounded border border-destructive/30 bg-destructive/10 px-2 py-1 text-xs font-medium text-destructive hover:bg-destructive/20 disabled:opacity-50"
              >
                Sí, borrar
              </button>
              <button
                type="button"
                onClick={() => setConfirmDel(false)}
                disabled={busy}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                No
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDel(true)}
              disabled={busy}
              className="text-sm text-destructive hover:underline disabled:opacity-50"
            >
              Eliminar
            </button>
          )}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" type="button" onClick={onClose} disabled={busy}>
              Cancelar
            </Button>
            <Button size="sm" type="button" onClick={save} disabled={busy}>
              {busy ? <Spinner /> : null}
              {busy ? "Guardando…" : "Guardar"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
