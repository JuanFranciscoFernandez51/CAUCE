"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** Alta rápida de tarea desde el calendario: con fecha va al calendario, sin fecha queda en el tablero. */
export function AgregarTarea({ slug }: { slug: string }) {
  const router = useRouter();
  const [titulo, setTitulo] = useState("");
  const [fecha, setFecha] = useState("");
  const [ocupado, setOcupado] = useState(false);

  async function crear() {
    if (!titulo.trim() || ocupado) return;
    setOcupado(true);
    await fetch(`/api/os/${slug}/tareas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titulo: titulo.trim(), estado: "por_hacer", vence: fecha || null }),
    });
    setTitulo(""); setFecha(""); setOcupado(false);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card px-4 py-3">
      <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Nueva tarea</span>
      <input
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") void crear(); }}
        placeholder="Qué hay que hacer… (Enter para agregar)"
        className="h-9 min-w-[220px] flex-1 rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-primary"
      />
      <input
        type="date"
        value={fecha}
        onChange={(e) => setFecha(e.target.value)}
        title="Con fecha aparece en el calendario; sin fecha queda solo en el tablero"
        className="h-9 rounded-lg border border-border bg-white px-2 text-sm outline-none focus:border-primary"
      />
      <button
        onClick={crear}
        disabled={ocupado}
        className="h-9 rounded-lg px-4 text-[11px] font-semibold uppercase tracking-[0.14em] transition hover:opacity-90 disabled:opacity-50"
        style={{ backgroundColor: "#1A1816", color: "#EDE8DE" }}
      >
        + Agregar
      </button>
    </div>
  );
}
