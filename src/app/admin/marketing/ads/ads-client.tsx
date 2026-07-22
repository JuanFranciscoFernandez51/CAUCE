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

export type CampaignView = {
  id: string;
  name: string;
  objective: string;
  status: string;
  dailyBudgetArs: number;
  startDate: string;
  endDate: string;
  creativeMediaType: string;
  creativeImageUrl: string | null;
  creativeCaption: string;
  insights: Record<string, string> | null;
  errorMessage: string | null;
  enMeta: boolean;
  adNames: string[];
};

const OBJETIVOS: { value: string; label: string }[] = [
  { value: "OUTCOME_TRAFFIC", label: "Tráfico al sitio" },
  { value: "OUTCOME_LEADS", label: "Consultas (leads)" },
  { value: "OUTCOME_ENGAGEMENT", label: "Interacción" },
  { value: "OUTCOME_AWARENESS", label: "Alcance" },
];

const CTAS: { value: string; label: string }[] = [
  { value: "LEARN_MORE", label: "Más información" },
  { value: "MESSAGE_PAGE", label: "Enviar mensaje" },
  { value: "WHATSAPP_MESSAGE", label: "WhatsApp" },
  { value: "CONTACT_US", label: "Contactanos" },
  { value: "SIGN_UP", label: "Registrarse" },
];

const ESTADO: Record<string, { label: string; variant: "default" | "success" | "warning" | "destructive" | "outline" }> = {
  DRAFT: { label: "Borrador", variant: "outline" },
  IN_META_PAUSED: { label: "En Meta (pausada)", variant: "default" },
  ACTIVE: { label: "🟢 Activa", variant: "success" },
  PAUSED_BY_USER: { label: "Pausada", variant: "warning" },
  COMPLETED: { label: "Terminada", variant: "outline" },
  FAILED: { label: "Falló", variant: "destructive" },
};

