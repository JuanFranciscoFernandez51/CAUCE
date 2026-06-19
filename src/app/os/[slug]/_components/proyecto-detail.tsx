"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Card, Input, Select, Spinner, Textarea } from "@/components/ui";
import { fmtDateShort } from "../_lib/dates";
import {
  initials,
  PROYECTO_AREA_LABELS,
  PROYECTO_AREAS,
  PROYECTO_STATUS_LABELS,
  PROYECTO_STATUS_VARIANT,
  PROYECTO_STATUSES,
  TAREA_STATUS_DOT,
  TAREA_STATUS_LABELS,
  TAREA_STATUSES,
  type ProyectoArea,
  type ProyectoStatus,
  type TareaStatus,
} from "../_lib/proyectos";

export type DetailProyecto = {
  id: string;
  name: string;
  clienteName: string | null;
  status: string;
  area: string | null;
  budgetUsd: number | null;
  startDate: string | null; // "YYYY-MM-DD"
  dueDate: string | null; // "YYYY-MM-DD"
  description: string | null;
};

export type KanbanTarea = {
  id: string;
  title: string;
  status: string;
  assigneeId: string | null;
  dueAt: string | null; // "YYYY-MM-DD"
  hours: number | null;
};

type EmployeeOption = { id: string; name: string };

export function ProyectoDetail({
  slug,
  proyecto,
  tareas,
  employees,
}: {
  slug: string;
  proyecto: DetailProyecto;
  tareas: KanbanTarea[];
  employees: EmployeeOption[];
}) {
  const [toast, setToast] = useState<{ kind: "error" | "ok"; text: string } | null>(null);
  function flash(kind: "error" | "ok", text: string) {
    setToast({ kind, text });
    window.setTimeout(() => setToast(null), 3500);
  }

  return (
    <div className="space-y-6">
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

      <ProyectoHeader slug={slug} proyecto={proyecto} onFlash={flash} />

      <Kanban
        slug={slug}
        proyectoId={proyecto.id}
        initial={tareas}
        employees={employees}
        onFlash={flash}
      />
    </div>
  );
}

