"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Badge,
  Button,
  ButtonLink,
  Card,
  EmptyState,
  ErrorState,
  Field,
  Input,
  Select,
  Spinner,
  Textarea,
} from "@/components/ui";
import { fmtDateShort } from "../_lib/dates";
import {
  PROYECTO_AREA_LABELS,
  PROYECTO_AREAS,
  PROYECTO_BOARD_STATUSES,
  PROYECTO_STATUS_LABELS,
  PROYECTO_STATUSES,
  type ProyectoArea,
  type ProyectoStatus,
} from "../_lib/proyectos";

export type BoardProyecto = {
  id: string;
  name: string;
  clienteName: string | null;
  status: string;
  area: string | null;
  budgetUsd: number | null;
  dueDate: string | null; // ISO
  tareasDone: number;
  tareasTotal: number;
};

export function ProyectosBoard({
  slug,
  proyectos,
  filtro,
}: {
  slug: string;
  proyectos: BoardProyecto[];
  filtro: ProyectoStatus | null;
}) {
  const [creating, setCreating] = useState(false);

  // Columnas a mostrar: si hay filtro, solo esa; si no, las 4 del board.
  const columns = filtro ? [filtro] : PROYECTO_BOARD_STATUSES;
  // "pausado" no es columna del board; aparece cuando se filtra por él.
  const showColumns = filtro === "pausado" ? ["pausado" as const] : columns;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <FilterPills slug={slug} filtro={filtro} />
        <Button onClick={() => setCreating(true)}>+ Proyecto</Button>
      </div>

      {proyectos.length === 0 ? (
        <EmptyState
          icon="📁"
          title="Todavía no tenés proyectos"
          detail="Creá tu primer proyecto y empezá a armar las tareas del equipo."
          action={<Button onClick={() => setCreating(true)}>+ Proyecto</Button>}
        />
      ) : (
        <div
          className={`grid grid-cols-1 gap-3 ${
            showColumns.length > 1 ? "sm:grid-cols-2 lg:grid-cols-4" : ""
          }`}
        >
          {showColumns.map((status) => {
            const items = proyectos.filter((p) => p.status === status);
            return (
              <div key={status} className="rounded-lg bg-muted/60 p-2">
                <div className="flex items-center justify-between px-1 pb-2 pt-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {PROYECTO_STATUS_LABELS[status]}
                  </p>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {items.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {items.length === 0 ? (
                    <p className="px-1 py-3 text-center text-xs text-muted-foreground">—</p>
                  ) : (
                    items.map((p) => <ProyectoCard key={p.id} slug={slug} p={p} />)
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {creating ? (
        <NewProyectoDialog slug={slug} onClose={() => setCreating(false)} />
      ) : null}
    </div>
  );
}

function FilterPills({
  slug,
  filtro,
}: {
  slug: string;
  filtro: ProyectoStatus | null;
}) {
  const base = `/os/${slug}/proyectos`;
  const pillCls = (active: boolean) =>
    `whitespace-nowrap rounded-full border px-3 py-1 text-xs font-medium transition ${
      active
        ? "border-primary bg-primary-soft text-primary"
        : "bg-card text-muted-foreground hover:bg-muted"
    }`;
  return (
    <div className="flex flex-wrap gap-1.5">
      <Link href={base} className={pillCls(filtro === null)}>
        Todos
      </Link>
      {PROYECTO_STATUSES.map((s) => (
        <Link key={s} href={`${base}?estado=${s}`} className={pillCls(filtro === s)}>
          {PROYECTO_STATUS_LABELS[s]}
        </Link>
      ))}
    </div>
  );
}

function ProyectoCard({ slug, p }: { slug: string; p: BoardProyecto }) {
  const pct = p.tareasTotal > 0 ? Math.round((p.tareasDone / p.tareasTotal) * 100) : 0;
  const area = p.area as ProyectoArea | null;
  return (
    <Card className="p-3">
      <Link
        href={`/os/${slug}/proyectos/${p.id}`}
        className="block truncate text-sm font-medium hover:text-primary hover:underline"
      >
        {p.name}
      </Link>
      {p.clienteName ? (
        <p className="truncate text-xs text-muted-foreground">{p.clienteName}</p>
      ) : null}

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {area && PROYECTO_AREA_LABELS[area] ? (
          <Badge variant="primary">{PROYECTO_AREA_LABELS[area]}</Badge>
        ) : null}
        {p.budgetUsd != null ? (
          <span className="text-[11px] text-muted-foreground">
            USD {p.budgetUsd.toLocaleString("es-AR")}
          </span>
        ) : null}
      </div>

      {/* Progreso de tareas */}
      <div className="mt-2.5">
        <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>
            {p.tareasDone}/{p.tareasTotal} tareas
          </span>
          <span className="tabular-nums">{pct}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {p.dueDate ? (
        <p className="mt-2 text-[11px] text-muted-foreground">
          Entrega: {fmtDateShort(new Date(p.dueDate))}
        </p>
      ) : null}
    </Card>
  );
}

// ── Modal de alta de proyecto ──────────────────────────────────────────────
function NewProyectoDialog({ slug, onClose }: { slug: string; onClose: () => void }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [clienteName, setClienteName] = useState("");
  const [area, setArea] = useState<string>("");
  const [status, setStatus] = useState<ProyectoStatus>("propuesta");
  const [budget, setBudget] = useState("");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("El nombre es obligatorio");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/os/${slug}/proyectos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          clienteName: clienteName.trim() || undefined,
          status,
          area: area || null,
          budgetUsd: budget.trim() ? Number(budget) : undefined,
          startDate: startDate || null,
          dueDate: dueDate || null,
          description: description.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "No se pudo crear el proyecto");
      router.push(`/os/${slug}/proyectos/${data.proyecto.id}`);
      startTransition(() => router.refresh());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de conexión");
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg border bg-card p-4 text-card-foreground shadow-lg sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between gap-2">
          <h3 className="font-semibold">Nuevo proyecto</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {error ? <ErrorState message={error} /> : null}
          <Field label="Nombre *">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Rebranding Café del Sur"
              required
              autoFocus
            />
          </Field>
          <Field label="Cliente">
            <Input
              value={clienteName}
              onChange={(e) => setClienteName(e.target.value)}
              placeholder="Café del Sur"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Área">
              <Select value={area} onChange={(e) => setArea(e.target.value)}>
                <option value="">Sin área</option>
                {PROYECTO_AREAS.map((a) => (
                  <option key={a} value={a}>
                    {PROYECTO_AREA_LABELS[a]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Estado">
              <Select
                value={status}
                onChange={(e) => setStatus(e.target.value as ProyectoStatus)}
              >
                {PROYECTO_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {PROYECTO_STATUS_LABELS[s]}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Presupuesto (USD)">
            <Input
              type="number"
              min="0"
              step="any"
              inputMode="decimal"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="1500"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Inicio">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </Field>
            <Field label="Entrega">
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </Field>
          </div>
          <Field label="Descripción">
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Objetivo, alcance, entregables…"
            />
          </Field>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button type="submit" disabled={saving}>
              {saving ? <Spinner /> : null}
              {saving ? "Creando…" : "Crear proyecto"}
            </Button>
            <ButtonLink href={`/os/${slug}/proyectos`} variant="ghost" onClick={onClose}>
              Cancelar
            </ButtonLink>
          </div>
        </form>
      </div>
    </div>
  );
}
