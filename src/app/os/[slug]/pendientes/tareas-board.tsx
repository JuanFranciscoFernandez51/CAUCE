"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type TareaRow = {
  id: string;
  titulo: string;
  prioridad: string;
  categoria: string | null;
  vence: string | null;
  estado: string;
  hechaAt: string | null;
};

const COLUMNAS = [
  { key: "por_hacer", titulo: "Por hacer" },
  { key: "en_progreso", titulo: "En progreso" },
  { key: "hecho", titulo: "Hecho" },
];

const PRIORIDAD: Record<string, { label: string; color: string }> = {
  alta: { label: "Alta", color: "#B85850" },
  media: { label: "Media", color: "#B8935A" },
  baja: { label: "Baja", color: "#9E9387" },
};

export function TareasBoard({ slug, tareas }: { slug: string; tareas: TareaRow[] }) {
  const router = useRouter();
  const [nuevo, setNuevo] = useState<Record<string, string>>({});
  const [arrastrando, setArrastrando] = useState<string | null>(null);
  const [sobre, setSobre] = useState<string | null>(null);
  const [sel, setSel] = useState<TareaRow | null>(null);

  const api = (id: string, data: Record<string, unknown>) =>
    fetch(`/api/os/${slug}/tareas/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then(() => router.refresh());

  async function crear(estado: string) {
    const titulo = (nuevo[estado] ?? "").trim();
    if (!titulo) return;
    setNuevo({ ...nuevo, [estado]: "" });
    await fetch(`/api/os/${slug}/tareas`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ titulo, estado }) });
    router.refresh();
  }

  const hoy = new Date();
  const input = "h-9 w-full border border-border bg-background px-3 text-sm outline-none focus:border-primary";

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {COLUMNAS.map((col) => {
        const enCol = tareas.filter((t) => t.estado === col.key);
        return (
          <section
            key={col.key}
            onDragOver={(e) => { e.preventDefault(); setSobre(col.key); }}
            onDragLeave={() => setSobre(null)}
            onDrop={(e) => {
              e.preventDefault(); setSobre(null);
              const id = e.dataTransfer.getData("text/plain");
              if (id) api(id, { estado: col.key });
            }}
            className="border border-border bg-card p-3 transition"
            style={sobre === col.key ? { outline: "2px solid #9E9387", outlineOffset: -2 } : undefined}
          >
            <div className="flex items-center justify-between px-1">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{col.titulo}</h2>
              <span className="text-xs text-muted-foreground">{enCol.length}</span>
            </div>

            <div className="mt-2 flex gap-1.5">
              <input
                placeholder="+ Agregar tarea…"
                value={nuevo[col.key] ?? ""}
                onChange={(e) => setNuevo({ ...nuevo, [col.key]: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && crear(col.key)}
                className={input}
              />
            </div>

            <div className="mt-2 space-y-2">
              {enCol.map((t) => {
                const p = PRIORIDAD[t.prioridad] ?? PRIORIDAD.media;
                const vencida = t.estado !== "hecho" && t.vence && new Date(t.vence + "T23:59") < hoy;
                return (
                  <div
                    key={t.id}
                    draggable
                    onDragStart={(e) => { e.dataTransfer.setData("text/plain", t.id); setArrastrando(t.id); }}
                    onDragEnd={() => setArrastrando(null)}
                    onClick={() => setSel(t)}
                    className={`cursor-grab border bg-background p-3 transition hover:shadow-sm ${arrastrando === t.id ? "opacity-40" : ""}`}
                    style={{ borderColor: vencida ? "#B85850" : "var(--border)" }}
                  >
                    <p className={`text-sm font-medium ${t.estado === "hecho" ? "line-through opacity-50" : ""}`}>{t.titulo}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
                      <span className="inline-flex items-center gap-1 border border-border px-1.5 py-0.5">
                        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: p.color }} />
                        {p.label}
                      </span>
                      {t.categoria ? <span className="border border-border px-1.5 py-0.5 text-muted-foreground">{t.categoria}</span> : null}
                      {t.vence ? (
                        <span className="border px-1.5 py-0.5" style={vencida ? { borderColor: "#B85850", color: "#B85850", fontWeight: 600 } : { borderColor: "var(--border)", color: "var(--muted-foreground)" }}>
                          {new Date(t.vence + "T12:00").toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" })}
                          {vencida ? " · vencida" : ""}
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      {/* Editor de tarea */}
      {sel ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSel(null)}>
          <div className="w-full max-w-md border border-border bg-card p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-[22px]" style={{ fontFamily: "var(--font-italiana)" }}>Editar tarea</h2>
              <button onClick={() => setSel(null)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <div className="mt-4 grid gap-3">
              <input value={sel.titulo} onChange={(e) => setSel({ ...sel, titulo: e.target.value })} className={input} />
              <div className="grid grid-cols-2 gap-3">
                <select value={sel.prioridad} onChange={(e) => setSel({ ...sel, prioridad: e.target.value })} className={input}>
                  {Object.entries(PRIORIDAD).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
                <input type="date" value={sel.vence ?? ""} onChange={(e) => setSel({ ...sel, vence: e.target.value || null })} className={input} />
              </div>
              <input placeholder="Categoría (Papeles, Ventas…)" value={sel.categoria ?? ""} onChange={(e) => setSel({ ...sel, categoria: e.target.value })} className={input} />
            </div>
            <div className="mt-4 flex items-center justify-between">
              <button
                onClick={async () => { await fetch(`/api/os/${slug}/tareas/${sel.id}`, { method: "DELETE" }); setSel(null); router.refresh(); }}
                className="text-sm text-muted-foreground transition hover:text-destructive"
              >
                Borrar
              </button>
              <button
                onClick={async () => {
                  await api(sel.id, { titulo: sel.titulo, prioridad: sel.prioridad, vence: sel.vence, categoria: sel.categoria ?? "" });
                  setSel(null);
                }}
                className="px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.12em] transition hover:opacity-90"
                style={{ backgroundColor: "#1A1816", color: "#EDE8DE" }}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
