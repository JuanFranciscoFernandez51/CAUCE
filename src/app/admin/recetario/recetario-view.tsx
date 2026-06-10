"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Field,
  Input,
  Select,
  Spinner,
  Textarea,
} from "@/components/ui";
import { AREA_LABELS, AREAS, LEVELS } from "../_components/format";

export type RecipeVariableRow = {
  key: string;
  label: string;
  type?: string;
  required?: boolean;
  help?: string;
};

export type RecipeData = {
  id: string;
  name: string;
  area: string;
  level: string;
  apps: string[];
  solves: string;
  variables: RecipeVariableRow[];
  n8nTemplateId: string | null;
  buildHours: number;
  active: boolean;
};

export function RecetarioView({ initialRecipes }: { initialRecipes: RecipeData[] }) {
  const router = useRouter();
  const [recipes, setRecipes] = useState(initialRecipes);
  const [areaFilter, setAreaFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [editing, setEditing] = useState<RecipeData | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      recipes.filter(
        (r) => (!areaFilter || r.area === areaFilter) && (!levelFilter || r.level === levelFilter)
      ),
    [recipes, areaFilter, levelFilter]
  );

  async function toggleActive(r: RecipeData) {
    const prev = recipes;
    setRecipes((rs) => rs.map((x) => (x.id === r.id ? { ...x, active: !x.active } : x)));
    setTogglingId(r.id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/recipes/${r.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !r.active }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "No se pudo actualizar");
      }
      router.refresh();
    } catch (e) {
      setRecipes(prev);
      setError(e instanceof Error ? e.message : "No se pudo actualizar");
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-44">
          <Field label="Área">
            <Select value={areaFilter} onChange={(e) => setAreaFilter(e.target.value)}>
              <option value="">Todas</option>
              {AREAS.map((a) => (
                <option key={a} value={a}>{AREA_LABELS[a]}</option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="w-32">
          <Field label="Nivel">
            <Select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)}>
              <option value="">Todos</option>
              {LEVELS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="ml-auto">
          <Button size="sm" onClick={() => { setCreating((v) => !v); setEditing(null); }}>
            {creating ? "Cerrar" : "+ Receta"}
          </Button>
        </div>
      </div>

      {error ? <ErrorState message={error} /> : null}

      {creating ? (
        <RecipeForm
          onDone={(saved) => {
            setCreating(false);
            if (saved) setRecipes((rs) => [saved, ...rs]);
            router.refresh();
          }}
        />
      ) : null}

      {editing ? (
        <RecipeForm
          recipe={editing}
          onDone={(saved) => {
            setEditing(null);
            if (saved) setRecipes((rs) => rs.map((r) => (r.id === saved.id ? saved : r)));
            router.refresh();
          }}
          onDeleted={(id) => {
            setEditing(null);
            setRecipes((rs) => rs.filter((r) => r.id !== id));
            router.refresh();
          }}
        />
      ) : null}

      {filtered.length === 0 ? (
        <EmptyState
          icon="📒"
          title="No hay recetas con esos filtros"
          detail="Probá con otra área o nivel, o creá una receta nueva."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((r) => (
            <Card key={r.id} className={`flex flex-col p-4 ${r.active ? "" : "opacity-60"}`}>
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium leading-snug">{r.name}</p>
                <button
                  type="button"
                  role="switch"
                  aria-checked={r.active}
                  onClick={() => toggleActive(r)}
                  disabled={togglingId === r.id}
                  title={r.active ? "Desactivar" : "Activar"}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                    r.active ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-card shadow transition-all ${
                      r.active ? "left-[1.375rem]" : "left-0.5"
                    }`}
                  />
                </button>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge variant="primary">{AREA_LABELS[r.area] ?? r.area}</Badge>
                <Badge variant="outline">{r.level}</Badge>
                <Badge variant="default">{r.buildHours} h build</Badge>
              </div>
              <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{r.solves}</p>
              {r.apps.length > 0 ? (
                <p className="mt-2 text-xs text-muted-foreground">Apps: {r.apps.join(", ")}</p>
              ) : null}
              <div className="mt-auto pt-3">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => { setEditing(r); setCreating(false); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                >
                  Editar
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

const EMPTY_VAR: RecipeVariableRow = { key: "", label: "", type: "text", required: false, help: "" };

function RecipeForm({
  recipe,
  onDone,
  onDeleted,
}: {
  recipe?: RecipeData;
  onDone: (saved: RecipeData | null) => void;
  onDeleted?: (id: string) => void;
}) {
  const [name, setName] = useState(recipe?.name ?? "");
  const [area, setArea] = useState(recipe?.area ?? "ATENCION");
  const [level, setLevel] = useState(recipe?.level ?? "N1");
  const [apps, setApps] = useState(recipe?.apps.join(", ") ?? "");
  const [solves, setSolves] = useState(recipe?.solves ?? "");
  const [variables, setVariables] = useState<RecipeVariableRow[]>(
    recipe?.variables.length ? recipe.variables.map((v) => ({ ...EMPTY_VAR, ...v })) : []
  );
  const [n8nTemplateId, setN8nTemplateId] = useState(recipe?.n8nTemplateId ?? "");
  const [buildHours, setBuildHours] = useState(String(recipe?.buildHours ?? 2));
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setVar(i: number, patch: Partial<RecipeVariableRow>) {
    setVariables((vs) => vs.map((v, idx) => (idx === i ? { ...v, ...patch } : v)));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const body = {
        name,
        area,
        level,
        apps: apps.split(",").map((a) => a.trim()).filter(Boolean),
        solves,
        variables: variables
          .filter((v) => v.key.trim())
          .map((v) => ({
            key: v.key.trim(),
            label: v.label.trim() || v.key.trim(),
            type: v.type || "text",
            required: !!v.required,
            help: v.help?.trim() || undefined,
          })),
        n8nTemplateId: n8nTemplateId.trim() || null,
        buildHours: Number(buildHours) || 2,
      };
      const res = await fetch(recipe ? `/api/admin/recipes/${recipe.id}` : "/api/admin/recipes", {
        method: recipe ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo guardar la receta");
      const saved = data.recipe;
      onDone({
        id: saved.id,
        name: saved.name,
        area: saved.area,
        level: saved.level,
        apps: saved.apps,
        solves: saved.solves,
        variables: saved.variables ?? [],
        n8nTemplateId: saved.n8nTemplateId,
        buildHours: saved.buildHours,
        active: saved.active,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar la receta");
      setSaving(false);
    }
  }

  async function remove() {
    if (!recipe || !onDeleted) return;
    if (!confirm(`¿Borrar la receta "${recipe.name}"?`)) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/recipes/${recipe.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo borrar");
      onDeleted(recipe.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo borrar");
      setDeleting(false);
    }
  }

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold">{recipe ? `Editar: ${recipe.name}` : "Nueva receta"}</h2>
        <Button variant="ghost" size="sm" onClick={() => onDone(null)}>Cancelar</Button>
      </div>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2">
            <Field label="Nombre">
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </Field>
          </div>
          <Field label="Área">
            <Select value={area} onChange={(e) => setArea(e.target.value)}>
              {AREAS.map((a) => (
                <option key={a} value={a}>{AREA_LABELS[a]}</option>
              ))}
            </Select>
          </Field>
          <Field label="Nivel">
            <Select value={level} onChange={(e) => setLevel(e.target.value)}>
              {LEVELS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </Select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Apps" help="Separadas por coma: whatsapp, sheets, calendar">
              <Input value={apps} onChange={(e) => setApps(e.target.value)} />
            </Field>
          </div>
          <Field label="ID plantilla n8n" help="Workflow plantilla en n8n">
            <Input value={n8nTemplateId} onChange={(e) => setN8nTemplateId(e.target.value)} />
          </Field>
          <Field label="Horas de build">
            <Input type="number" min="0" step="0.5" value={buildHours} onChange={(e) => setBuildHours(e.target.value)} />
          </Field>
        </div>

        <Field label="Qué resuelve">
          <Textarea value={solves} onChange={(e) => setSolves(e.target.value)} rows={3} required />
        </Field>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium">Variables de configuración</p>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => setVariables((vs) => [...vs, { ...EMPTY_VAR }])}
            >
              + Variable
            </Button>
          </div>
          {variables.length === 0 ? (
            <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
              Sin variables. Agregá las que el cliente tiene que completar (ej: numero_whatsapp, mensaje_bienvenida).
            </p>
          ) : (
            <div className="space-y-2">
              {variables.map((v, i) => (
                <div key={i} className="grid items-end gap-2 rounded-md border p-3 sm:grid-cols-[1fr_1fr_8rem_auto_auto] sm:gap-3">
                  <Field label="Key">
                    <Input
                      value={v.key}
                      onChange={(e) => setVar(i, { key: e.target.value.replace(/\s+/g, "_").toLowerCase() })}
                      placeholder="numero_whatsapp"
                    />
                  </Field>
                  <Field label="Label">
                    <Input value={v.label} onChange={(e) => setVar(i, { label: e.target.value })} placeholder="Número de WhatsApp" />
                  </Field>
                  <Field label="Tipo">
                    <Select value={v.type ?? "text"} onChange={(e) => setVar(i, { type: e.target.value })}>
                      <option value="text">Texto</option>
                      <option value="textarea">Texto largo</option>
                      <option value="number">Número</option>
                    </Select>
                  </Field>
                  <label className="flex h-10 items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={!!v.required}
                      onChange={(e) => setVar(i, { required: e.target.checked })}
                      className="h-4 w-4 accent-current"
                    />
                    Requerida
                  </label>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => setVariables((vs) => vs.filter((_, idx) => idx !== i))}
                  >
                    Quitar
                  </Button>
                  <div className="sm:col-span-5">
                    <Field label="Ayuda (opcional)">
                      <Input value={v.help ?? ""} onChange={(e) => setVar(i, { help: e.target.value })} placeholder="Texto de ayuda para el admin" />
                    </Field>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {error ? <ErrorState message={error} /> : null}

        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" disabled={saving || deleting || !name.trim() || !solves.trim()}>
            {saving ? <Spinner /> : null}
            {saving ? "Guardando…" : recipe ? "Guardar cambios" : "Crear receta"}
          </Button>
          {recipe && onDeleted ? (
            <Button type="button" variant="destructive" onClick={remove} disabled={saving || deleting}>
              {deleting ? <Spinner /> : null} Borrar receta
            </Button>
          ) : null}
        </div>
      </form>
    </Card>
  );
}