export function AdsClient({
  campaigns,
  conectado,
  adsReady,
  adAccountId,
}: {
  campaigns: CampaignView[];
  conectado: boolean;
  adsReady: boolean;
  adAccountId: string | null;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [nueva, setNueva] = useState(false);

  async function accion(id: string, body: Record<string, unknown>) {
    setBusyId(id);
    setError("");
    try {
      const res = await fetch(`/api/admin/marketing/campaigns/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "No se pudo");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error de conexión");
    } finally {
      setBusyId(null);
    }
  }

  async function borrar(c: CampaignView) {
    if (!window.confirm(`¿Eliminar la campaña "${c.name}"?${c.enMeta ? " Se pausa en Meta." : ""}`)) return;
    setBusyId(c.id);
    try {
      const res = await fetch(`/api/admin/marketing/campaigns/${c.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "No se pudo eliminar");
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      {!adAccountId ? <SetupAdAccount conectado={conectado} /> : null}
      {adAccountId && !adsReady ? (
        <Card className="border-warning/40 bg-warning/10 p-4 text-sm">
          ⚠️ Cuenta publicitaria configurada ({adAccountId}) pero faltan los permisos de ads —
          usá &quot;Conectar con Ads&quot; en Marketing cuando la app de Meta tenga la Marketing API
          aprobada. Mientras tanto podés dejar campañas armadas en borrador.
        </Card>
      ) : null}

      {error ? <ErrorState message={error} /> : null}

      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Campañas</h2>
        <Button size="sm" onClick={() => setNueva(true)}>
          + Campaña
        </Button>
      </div>

      {campaigns.length === 0 ? (
        <EmptyState
          icon="📢"
          title="Sin campañas todavía"
          detail="Armá la primera: elegís objetivo, presupuesto por día, público y el anuncio. Queda en borrador hasta que la publiques a Meta."
          action={<Button onClick={() => setNueva(true)}>+ Campaña</Button>}
        />
      ) : (
        <div className="space-y-2">
          {campaigns.map((c) => {
            const est = ESTADO[c.status] ?? ESTADO.DRAFT;
            const busy = busyId === c.id;
            const ins = c.insights;
            return (
              <Card key={c.id} className="p-3 sm:p-4">
                <div className="flex flex-wrap items-start gap-3">
                  {c.creativeImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={c.creativeImageUrl.replace("/upload/", "/upload/w_120,h_120,c_fill,q_auto/")}
                      alt=""
                      className="h-16 w-16 shrink-0 rounded-md border object-cover"
                    />
                  ) : (
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md border bg-muted text-2xl">
                      🎬
                    </div>
                  )}
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{c.name}</p>
                      <Badge variant={est.variant}>{est.label}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {OBJETIVOS.find((o) => o.value === c.objective)?.label ?? c.objective} · $
                      {c.dailyBudgetArs.toLocaleString("es-AR")}/día ·{" "}
                      {new Date(c.startDate).toLocaleDateString("es-AR")} →{" "}
                      {new Date(c.endDate).toLocaleDateString("es-AR")}
                    </p>
                    {ins ? (
                      <p className="text-xs text-muted-foreground">
                        👁 {ins.impressions ?? "0"} impresiones · 🖱 {ins.clicks ?? "0"} clics ·
                        CTR {ins.ctr ? `${Number(ins.ctr).toFixed(2)}%` : "—"} · gastado $
                        {ins.spend ?? "0"}
                      </p>
                    ) : null}
                    {c.adNames.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {c.adNames.map((n) => (
                          <span key={n} className="rounded-full border px-2 py-0.5 text-[10px] text-muted-foreground">
                            🎬 {n}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    {c.errorMessage ? (
                      <p className="text-xs text-destructive">{c.errorMessage}</p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                    {busy ? (
                      <Spinner className="text-muted-foreground" />
                    ) : (
                      <>
                        {c.status === "DRAFT" || c.status === "FAILED" ? (
                          <Button
                            size="sm"
                            disabled={!adsReady}
                            title={adsReady ? "Crear en Meta (queda pausada)" : "Faltan permisos de ads"}
                            onClick={() => void accion(c.id, { accion: "publicar" })}
                          >
                            ⬆ Publicar a Meta
                          </Button>
                        ) : null}
                        {c.status === "IN_META_PAUSED" || c.status === "PAUSED_BY_USER" ? (
                          <Button
                            size="sm"
                            onClick={() => {
                              if (
                                window.confirm(
                                  `¿Activar "${c.name}"? Empieza a gastar $${c.dailyBudgetArs.toLocaleString("es-AR")}/día.`
                                )
                              ) {
                                void accion(c.id, { accion: "activar", confirm: true });
                              }
                            }}
                          >
                            ▶ Activar
                          </Button>
                        ) : null}
                        {c.status === "ACTIVE" ? (
                          <Button variant="secondary" size="sm" onClick={() => void accion(c.id, { accion: "pausar" })}>
                            ⏸ Pausar
                          </Button>
                        ) : null}
                        {c.enMeta ? (
                          <Button variant="ghost" size="sm" title="Traer métricas" onClick={() => void accion(c.id, { accion: "sync" })}>
                            🔄
                          </Button>
                        ) : null}
                        <Button variant="ghost" size="sm" title="Eliminar" onClick={() => void borrar(c)}>
                          🗑️
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {nueva ? (
        <NuevaCampana
          onClose={() => setNueva(false)}
          onSaved={() => {
            setNueva(false);
            router.refresh();
          }}
        />
      ) : null}
    </div>
  );
}

// ── Setup de la cuenta publicitaria ──────────────────────────────────────
function SetupAdAccount({ conectado }: { conectado: boolean }) {
  const router = useRouter();
  const [manual, setManual] = useState("");
  const [cuentas, setCuentas] = useState<{ id: string; name: string; currency: string }[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function listar() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/marketing/ad-account");
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "No se pudieron listar");
      setCuentas(data.accounts);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  async function guardar(id: string) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/marketing/ad-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adAccountId: id }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "No se pudo guardar");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
      setBusy(false);
    }
  }

  return (
    <Card className="space-y-3 p-4">
      <p className="text-sm font-medium">1 · Elegí la cuenta publicitaria de Cauce</p>
      {error ? <ErrorState message={error} /> : null}
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" size="sm" onClick={() => void listar()} disabled={busy || !conectado} title={conectado ? "" : "Primero conectá Meta"}>
          {busy && !cuentas ? <Spinner /> : null} Listar mis cuentas
        </Button>
        <span className="text-xs text-muted-foreground">o cargala a mano:</span>
        <Input
          value={manual}
          onChange={(e) => setManual(e.target.value)}
          placeholder="act_1234567890"
          className="h-8 w-44 text-xs"
        />
        <Button size="sm" disabled={busy || !/^act_\d+$/.test(manual)} onClick={() => void guardar(manual)}>
          Guardar
        </Button>
      </div>
      {cuentas ? (
        <div className="space-y-1">
          {cuentas.length === 0 ? (
            <p className="text-xs text-muted-foreground">No aparecieron cuentas — cargala a mano.</p>
          ) : (
            cuentas.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => void guardar(c.id)}
                disabled={busy}
                className="flex w-full items-center justify-between rounded-md border bg-card px-3 py-2 text-left text-sm hover:bg-muted"
              >
                <span>{c.name}</span>
                <span className="font-mono text-xs text-muted-foreground">
                  {c.id} · {c.currency}
                </span>
              </button>
            ))
          )}
        </div>
      ) : null}
    </Card>
  );
}

// ── Modal nueva campaña ──────────────────────────────────────────────────
function NuevaCampana({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const hoy = new Date();
  const enUnaSemana = new Date(hoy.getTime() + 7 * 86_400_000);
  const toDateInput = (d: Date) => d.toISOString().slice(0, 10);

  const [name, setName] = useState("");
  const [objective, setObjective] = useState("OUTCOME_TRAFFIC");
  const [budget, setBudget] = useState(3000);
  const [desde, setDesde] = useState(toDateInput(hoy));
  const [hasta, setHasta] = useState(toDateInput(enUnaSemana));
  const [ageMin, setAgeMin] = useState(25);
  const [ageMax, setAgeMax] = useState(60);
  const [genders, setGenders] = useState<"all" | "hombres" | "mujeres">("all");
  const [mediaType, setMediaType] = useState("PHOTO");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [cta, setCta] = useState("LEARN_MORE");
  const [destino, setDestino] = useState("https://cauce-arg.vercel.app");
  const [busy, setBusy] = useState(false);
  const [sugiriendo, setSugiriendo] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState("");

  const esVideo = mediaType === "VIDEO" || mediaType === "REEL";

  async function sugerir() {
    setSugiriendo(true);
    setError("");
    try {
      const res = await fetch("/api/admin/marketing/caption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ objetivo: objective, brief: name || undefined }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "La IA falló");
      setCaption(data.caption);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setSugiriendo(false);
    }
  }

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
      const urls = (data.files as { url: string }[]).map((f) => f.url);
      if (esVideo) setVideoUrl(urls[0] ?? "");
      else setImageUrls((cur) => [...cur, ...urls].slice(0, 10));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error subiendo");
    } finally {
      setSubiendo(false);
    }
  }

  async function guardar() {
    if (!name.trim() || !caption.trim()) return setError("Falta el nombre o el caption");
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/marketing/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          objective,
          dailyBudgetArs: budget,
          startDate: new Date(`${desde}T00:00:00-03:00`).toISOString(),
          endDate: new Date(`${hasta}T23:59:00-03:00`).toISOString(),
          audience: { ageMin, ageMax, genders, countries: ["AR"] },
          creativeMediaType: mediaType,
          creativeImageUrls: esVideo ? [] : imageUrls,
          creativeVideoUrl: esVideo && videoUrl ? videoUrl : null,
          creativeCaption: caption.trim(),
          creativeCallToAction: cta,
          destinationUrl: destino || null,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "No se pudo crear");
      onSaved();
    } catch (e) {
      setBusy(false);
      setError(e instanceof Error ? e.message : "Error de conexión");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-foreground/40 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="my-4 w-full max-w-xl rounded-lg border bg-card p-4 text-card-foreground shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold">Nueva campaña</h3>
          <button type="button" onClick={onClose} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Cerrar">
            ✕
          </button>
        </div>

        <div className="space-y-3">
          {error ? <ErrorState message={error} /> : null}

          <Field label="Nombre">
            <Input value={name} onChange={(e) => setName(e.target.value)} disabled={busy} placeholder="Cauce — turnos para peluquerías — julio" />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Objetivo">
              <Select value={objective} onChange={(e) => setObjective(e.target.value)} disabled={busy}>
                {OBJETIVOS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </Select>
            </Field>
            <Field label="Presupuesto por día (ARS)">
              <Input type="number" min={1000} step={500} value={budget} onChange={(e) => setBudget(Number(e.target.value))} disabled={busy} />
            </Field>
            <Field label="Desde">
              <Input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} disabled={busy} />
            </Field>
            <Field label="Hasta">
              <Input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} disabled={busy} />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Edad mín.">
              <Input type="number" min={18} max={65} value={ageMin} onChange={(e) => setAgeMin(Number(e.target.value))} disabled={busy} />
            </Field>
            <Field label="Edad máx.">
              <Input type="number" min={18} max={65} value={ageMax} onChange={(e) => setAgeMax(Number(e.target.value))} disabled={busy} />
            </Field>
            <Field label="Género">
              <Select value={genders} onChange={(e) => setGenders(e.target.value as typeof genders)} disabled={busy}>
                <option value="all">Todos</option>
                <option value="hombres">Hombres</option>
                <option value="mujeres">Mujeres</option>
              </Select>
            </Field>
          </div>
          <p className="text-xs text-muted-foreground">País: Argentina (targeting exacto, sin expansión automática de Meta).</p>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Formato del anuncio">
              <Select value={mediaType} onChange={(e) => setMediaType(e.target.value)} disabled={busy}>
                <option value="PHOTO">Foto</option>
                <option value="PHOTO_CAROUSEL">Carrusel</option>
                <option value="VIDEO">Video</option>
                <option value="REEL">Reel</option>
              </Select>
            </Field>
            <Field label="Botón (CTA)">
              <Select value={cta} onChange={(e) => setCta(e.target.value)} disabled={busy}>
                {CTAS.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="space-y-2 rounded-md border p-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium">{esVideo ? "Video del anuncio" : `Imágenes (${imageUrls.length})`}</p>
              <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()} disabled={busy || subiendo}>
                {subiendo ? <Spinner /> : null} 📄 Subir
              </Button>
              <input ref={fileRef} type="file" accept={esVideo ? "video/*" : "image/*"} multiple={!esVideo} className="hidden" onChange={(e) => void subir(e.target.files)} />
            </div>
            {esVideo ? (
              <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://…/video.mp4 (el video IA subido)" disabled={busy} />
            ) : imageUrls.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {imageUrls.map((url, i) => (
                  <div key={url} className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url.replace("/upload/", "/upload/w_80,h_80,c_fill,q_auto/")} alt="" className="h-14 w-14 rounded border object-cover" />
                    <button
                      type="button"
                      onClick={() => setImageUrls((cur) => cur.filter((_, j) => j !== i))}
                      className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground"
                      aria-label="Quitar"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Subí al menos una imagen para poder publicarla.</p>
            )}
          </div>

          <Field label="Texto del anuncio">
            <div className="space-y-1.5">
              <Textarea rows={4} value={caption} onChange={(e) => setCaption(e.target.value)} disabled={busy} />
              <Button variant="secondary" size="sm" onClick={() => void sugerir()} disabled={busy || sugiriendo}>
                {sugiriendo ? <Spinner /> : null} ✨ Sugerir con IA
              </Button>
            </div>
          </Field>

          <Field label="URL de destino">
            <Input value={destino} onChange={(e) => setDestino(e.target.value)} disabled={busy} />
          </Field>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={onClose} disabled={busy}>Cancelar</Button>
            <Button onClick={() => void guardar()} disabled={busy}>
              {busy ? <Spinner /> : null} Guardar borrador
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
