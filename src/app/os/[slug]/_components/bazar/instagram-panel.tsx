"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Card, EmptyState, ErrorState, Textarea } from "@/components/ui";

export type ProductoIg = {
  id: string;
  nombre: string;
  foto: string | null;
  cantFotos: number;
  captionAuto: string;
};

export type PublicacionIg = {
  id: string;
  productoNombre: string;
  foto: string | null;
  caption: string;
  estado: string; // BORRADOR | PROGRAMADA | PUBLICADA | ERROR
  error: string | null;
  programadaPara: string | null;
  publicadaEn: string | null;
  dia: string | null; // "YYYY-MM-DD" argentino para el calendario
};

type Cell = { date: string; inMonth: boolean };

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const ESTADO_BADGE: Record<string, { label: string; variant: "default" | "primary" | "success" | "warning" | "destructive" }> = {
  BORRADOR: { label: "Borrador", variant: "default" },
  PROGRAMADA: { label: "Programada", variant: "primary" },
  PUBLICADA: { label: "Publicada", variant: "success" },
  ERROR: { label: "Error", variant: "destructive" },
};

/**
 * Panel de Instagram del bazar: card de conexión, grilla de productos con
 * "Publicar ahora" / "Programar" (caption auto editable) y calendario mensual.
 */
export function InstagramPanel({
  slug,
  conectado,
  igUsername,
  productos,
  publicaciones,
  weeks,
  hoy,
  q,
}: {
  slug: string;
  conectado: boolean;
  igUsername: string | null;
  productos: ProductoIg[];
  publicaciones: PublicacionIg[];
  weeks: Cell[][];
  hoy: string;
  q: string;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [modal, setModal] = useState<ProductoIg | null>(null);
  const [caption, setCaption] = useState("");
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("11:00");
  const [enviando, setEnviando] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const porDia = new Map<string, PublicacionIg[]>();
  for (const p of publicaciones) {
    if (!p.dia) continue;
    const lista = porDia.get(p.dia) ?? [];
    lista.push(p);
    porDia.set(p.dia, lista);
  }

  function abrirModal(p: ProductoIg) {
    setModal(p);
    setCaption(p.captionAuto);
    setFecha("");
    setHora("11:00");
    setError("");
  }

  async function publicar(programar: boolean) {
    if (!modal) return;
    if (programar && !fecha) {
      setError("Elegí la fecha para programar");
      return;
    }
    setEnviando(true);
    setError("");
    try {
      const res = await fetch(`/api/os/${slug}/bazar/publicaciones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productoId: modal.id,
          caption: caption.trim(),
          programadaPara: programar ? new Date(`${fecha}T${hora}:00-03:00`).toISOString() : null,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok && !data?.publicacion) {
        throw new Error(data?.error ?? "No se pudo crear la publicación");
      }
      if (!programar && data?.publicacion?.estado === "ERROR") {
        setError(data.publicacion.error ?? "Instagram devolvió un error");
      } else {
        setModal(null);
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error de conexión");
    } finally {
      setEnviando(false);
    }
  }

  async function accionPub(id: string, body: Record<string, unknown> | null) {
    setBusyId(id);
    setError("");
    try {
      const res = await fetch(`/api/os/${slug}/bazar/publicaciones/${id}`, {
        method: body ? "PATCH" : "DELETE",
        ...(body
          ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
          : {}),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok && !data?.publicacion) throw new Error(data?.error ?? "No se pudo");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error de conexión");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      {error && !modal ? <ErrorState message={error} /> : null}

      {/* Conexión */}
      {!conectado ? (
        <Card className="flex flex-wrap items-center gap-4 border-warning/40 bg-warning/5 p-4">
          <div className="text-3xl">📷</div>
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold">Conectar Instagram</h2>
            <p className="text-sm text-muted-foreground">
              Para publicar de verdad hace falta vincular la cuenta{" "}
              {igUsername ? <strong>@{igUsername}</strong> : "del negocio"} (Instagram Business +
              página de Facebook). La conexión la hace el equipo de Cauce con vos en 10 minutos —
              mientras tanto podés dejar publicaciones PROGRAMADAS y salen solas apenas se conecte.
            </p>
          </div>
        </Card>
      ) : (
        <Card className="flex items-center gap-3 p-3 text-sm">
          <span className="text-xl">✅</span>
          <span>
            Instagram conectado{igUsername ? <strong> — @{igUsername}</strong> : ""}. Las
            publicaciones programadas salen solas.
          </span>
        </Card>
      )}

      <div className="grid gap-4 xl:grid-cols-[1fr_22rem]">
        {/* Calendario mensual */}
        <Card className="p-3">
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-muted-foreground">
            {WEEKDAYS.map((d) => (
              <div key={d} className="py-1">
                {d}
              </div>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {weeks.flat().map((cell) => {
              const pubs = porDia.get(cell.date) ?? [];
              return (
                <div
                  key={cell.date}
                  className={`min-h-16 rounded-md border p-1 text-xs ${cell.inMonth ? "" : "opacity-40"} ${cell.date === hoy ? "border-primary bg-primary-soft" : ""}`}
                >
                  <div className="text-right text-[10px] text-muted-foreground">
                    {Number(cell.date.slice(8, 10))}
                  </div>
                  <div className="space-y-0.5">
                    {pubs.slice(0, 2).map((p) => (
                      <div
                        key={p.id}
                        title={`${p.productoNombre} — ${ESTADO_BADGE[p.estado]?.label ?? p.estado}`}
                        className={`truncate rounded px-1 py-0.5 text-[10px] font-medium ${
                          p.estado === "PUBLICADA"
                            ? "bg-success/15 text-success"
                            : p.estado === "ERROR"
                              ? "bg-destructive/15 text-destructive"
                              : "bg-primary-soft text-primary"
                        }`}
                      >
                        {p.estado === "PUBLICADA" ? "✓ " : p.estado === "ERROR" ? "✕ " : "🕐 "}
                        {p.productoNombre}
                      </div>
                    ))}
                    {pubs.length > 2 ? (
                      <div className="text-[10px] text-muted-foreground">+{pubs.length - 2} más</div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Cola de publicaciones */}
        <Card className="p-3">
          <h2 className="mb-2 text-sm font-semibold">Publicaciones</h2>
          {publicaciones.length === 0 ? (
            <EmptyState icon="📷" title="Nada programado" detail="Elegí un producto y programalo." />
          ) : (
            <ul className="max-h-96 space-y-2 overflow-y-auto">
              {publicaciones.map((p) => {
                const badge = ESTADO_BADGE[p.estado] ?? ESTADO_BADGE.BORRADOR;
                return (
                  <li
                    key={p.id}
                    className={`rounded-md border p-2 text-sm ${busyId === p.id ? "opacity-60" : ""}`}
                  >
                    <div className="flex items-center gap-2">
                      {p.foto ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.foto} alt="" className="h-8 w-8 rounded border object-cover" />
                      ) : null}
                      <span className="min-w-0 flex-1 truncate font-medium">{p.productoNombre}</span>
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {p.estado === "PUBLICADA" && p.publicadaEn
                        ? `Salió el ${new Date(p.publicadaEn).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Argentina/Buenos_Aires" })}`
                        : p.programadaPara
                          ? `Sale el ${new Date(p.programadaPara).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Argentina/Buenos_Aires" })}`
                          : "Sin fecha"}
                    </p>
                    {p.error ? <p className="mt-1 text-xs text-destructive">{p.error}</p> : null}
                    {p.estado !== "PUBLICADA" ? (
                      <div className="mt-1.5 flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => accionPub(p.id, { publicarAhora: true })}
                          className="rounded border px-2 py-1 text-xs font-medium hover:bg-muted"
                        >
                          Publicar ya
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm("¿Borrar esta publicación?")) void accionPub(p.id, null);
                          }}
                          className="rounded px-2 py-1 text-xs text-muted-foreground hover:text-destructive"
                        >
                          Borrar
                        </button>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      {/* Grilla de productos */}
      <div>
        <div className="mb-2 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold">Elegí qué publicar</h2>
          <form method="get" className="flex gap-2">
            <input
              name="q"
              defaultValue={q}
              placeholder="Buscar producto…"
              className="h-8 w-48 rounded-md border border-input bg-card px-2 text-sm outline-none"
            />
            <button type="submit" className="h-8 rounded-md border px-2 text-sm hover:bg-muted">
              Buscar
            </button>
          </form>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {productos.map((p) => (
            <div key={p.id} className="overflow-hidden rounded-lg border bg-card">
              {p.foto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.foto} alt={p.nombre} className="aspect-square w-full object-cover" />
              ) : (
                <div className="flex aspect-square w-full items-center justify-center bg-muted text-2xl">
                  🐚
                </div>
              )}
              <div className="p-2">
                <p className="truncate text-xs font-medium" title={p.nombre}>
                  {p.nombre}
                </p>
                <Button
                  size="sm"
                  className="mt-1.5 w-full"
                  disabled={p.cantFotos === 0}
                  title={p.cantFotos === 0 ? "El producto no tiene fotos" : undefined}
                  onClick={() => abrirModal(p)}
                >
                  📷 Publicar
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal publicar/programar */}
      {modal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Cerrar"
            onClick={() => setModal(null)}
            className="absolute inset-0 bg-black/40"
          />
          <div className="relative w-full max-w-md rounded-lg border bg-card p-4 shadow-xl">
            <h3 className="font-semibold">Publicar “{modal.nombre}”</h3>
            <p className="text-xs text-muted-foreground">
              Sale como carrusel con las {modal.cantFotos} foto{modal.cantFotos === 1 ? "" : "s"} del
              producto.
            </p>
            {error ? (
              <div className="mt-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            ) : null}
            <div className="mt-3">
              <label className="mb-1 block text-sm font-medium">Caption</label>
              <Textarea value={caption} onChange={(e) => setCaption(e.target.value)} rows={4} />
            </div>
            <div className="mt-3 flex gap-2">
              <div className="flex-1">
                <label className="mb-1 block text-sm font-medium">Programar para (opcional)</label>
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Hora</label>
                <input
                  type="time"
                  value={hora}
                  onChange={(e) => setHora(e.target.value)}
                  className="h-10 rounded-md border border-input bg-card px-3 text-sm"
                />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button disabled={enviando || !caption.trim()} onClick={() => publicar(false)}>
                {enviando ? "Publicando…" : "Publicar ahora"}
              </Button>
              <Button
                variant="secondary"
                disabled={enviando || !caption.trim() || !fecha}
                onClick={() => publicar(true)}
              >
                🕐 Programar
              </Button>
              <Button variant="ghost" onClick={() => setModal(null)}>
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
