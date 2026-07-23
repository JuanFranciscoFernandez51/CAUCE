"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui";
import type { CategoriaFin } from "../../_lib/finanzas";

/**
 * Gestor de categorías de ingresos y gastos: agregar, renombrar inline
 * (arrastra el historial de movimientos) y borrar (si está en uso, se oculta).
 */
export function CategoriasManager({
  slug,
  categorias,
}: {
  slug: string;
  categorias: CategoriaFin[];
}) {
  const ingreso = categorias.filter((c) => c.tipo === "INGRESO" && c.activa);
  const gasto = categorias.filter((c) => c.tipo === "GASTO" && c.activa);
  return (
    <Card className="p-5">
      <h2 className="text-base font-semibold">Categorías de ingresos y gastos</h2>
      <p className="mb-4 mt-1 text-xs text-muted-foreground">
        Armá las categorías de TU negocio. Al renombrar una, se actualizan todos los movimientos
        que la usaban.
      </p>
      <div className="grid gap-6 sm:grid-cols-2">
        <Columna slug={slug} titulo="Ingresos" tipo="INGRESO" items={ingreso} />
        <Columna slug={slug} titulo="Gastos" tipo="GASTO" items={gasto} />
      </div>
    </Card>
  );
}

function Columna({
  slug,
  titulo,
  tipo,
  items,
}: {
  slug: string;
  titulo: string;
  tipo: string;
  items: CategoriaFin[];
}) {
  const router = useRouter();
  const [nuevo, setNuevo] = useState("");
  const [agregando, setAgregando] = useState(false);
  const [error, setError] = useState("");
  const color = tipo === "INGRESO" ? "text-success" : "text-destructive";

  async function agregar() {
    const nombre = nuevo.trim();
    if (!nombre) return;
    setAgregando(true);
    setError("");
    const res = await fetch(`/api/os/${slug}/caja/categorias`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, tipo }),
    });
    setAgregando(false);
    if (res.ok) {
      setNuevo("");
      router.refresh();
    } else {
      const e = await res.json().catch(() => null);
      setError(e?.error ?? "No se pudo agregar");
    }
  }

  return (
    <div>
      <p className={`mb-2 text-xs font-semibold uppercase tracking-wide ${color}`}>
        {tipo === "INGRESO" ? "↑" : "↓"} {titulo}{" "}
        <span className="font-normal text-muted-foreground">({items.length})</span>
      </p>
      <div className="space-y-1">
        {items.map((c) => (
          <Fila key={c.id} slug={slug} cat={c} />
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <input
          value={nuevo}
          onChange={(e) => setNuevo(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") agregar();
          }}
          placeholder="Nueva categoría…"
          className="h-9 flex-1 rounded-md border border-input bg-card px-2.5 text-sm placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-ring"
        />
        <button
          onClick={agregar}
          disabled={agregando || !nuevo.trim()}
          className="inline-flex h-9 items-center gap-1 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-40"
        >
          + Agregar
        </button>
      </div>
      {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

function Fila({ slug, cat }: { slug: string; cat: CategoriaFin }) {
  const router = useRouter();
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState(cat.nombre);
  const [guardando, setGuardando] = useState(false);

  async function guardar() {
    const nombre = valor.trim();
    if (!nombre || nombre === cat.nombre) {
      setEditando(false);
      setValor(cat.nombre);
      return;
    }
    setGuardando(true);
    const res = await fetch(`/api/os/${slug}/caja/categorias/${cat.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre }),
    });
    setGuardando(false);
    if (res.ok) {
      setEditando(false);
      router.refresh();
    } else {
      setValor(cat.nombre);
      setEditando(false);
    }
  }

  async function borrar() {
    if (
      !confirm(
        `¿Eliminar la categoría "${cat.nombre}"? Si tiene movimientos, se oculta de la lista pero el historial se mantiene.`
      )
    )
      return;
    const res = await fetch(`/api/os/${slug}/caja/categorias/${cat.id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
  }

  if (editando) {
    return (
      <div className="flex items-center gap-1.5">
        <input
          value={valor}
          autoFocus
          onChange={(e) => setValor(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") guardar();
            if (e.key === "Escape") {
              setEditando(false);
              setValor(cat.nombre);
            }
          }}
          className="h-8 flex-1 rounded-md border border-primary bg-card px-2 text-sm focus-visible:outline-none"
        />
        <button
          onClick={guardar}
          disabled={guardando}
          className="rounded p-1.5 text-success hover:bg-success/10"
          title="Guardar"
        >
          ✓
        </button>
        <button
          onClick={() => {
            setEditando(false);
            setValor(cat.nombre);
          }}
          className="rounded p-1.5 text-muted-foreground hover:bg-muted"
          title="Cancelar"
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <div className="group flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-muted/60">
      <span>{cat.nombre}</span>
      <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          onClick={() => setEditando(true)}
          className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          title="Renombrar"
        >
          ✎
        </button>
        <button
          onClick={borrar}
          className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          title="Eliminar"
        >
          🗑
        </button>
      </div>
    </div>
  );
}