// ── Cabecera del proyecto con edición inline ────────────────────────────────
function ProyectoHeader({
  slug,
  proyecto,
  onFlash,
}: {
  slug: string;
  proyecto: DetailProyecto;
  onFlash: (kind: "error" | "ok", text: string) => void;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  // Estado local del status para cambio rápido sin abrir el editor.
  const [status, setStatus] = useState<string>(proyecto.status);

  // Campos del editor.
  const [name, setName] = useState(proyecto.name);
  const [clienteName, setClienteName] = useState(proyecto.clienteName ?? "");
  const [area, setArea] = useState(proyecto.area ?? "");
  const [budget, setBudget] = useState(
    proyecto.budgetUsd != null ? String(proyecto.budgetUsd) : ""
  );
  const [startDate, setStartDate] = useState(proyecto.startDate ?? "");
  const [dueDate, setDueDate] = useState(proyecto.dueDate ?? "");
  const [description, setDescription] = useState(proyecto.description ?? "");

  const statusVariant =
    PROYECTO_STATUS_VARIANT[status as ProyectoStatus] ?? "default";
  const areaLabel = area ? PROYECTO_AREA_LABELS[area as ProyectoArea] : null;

  async function patch(body: Record<string, unknown>): Promise<boolean> {
    const res = await fetch(`/api/os/${slug}/proyectos/${proyecto.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.error ?? "No se pudo guardar");
    }
    return true;
  }

  async function changeStatus(next: string) {
    const prev = status;
    if (next === prev) return;
    setStatus(next); // optimista
    try {
      await patch({ status: next });
      onFlash("ok", `Estado: ${PROYECTO_STATUS_LABELS[next as ProyectoStatus]}`);
      startTransition(() => router.refresh());
    } catch (e) {
      setStatus(prev); // rollback
      onFlash("error", e instanceof Error ? e.message : "Error al cambiar el estado");
    }
  }

  async function save() {
    if (!name.trim()) return onFlash("error", "El nombre no puede quedar vacío");
    setBusy(true);
    try {
      await patch({
        name: name.trim(),
        clienteName: clienteName.trim() || null,
        area: area || null,
        budgetUsd: budget.trim() ? Number(budget) : null,
        startDate: startDate || null,
        dueDate: dueDate || null,
        description: description.trim() || null,
      });
      setEditing(false);
      onFlash("ok", "Proyecto actualizado");
      startTransition(() => router.refresh());
    } catch (e) {
      onFlash("error", e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setBusy(false);
    }
  }

  async function del() {
    setBusy(true);
    try {
      const res = await fetch(`/api/os/${slug}/proyectos/${proyecto.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "No se pudo eliminar");
      }
      router.push(`/os/${slug}/proyectos`);
      startTransition(() => router.refresh());
    } catch (e) {
      setBusy(false);
      onFlash("error", e instanceof Error ? e.message : "Error al eliminar");
    }
  }

  if (editing) {
    return (
      <Card className="p-4 sm:p-6">
        <div className="space-y-4">
          <FieldRow label="Nombre">
            <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </FieldRow>
          <FieldRow label="Cliente">
            <Input value={clienteName} onChange={(e) => setClienteName(e.target.value)} />
          </FieldRow>
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldRow label="Área">
              <Select value={area} onChange={(e) => setArea(e.target.value)}>
                <option value="">Sin área</option>
                {PROYECTO_AREAS.map((a) => (
                  <option key={a} value={a}>
                    {PROYECTO_AREA_LABELS[a]}
                  </option>
                ))}
              </Select>
            </FieldRow>
            <FieldRow label="Presupuesto (USD)">
              <Input
                type="number"
                min="0"
                step="any"
                inputMode="decimal"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
              />
            </FieldRow>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldRow label="Inicio">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </FieldRow>
            <FieldRow label="Entrega">
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </FieldRow>
          </div>
          <FieldRow label="Descripción">
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </FieldRow>
        </div>
        <div className="mt-4 flex items-center justify-between gap-2">
          {confirmDel ? (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-destructive">¿Eliminar proyecto?</span>
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
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={() => setEditing(false)}
              disabled={busy}
            >
              Cancelar
            </Button>
            <Button size="sm" type="button" onClick={save} disabled={busy}>
              {busy ? <Spinner /> : null}
              {busy ? "Guardando…" : "Guardar"}
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold">{proyecto.name}</h1>
          {proyecto.clienteName ? (
            <p className="text-sm text-muted-foreground">{proyecto.clienteName}</p>
          ) : null}
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Badge variant={statusVariant}>
              {PROYECTO_STATUS_LABELS[status as ProyectoStatus] ?? status}
            </Badge>
            {areaLabel ? <Badge variant="outline">{areaLabel}</Badge> : null}
            {proyecto.budgetUsd != null ? (
              <span className="text-xs text-muted-foreground">
                USD {proyecto.budgetUsd.toLocaleString("es-AR")}
              </span>
            ) : null}
          </div>
        </div>
        <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
          Editar
        </Button>
      </div>

      {proyecto.startDate || proyecto.dueDate ? (
        <p className="mt-3 text-sm text-muted-foreground">
          {proyecto.startDate ? `Inicio ${fmtDateShort(new Date(`${proyecto.startDate}T12:00:00-03:00`))}` : ""}
          {proyecto.startDate && proyecto.dueDate ? " · " : ""}
          {proyecto.dueDate ? `Entrega ${fmtDateShort(new Date(`${proyecto.dueDate}T12:00:00-03:00`))}` : ""}
        </p>
      ) : null}

      {proyecto.description ? (
        <p className="mt-3 whitespace-pre-wrap text-sm">{proyecto.description}</p>
      ) : null}

      {/* Cambio de estado rápido por chips */}
      <div className="mt-4 flex flex-wrap gap-1.5">
        {PROYECTO_STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => changeStatus(s)}
            className={`rounded-full border px-2.5 py-1 text-xs font-medium transition ${
              status === s
                ? "border-primary bg-primary-soft text-primary"
                : "bg-card text-muted-foreground hover:bg-muted"
            }`}
          >
            {PROYECTO_STATUS_LABELS[s]}
          </button>
        ))}
      </div>
    </Card>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium">{label}</span>
      {children}
    </label>
  );
}

