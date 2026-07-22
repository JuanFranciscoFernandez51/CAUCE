"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
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

export type PostView = {
  id: string;
  titulo: string;
  caption: string;
  idea: string | null;
  mediaType: string;
  imageUrls: string[];
  videoUrls: string[];
  platforms: string[];
  scheduledAt: string | null;
  status: string;
  publishedAt: string | null;
  permalink: string | null;
  errorMessage: string | null;
  origen: string;
};

const ESTADO: Record<string, { label: string; variant: "default" | "success" | "warning" | "destructive" | "outline" }> = {
  DRAFT: { label: "Borrador", variant: "outline" },
  PENDING: { label: "Programado", variant: "default" },
  PROCESSING: { label: "Publicando…", variant: "warning" },
  PUBLISHED: { label: "Publicado", variant: "success" },
  PARTIAL: { label: "Parcial", variant: "warning" },
  FAILED: { label: "Falló", variant: "destructive" },
  CANCELLED: { label: "Cancelado", variant: "outline" },
};

const MEDIA_ICON: Record<string, string> = {
  PHOTO: "🖼️",
  PHOTO_CAROUSEL: "🖼️🖼️",
  VIDEO: "🎬",
  REEL: "🎞️",
};

function fmtFecha(iso: string): string {
  return new Date(iso).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Argentina/Buenos_Aires",
  });
}

