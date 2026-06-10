"use client";

import { useMemo, useState } from "react";
import { DragDropContext, Draggable, Droppable, type DropResult } from "@hello-pangea/dnd";
import { Badge, Button, Card, ErrorState, Field, Input, Select, Spinner } from "@/components/ui";
import { fmtUsd, LEVELS, STAGE_LABELS, STAGES, type StageKey } from "../_components/format";

export type BoardProject = {
  id: string;
  title: string;
  stage: StageKey;
  level: string;
  setupFee: number;
  who: string | null;
};

type Columns = Record<StageKey, BoardProject[]>;

function toColumns(projects: BoardProject[]): Columns {
  const cols = Object.fromEntries(STAGES.map((s) => [s, []])) as unknown as Columns;
  for (const p of projects) cols[p.stage]?.push(p);
  return cols;
}

export function PipelineBoard({
  initialProjects,
  clients,
}: {
  initialProjects: BoardProject[];
  clients: { id: string; name: string }[];
}) {
  const [columns, setColumns] = useState<Columns>(() => toColumns(initialProjects));
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  async function onDragEnd(result: DropResult) {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const from = source.droppableId as StageKey;
    const to = destination.droppableId as StageKey;

    const prev = columns;
    const next: Columns = { ...columns };
    next[from] = [...columns[from]];
    if (from !== to) next[to] = [...columns[to]];

    const [moved] = next[from].splice(source.index, 1);
    if (!moved) return;
    const movedUpdated = { ...moved, stage: to };
    next[to].splice(destination.index, 0, movedUpdated);

    // Optimista
    setColumns(next);
    setError(null);

    try {
      const res = await fetch(`/api/admin/projects/${draggableId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stage: to,
          order: destination.index,
          orderedIds: next[to].map((p) => p.id),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "No se pudo guardar el cambio");
      }
    } catch (e) {
      // Rollback
      setColumns(prev);
      setError(e instanceof Error ? e.message : "No se pudo guardar el cambio");
    }
  }

  const totalSetup = useMemo(
    () =>
      STAGES.filter((s) => s !== "ACTIVO")
        .flatMap((s) => columns[s])
        .reduce((acc, p) => acc + p.setupFee, 0),
    [columns]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Setup en pipeline: <span className="font-semibold text-foreground">{fmtUsd(totalSetup)}</span>
        </p>
        <Button size="sm" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cerrar" : "+ Proyecto"}
        </Button>
      </div>

      {showForm ? (
        <NewProjectForm
          clients={clients}
          onCreated={(p) => {
            setColumns((cols) => ({ ...cols, [p.stage]: [...cols[p.stage], p] }));
            setShowForm(false);
          }}
        />
      ) : null}

      {error ? <ErrorState message={`${error} — se revirtió el movimiento.`} /> : null}

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-4">
          {STAGES.map((stage) => (
            <div key={stage} className="w-64 shrink-0">
              <div className="mb-2 flex items-center justify-between px-1">
                <h3 className="text-sm font-semibold">{STAGE_LABELS[stage]}</h3>
                <span className="text-xs text-muted-foreground">{columns[stage].length}</span>
              </div>
              <Droppable droppableId={stage}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex min-h-32 flex-col gap-2 rounded-lg border border-dashed p-2 transition-colors ${
                      snapshot.isDraggingOver ? "bg-primary-soft/50" : "bg-muted/40"
                    }`}
                  >
                    {columns[stage].map((p, idx) => (
                      <Draggable key={p.id} draggableId={p.id} index={idx}>
                        {(prov, snap) => (
                          <div
                            ref={prov.innerRef}
                            {...prov.draggableProps}
                            {...prov.dragHandleProps}
                          >
                            <Card className={`p-3 ${snap.isDragging ? "shadow-lg ring-2 ring-ring" : ""}`}>
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-sm font-medium leading-snug">{p.title}</p>
                                <Badge variant="primary">{p.level}</Badge>
                              </div>
                              {p.who ? (
                                <p className="mt-1 truncate text-xs text-muted-foreground">{p.who}</p>
                              ) : null}
                              <p className="mt-1.5 text-xs font-medium">{fmtUsd(p.setupFee)}</p>
                            </Card>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    {columns[stage].length === 0 ? (
                      <p className="px-1 py-3 text-center text-xs text-muted-foreground">Sin proyectos</p>
                    ) : null}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}

function NewProjectForm({
  clients,
  onCreated,
}: {
  clients: { id: string; name: string }[];
  onCreated: (p: BoardProject) => void;
}) {
  const [title, setTitle] = useState("");
  const [level, setLevel] = useState("N1");
  const [stage, setStage] = useState<StageKey>("LEAD");
  const [setupFee, setSetupFee] = useState("0");
  const [clientId, setClientId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          level,
          stage,
          setupFee: Number(setupFee) || 0,
          clientId: clientId || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo crear el proyecto");
      onCreated({
        id: data.project.id,
        title: data.project.title,
        stage: data.project.stage,
        level: data.project.level,
        setupFee: data.project.setupFee,
        who: clients.find((c) => c.id === clientId)?.name ?? null,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo crear el proyecto");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="p-4">
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="sm:col-span-2 lg:col-span-2">
          <Field label="Título">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Bot WhatsApp para…"
              required
            />
          </Field>
        </div>
        <Field label="Nivel">
          <Select value={level} onChange={(e) => setLevel(e.target.value)}>
            {LEVELS.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </Select>
        </Field>
        <Field label="Etapa">
          <Select value={stage} onChange={(e) => setStage(e.target.value as StageKey)}>
            {STAGES.map((s) => (
              <option key={s} value={s}>{STAGE_LABELS[s]}</option>
            ))}
          </Select>
        </Field>
        <Field label="Setup (USD)">
          <Input
            type="number"
            min="0"
            step="1"
            value={setupFee}
            onChange={(e) => setSetupFee(e.target.value)}
          />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Cliente (opcional)">
            <Select value={clientId} onChange={(e) => setClientId(e.target.value)}>
              <option value="">Sin cliente</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-3">
          <Button type="submit" disabled={saving || !title.trim()}>
            {saving ? <Spinner /> : null}
            {saving ? "Creando…" : "Crear proyecto"}
          </Button>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
      </form>
    </Card>
  );
}