// ── Tablero kanban con drag&drop nativo (patrón month-calendar) ─────────────
function Kanban({
  slug,
  proyectoId,
  initial,
  employees,
  onFlash,
}: {
  slug: string;
  proyectoId: string;
  initial: KanbanTarea[];
  employees: EmployeeOption[];
  onFlash: (kind: "error" | "ok", text: string) => void;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [tareas, setTareas] = useState<KanbanTarea[]>(initial);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<TareaStatus | null>(null);
  const [editing, setEditing] = useState<KanbanTarea | null>(null);

  const empName = (id: string | null) =>
    id ? employees.find((e) => e.id === id)?.name ?? null : null;

  // ── Mover de columna por drag&drop (PATCH status, optimista + rollback) ──
  async function moveTo(id: string, newStatus: TareaStatus) {
    const t = tareas.find((x) => x.id === id);
    if (!t || t.status === newStatus) return;
    const prev = t.status;
    setTareas((cur) => cur.map((x) => (x.id === id ? { ...x, status: newStatus } : x)));
    try {
      const res = await fetch(`/api/os/${slug}/proyecto-tareas/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "No se pudo mover la tarea");
      }
      startTransition(() => router.refresh());
    } catch (e) {
      setTareas((cur) => cur.map((x) => (x.id === id ? { ...x, status: prev } : x)));
      onFlash("error", e instanceof Error ? e.message : "Error al mover");
    }
  }

  function addLocal(t: KanbanTarea) {
    setTareas((cur) => [...cur, t]);
  }
  function patchLocal(id: string, patch: Partial<KanbanTarea>) {
    setTareas((cur) => cur.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  }
  function removeLocal(id: string) {
    setTareas((cur) => cur.filter((x) => x.id !== id));
  }

  return (
    <section className="space-y-3">
      <h2 className="font-semibold">Tareas</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {TAREA_STATUSES.map((status) => {
          const items = tareas.filter((t) => t.status === status);
          const isOver = overCol === status;
          return (
            <div
              key={status}
              onDragOver={(e) => {
                if (dragId) {
                  e.preventDefault();
                  if (overCol !== status) setOverCol(status);
                }
              }}
              onDragLeave={(e) => {
                // Sólo limpiar si salimos de verdad de la columna.
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  if (overCol === status) setOverCol(null);
                }
              }}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData("text/plain") || dragId;
                setOverCol(null);
                setDragId(null);
                if (id) void moveTo(id, status);
              }}
              className={`flex flex-col rounded-lg bg-muted/60 p-2 transition-colors ${
                isOver ? "bg-primary-soft ring-2 ring-inset ring-primary" : ""
              }`}
            >
              <div className="flex items-center justify-between px-1 pb-2 pt-1">
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <span className={`h-1.5 w-1.5 rounded-full ${TAREA_STATUS_DOT[status]}`} />
                  {TAREA_STATUS_LABELS[status]}
                </p>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {items.length}
                </span>
              </div>

              <div className="space-y-2">
                {items.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/plain", t.id);
                      e.dataTransfer.effectAllowed = "move";
                      setDragId(t.id);
                    }}
                    onDragEnd={() => {
                      setDragId(null);
                      setOverCol(null);
                    }}
                    onClick={() => setEditing(t)}
                    className={`w-full cursor-grab rounded-md border bg-card p-2.5 text-left shadow-sm transition hover:border-primary/40 active:cursor-grabbing ${
                      dragId === t.id ? "opacity-40" : ""
                    }`}
                  >
                    <p className="text-sm font-medium leading-tight">{t.title}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      {t.assigneeId ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                            {initials(empName(t.assigneeId) ?? "?")}
                          </span>
                          <span className="truncate">{empName(t.assigneeId)}</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">Sin asignar</span>
                      )}
                      {t.hours != null ? (
                        <span className="text-[11px] text-muted-foreground">· {t.hours} h</span>
                      ) : null}
                      {t.dueAt ? (
                        <span className="text-[11px] text-muted-foreground">
                          · {fmtDateShort(new Date(`${t.dueAt}T12:00:00-03:00`))}
                        </span>
                      ) : null}
                    </div>
                  </button>
                ))}

                <QuickAdd
                  slug={slug}
                  proyectoId={proyectoId}
                  status={status}
                  onCreated={addLocal}
                  onError={(m) => onFlash("error", m)}
                />
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        Arrastrá una tarea a otra columna para cambiarle el estado. Tocá una tarea para editarla.
      </p>

      {editing ? (
        <TareaDialog
          slug={slug}
          tarea={editing}
          employees={employees}
          onClose={() => setEditing(null)}
          onSaved={(patch) => {
            patchLocal(editing.id, patch);
            setEditing(null);
            onFlash("ok", "Tarea actualizada");
            startTransition(() => router.refresh());
          }}
          onDeleted={() => {
            removeLocal(editing.id);
            setEditing(null);
            onFlash("ok", "Tarea eliminada");
            startTransition(() => router.refresh());
          }}
          onError={(m) => onFlash("error", m)}
        />
      ) : null}
    </section>
  );
}

// ── Alta rápida de tarea en una columna ─────────────────────────────────────
function QuickAdd({
  slug,
  proyectoId,
  status,
  onCreated,
  onError,
}: {
  slug: string;
  proyectoId: string;
  status: TareaStatus;
  onCreated: (t: KanbanTarea) => void;
  onError: (msg: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);

  async function create() {
    if (!title.trim()) {
      setOpen(false);
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/os/${slug}/proyecto-tareas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proyectoId, title: title.trim(), status }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "No se pudo crear la tarea");
      onCreated(data.tarea as KanbanTarea);
      setTitle("");
      // Queda abierto para cargar varias seguidas.
    } catch (e) {
      onError(e instanceof Error ? e.message : "Error al crear");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-md border border-dashed px-2 py-1.5 text-left text-xs text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
      >
        + Agregar tarea
      </button>
    );
  }

  return (
    <div className="rounded-md border bg-card p-2 shadow-sm">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Título de la tarea"
        autoFocus
        disabled={busy}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            void create();
          }
          if (e.key === "Escape") {
            setTitle("");
            setOpen(false);
          }
        }}
      />
      <div className="mt-2 flex items-center gap-2">
        <Button size="sm" type="button" onClick={create} disabled={busy}>
          {busy ? <Spinner /> : null}
          Agregar
        </Button>
        <button
          type="button"
          onClick={() => {
            setTitle("");
            setOpen(false);
          }}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Listo
        </button>
      </div>
    </div>
  );
}

// ── Modal de edición de tarea ───────────────────────────────────────────────
function TareaDialog({
  slug,
  tarea,
  employees,
  onClose,
  onSaved,
  onDeleted,
  onError,
}: {
  slug: string;
  tarea: KanbanTarea;
  employees: EmployeeOption[];
  onClose: () => void;
  onSaved: (patch: Partial<KanbanTarea>) => void;
  onDeleted: () => void;
  onError: (msg: string) => void;
}) {
  const [title, setTitle] = useState(tarea.title);
  const [assigneeId, setAssigneeId] = useState(tarea.assigneeId ?? "");
  const [dueAt, setDueAt] = useState(tarea.dueAt ?? "");
  const [hours, setHours] = useState(tarea.hours != null ? String(tarea.hours) : "");
  const [status, setStatus] = useState<TareaStatus>(tarea.status as TareaStatus);
  const [busy, setBusy] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  async function save() {
    if (!title.trim()) return onError("El título no puede quedar vacío");
    setBusy(true);
    const body: Record<string, unknown> = {};
    if (title.trim() !== tarea.title) body.title = title.trim();
    if (status !== tarea.status) body.status = status;
    if ((assigneeId || null) !== (tarea.assigneeId ?? null)) body.assigneeId = assigneeId || null;
    if ((dueAt || null) !== (tarea.dueAt ?? null)) body.dueAt = dueAt || null;
    const hoursVal = hours.trim() ? Number(hours) : null;
    if (hoursVal !== (tarea.hours ?? null)) body.hours = hoursVal;
    if (Object.keys(body).length === 0) {
      setBusy(false);
      return onClose();
    }
    try {
      const res = await fetch(`/api/os/${slug}/proyecto-tareas/${tarea.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "No se pudo guardar");
      onSaved({
        title: title.trim(),
        status,
        assigneeId: assigneeId || null,
        dueAt: dueAt || null,
        hours: hoursVal,
      });
    } catch (e) {
      setBusy(false);
      onError(e instanceof Error ? e.message : "Error al guardar");
    }
  }

  async function del() {
    setBusy(true);
    try {
      const res = await fetch(`/api/os/${slug}/proyecto-tareas/${tarea.id}`, {
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
        className="max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-lg border bg-card p-4 text-card-foreground shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between gap-2">
          <h3 className="font-semibold">Editar tarea</h3>
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

          <label className="block">
            <span className="mb-1 block text-xs font-medium">Estado</span>
            <select
              className={fieldCls}
              value={status}
              onChange={(e) => setStatus(e.target.value as TareaStatus)}
              disabled={busy}
            >
              {TAREA_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {TAREA_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium">Responsable</span>
            <select
              className={fieldCls}
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
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

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-xs font-medium">Vencimiento</span>
              <input
                type="date"
                className={fieldCls}
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
                disabled={busy}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium">Horas</span>
              <input
                type="number"
                min="0"
                step="any"
                inputMode="decimal"
                className={fieldCls}
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                disabled={busy}
              />
            </label>
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