export function FeedMarketing({ posts, conectado }: { posts: PostView[]; conectado: boolean }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editando, setEditando] = useState<PostView | "nuevo" | null>(null);
  const [agenteOpen, setAgenteOpen] = useState(false);

  async function accion(id: string, fn: () => Promise<Response>) {
    setBusyId(id);
    setError("");
    try {
      const res = await fn();
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "No se pudo");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error de conexión");
    } finally {
      setBusyId(null);
    }
  }

  const publicarAhora = (p: PostView) => {
    if (!window.confirm(`¿Publicar "${p.titulo}" AHORA en ${p.platforms.join(" + ")}?`)) return;
    void accion(p.id, () => fetch(`/api/admin/marketing/posts/${p.id}/publicar`, { method: "POST" }));
  };
  const borrar = (p: PostView) => {
    if (!window.confirm(`¿Borrar "${p.titulo}"?`)) return;
    void accion(p.id, () => fetch(`/api/admin/marketing/posts/${p.id}`, { method: "DELETE" }));
  };
  const cancelar = (p: PostView) =>
    void accion(p.id, () =>
      fetch(`/api/admin/marketing/posts/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cancelar: true }),
      })
    );

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold">Publicaciones</h2>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setAgenteOpen(true)}>
            🤖 Generar con IA
          </Button>
          <Button size="sm" onClick={() => setEditando("nuevo")}>
            + Publicación
          </Button>
        </div>
      </div>

      {error ? <ErrorState message={error} /> : null}
      {!conectado ? (
        <p className="text-xs text-muted-foreground">
          ⚠️ Sin conexión a Meta las publicaciones quedan listas pero no salen — conectá la cuenta
          arriba cuando quieras.
        </p>
      ) : null}

      {posts.length === 0 ? (
        <EmptyState
          icon="📣"
          title="Todavía no hay publicaciones"
          detail="Generá un lote con el agente o cargá la primera a mano."
          action={<Button onClick={() => setAgenteOpen(true)}>🤖 Generar con IA</Button>}
        />
      ) : (
        <div className="space-y-2">
          {posts.map((p) => {
            const est = ESTADO[p.status] ?? ESTADO.DRAFT;
            const busy = busyId === p.id;
            const editable = ["DRAFT", "PENDING", "FAILED", "CANCELLED"].includes(p.status);
            return (
              <Card key={p.id} className="p-0">
                <div className="flex flex-wrap items-start gap-3 p-3 sm:p-4">
                  {p.imageUrls[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.imageUrls[0].replace("/upload/", "/upload/w_120,h_150,c_fill,q_auto/")}
                      alt=""
                      className="h-20 w-16 shrink-0 rounded-md border object-cover"
                    />
                  ) : (
                    <div className="flex h-20 w-16 shrink-0 items-center justify-center rounded-md border bg-muted text-2xl">
                      {MEDIA_ICON[p.mediaType] ?? "🖼️"}
                    </div>
                  )}
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{p.titulo}</p>
                      <Badge variant={est.variant}>{est.label}</Badge>
                      {p.origen === "ia" ? <Badge variant="outline">IA</Badge> : null}
                      <span className="text-xs text-muted-foreground">
                        {p.platforms.join(" + ")}
                        {p.scheduledAt && p.status === "PENDING"
                          ? ` · sale ${fmtFecha(p.scheduledAt)}`
                          : ""}
                        {p.publishedAt ? ` · salió ${fmtFecha(p.publishedAt)}` : ""}
                      </span>
                    </div>
                    <p className="line-clamp-2 whitespace-pre-line text-sm text-muted-foreground">
                      {p.caption}
                    </p>
                    {p.idea && !p.imageUrls.length && !p.videoUrls.length ? (
                      <p className="line-clamp-2 text-xs text-primary">
                        🎨 Falta la pieza: {p.idea}
                      </p>
                    ) : null}
                    {p.errorMessage ? (
                      <p className="text-xs text-destructive">{p.errorMessage}</p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                    {busy ? (
                      <Spinner className="text-muted-foreground" />
                    ) : (
                      <>
                        {editable ? (
                          <>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => setEditando(p)}
                              title="Editar / programar"
                            >
                              ✏️
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => publicarAhora(p)}
                              disabled={
                                !conectado ||
                                (p.mediaType.startsWith("PHOTO")
                                  ? p.imageUrls.length === 0
                                  : p.videoUrls.length === 0)
                              }
                              title={
                                conectado
                                  ? "Publicar ahora"
                                  : "Conectá Meta para publicar"
                              }
                            >
                              🚀
                            </Button>
                          </>
                        ) : null}
                        {p.status === "PENDING" ? (
                          <Button variant="ghost" size="sm" onClick={() => cancelar(p)} title="Cancelar programación">
                            ⏸
                          </Button>
                        ) : null}
                        {p.permalink ? (
                          <a
                            href={p.permalink}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-md border bg-card px-2.5 py-1.5 text-xs hover:bg-muted"
                            title="Ver en Instagram"
                          >
                            ↗ IG
                          </a>
                        ) : null}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => void navigator.clipboard.writeText(p.caption)}
                          title="Copiar caption"
                        >
                          📋
                        </Button>
                        {p.status !== "PUBLISHED" && p.status !== "PARTIAL" ? (
                          <Button variant="ghost" size="sm" onClick={() => borrar(p)} title="Borrar">
                            🗑️
                          </Button>
                        ) : null}
                      </>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {editando ? (
        <PostModal
          post={editando === "nuevo" ? null : editando}
          onClose={() => setEditando(null)}
          onSaved={() => {
            setEditando(null);
            router.refresh();
          }}
        />
      ) : null}
      {agenteOpen ? (
        <AgenteModal
          onClose={() => setAgenteOpen(false)}
          onDone={() => {
            setAgenteOpen(false);
            router.refresh();
          }}
        />
      ) : null}
    </section>
  );
}

// ── Modal de alta/edición ─────────────────────────────────────────────────
function PostModal({
  post,
  onClose,
  onSaved,
}: {
  post: PostView | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [titulo, setTitulo] = useState(post?.titulo ?? "");
  const [caption, setCaption] = useState(post?.caption ?? "");
  const [idea, setIdea] = useState(post?.idea ?? "");
  const [mediaType, setMediaType] = useState(post?.mediaType ?? "PHOTO");
  const [imageUrls, setImageUrls] = useState<string[]>(post?.imageUrls ?? []);
  const [videoUrl, setVideoUrl] = useState(post?.videoUrls[0] ?? "");
  const [ig, setIg] = useState(post?.platforms.includes("IG") ?? true);
  const [fb, setFb] = useState(post?.platforms.includes("FB") ?? false);
  const [fecha, setFecha] = useState(
    post?.scheduledAt ? isoToLocal(post.scheduledAt) : ""
  );
  const [busy, setBusy] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState("");

  const esVideo = mediaType === "VIDEO" || mediaType === "REEL";

  async function subir(files: FileList | null) {
    if (!files?.length) return;
    setSubiendo(true);
    setError("");
    try {
      const form = new FormData();
      for (const f of Array.from(files)) form.append("files", f);
      const res = await fetch("/api/admin/marketing/upload", { method: "POST", body: form });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "No se pudo subir");
      const urls = (data.files as { url: string; resourceType: string }[]).map((f) => f.url);
      if (esVideo) setVideoUrl(urls[0] ?? "");
      else setImageUrls((cur) => [...cur, ...urls].slice(0, 10));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error subiendo");
    } finally {
      setSubiendo(false);
    }
  }

  async function guardar() {
    if (!titulo.trim() || !caption.trim()) {
      return setError("Falta el título o el caption");
    }
    const platforms = [...(ig ? ["IG"] : []), ...(fb ? ["FB"] : [])];
    if (platforms.length === 0) return setError("Elegí al menos una plataforma");
    setBusy(true);
    setError("");
    try {
      const body = {
        titulo: titulo.trim(),
        caption: caption.trim(),
        idea: idea.trim() || undefined,
        mediaType,
        imageUrls: esVideo ? [] : imageUrls,
        videoUrls: esVideo && videoUrl ? [videoUrl] : [],
        platforms,
        scheduledAt: fecha ? new Date(fecha).toISOString() : null,
      };
      const res = await fetch(
        post ? `/api/admin/marketing/posts/${post.id}` : "/api/admin/marketing/posts",
        {
          method: post ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "No se pudo guardar");
      onSaved();
    } catch (e) {
      setBusy(false);
      setError(e instanceof Error ? e.message : "Error de conexión");
    }
  }

  return (
    <Modal onClose={onClose} title={post ? "Editar publicación" : "Nueva publicación"}>
      <div className="space-y-3">
        {error ? <ErrorState message={error} /> : null}
        <Field label="Título interno">
          <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} disabled={busy} placeholder="Ej: Caso Motos — turnos solos" />
        </Field>
        <Field label="Caption (el texto del post)">
          <Textarea rows={6} value={caption} onChange={(e) => setCaption(e.target.value)} disabled={busy} />
        </Field>
        <Field label="Brief visual (para diseñar la pieza con Claude)">
          <Textarea rows={3} value={idea} onChange={(e) => setIdea(e.target.value)} disabled={busy} placeholder="Qué tiene que mostrar la imagen/video…" />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Formato">
            <Select value={mediaType} onChange={(e) => setMediaType(e.target.value)} disabled={busy}>
              <option value="PHOTO">Foto</option>
              <option value="PHOTO_CAROUSEL">Carrusel</option>
              <option value="REEL">Reel (video)</option>
              <option value="VIDEO">Video</option>
            </Select>
          </Field>
          <Field label="Programar para (vacío = borrador)">
            <Input type="datetime-local" value={fecha} onChange={(e) => setFecha(e.target.value)} disabled={busy} />
          </Field>
        </div>

        <div className="space-y-2 rounded-md border p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium">
              {esVideo ? "Video (subí el archivo o pegá la URL del video IA)" : `Fotos (${imageUrls.length}/10)`}
            </p>
            <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()} disabled={busy || subiendo}>
              {subiendo ? <Spinner /> : null} 📄 Subir
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept={esVideo ? "video/*" : "image/*"}
              multiple={!esVideo}
              className="hidden"
              onChange={(e) => void subir(e.target.files)}
            />
          </div>
          {esVideo ? (
            <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://…/video.mp4" disabled={busy} />
          ) : imageUrls.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {imageUrls.map((url, i) => (
                <div key={url} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url.replace("/upload/", "/upload/w_80,h_100,c_fill,q_auto/")} alt="" className="h-16 w-12 rounded border object-cover" />
                  <button
                    type="button"
                    onClick={() => setImageUrls((cur) => cur.filter((_, j) => j !== i))}
                    className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground"
                    aria-label="Quitar foto"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Sin fotos todavía — se puede guardar igual y diseñarlas después.</p>
          )}
        </div>

        <div className="flex items-center gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={ig} onChange={(e) => setIg(e.target.checked)} className="h-4 w-4 accent-[var(--primary)]" />
            Instagram
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={fb} onChange={(e) => setFb(e.target.checked)} className="h-4 w-4 accent-[var(--primary)]" />
            Facebook
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose} disabled={busy}>Cancelar</Button>
          <Button onClick={() => void guardar()} disabled={busy}>
            {busy ? <Spinner /> : null}
            {fecha ? "Guardar y programar" : "Guardar borrador"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Modal del agente ──────────────────────────────────────────────────────
function AgenteModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [cantidad, setCantidad] = useState(5);
  const [brief, setBrief] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function generar() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/marketing/agente", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cantidad, brief: brief.trim() || undefined }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "El agente falló");
      onDone();
    } catch (e) {
      setBusy(false);
      setError(e instanceof Error ? e.message : "Error de conexión");
    }
  }

  return (
    <Modal onClose={onClose} title="🤖 Agente de marketing">
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Genera publicaciones con caption listo y un brief visual para diseñar cada pieza.
          Quedan como borradores para que las revises.
        </p>
        {error ? <ErrorState message={error} /> : null}
        <div className="grid grid-cols-3 gap-3">
          <Field label="Cantidad">
            <Select value={String(cantidad)} onChange={(e) => setCantidad(Number(e.target.value))} disabled={busy}>
              {[3, 5, 7, 10].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </Select>
          </Field>
          <div className="col-span-2">
            <Field label="Tema (opcional)">
              <Input value={brief} onChange={(e) => setBrief(e.target.value)} disabled={busy} placeholder="Ej: módulo de turnos, caso del taller…" />
            </Field>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose} disabled={busy}>Cancelar</Button>
          <Button onClick={() => void generar()} disabled={busy}>
            {busy ? <Spinner /> : null}
            {busy ? "Generando…" : "Generar borradores"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Modal genérico liviano ────────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-foreground/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="my-4 w-full max-w-lg rounded-lg border bg-card p-4 text-card-foreground shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function isoToLocal(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
