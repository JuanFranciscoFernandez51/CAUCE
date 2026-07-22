"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge, Card, EmptyState, ErrorState, Input, Select, Spinner } from "@/components/ui";

export type LeadView = {
  id: string;
  name: string;
  business: string | null;
  rubro: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  source: string;
  status: string;
  temperatura: string | null;
  score: number;
  esCliente: boolean; // tiene clientId vinculado
  createdAt: string;
};

const FUENTE: Record<string, { label: string; variant: "default" | "primary" | "success" | "warning" | "outline" }> = {
  INTAKE: { label: "🌐 Web", variant: "primary" },
  CONSULTORIA: { label: "🗓️ Consultoría", variant: "warning" },
  MANUAL: { label: "✍️ Manual", variant: "outline" },
  BOT: { label: "🤖 Bot", variant: "default" },
  WHATSAPP: { label: "💬 WhatsApp", variant: "success" },
  ADS: { label: "📢 Publicidad", variant: "primary" },
};

const TABS: { key: string; label: string }[] = [
  { key: "todos", label: "Todos" },
  { key: "NEW", label: "Nuevos" },
  { key: "RESPONDIDO", label: "Respondidos" },
  { key: "QUALIFIED", label: "Calificados" },
  { key: "CONVERTED", label: "Clientes" },
  { key: "LOST", label: "Perdidos" },
];

const TEMPS: { key: string; label: string; icon: string }[] = [
  { key: "caliente", label: "Caliente", icon: "🔥" },
  { key: "tibio", label: "Tibio", icon: "🌤️" },
  { key: "frio", label: "Frío", icon: "❄️" },
];

function fmtFecha(iso: string): string {
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "America/Argentina/Buenos_Aires",
  });
}

export function LeadsList({ leads }: { leads: LeadView[] }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [tab, setTab] = useState("todos");
  const [temp, setTemp] = useState("");
  const [fuente, setFuente] = useState("");
  const [q, setQ] = useState("");

  const filtrados = useMemo(() => {
    let r = leads;
    if (tab !== "todos") r = r.filter((l) => l.status === tab);
    if (temp) r = r.filter((l) => l.temperatura === temp);
    if (fuente) r = r.filter((l) => l.source === fuente);
    const t = q.trim().toLowerCase();
    if (t)
      r = r.filter(
        (l) =>
          l.name.toLowerCase().includes(t) ||
          (l.business ?? "").toLowerCase().includes(t) ||
          (l.rubro ?? "").toLowerCase().includes(t)
      );
    return r;
  }, [leads, tab, temp, fuente, q]);

  const contador = (key: string) =>
    key === "todos" ? leads.length : leads.filter((l) => l.status === key).length;

  async function patch(id: string, body: Record<string, unknown>) {
    setBusyId(id);
    setError("");
    try {
      const res = await fetch(`/api/admin/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "No se pudo guardar");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error de conexión");
    } finally {
      setBusyId(null);
    }
  }

  async function borrar(l: LeadView) {
    if (!window.confirm(`¿Borrar el lead "${l.name}"? No se puede deshacer.`)) return;
    setBusyId(l.id);
    setError("");
    try {
      const res = await fetch(`/api/admin/leads/${l.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "No se pudo borrar");
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setBusyId(null);
    }
  }

  const btnMini =
    "rounded-md border bg-card px-2 py-1 text-xs font-medium hover:bg-muted disabled:opacity-40";

  return (
    <div className="space-y-4">
      {/* Tabs de estado */}
      <div className="flex flex-wrap gap-1.5">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
              tab === t.key
                ? "bg-primary text-primary-foreground"
                : "border bg-card text-muted-foreground hover:bg-muted"
            }`}
          >
            {t.label} <span className="opacity-70">({contador(t.key)})</span>
          </button>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2">
        <Input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre, negocio o rubro…"
          className="h-9 max-w-xs text-sm"
          aria-label="Buscar leads"
        />
        <div className="flex gap-1">
          {TEMPS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTemp(temp === t.key ? "" : t.key)}
              className={`rounded-full border px-2.5 py-1 text-xs font-medium transition ${
                temp === t.key ? "border-primary bg-primary-soft text-primary" : "bg-card hover:bg-muted"
              }`}
              title={`Filtrar ${t.label.toLowerCase()}s`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
        <Select
          value={fuente}
          onChange={(e) => setFuente(e.target.value)}
          className="h-9 w-44 text-sm"
          aria-label="Filtrar por fuente"
        >
          <option value="">Todas las fuentes</option>
          {Object.entries(FUENTE).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </Select>
      </div>

      {error ? <ErrorState message={error} /> : null}

      {filtrados.length === 0 ? (
        <EmptyState
          icon="🎯"
          title={leads.length === 0 ? "Todavía no hay leads" : "Nada con esos filtros"}
          detail={
            leads.length === 0
              ? "Cuando alguien complete el intake, agende una consultoría o te escriba, aparece acá."
              : "Probá sacando algún filtro."
          }
        />
      ) : (
        <div className="space-y-2">
          {filtrados.map((l) => {
            const f = FUENTE[l.source] ?? { label: l.source, variant: "default" as const };
            const busy = busyId === l.id;
            const wa = (l.whatsapp ?? l.phone ?? "").replace(/\D/g, "");
            return (
              <Card key={l.id} className="p-3 sm:p-4">
                <div className="flex flex-wrap items-start gap-x-4 gap-y-2">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/admin/leads/${l.id}`}
                        className="font-semibold hover:text-primary hover:underline"
                      >
                        {l.name}
                      </Link>
                      <Badge variant={f.variant}>{f.label}</Badge>
                      {l.status === "CONVERTED" || l.esCliente ? (
                        <Badge variant="success">🤝 Cliente</Badge>
                      ) : l.status === "RESPONDIDO" ? (
                        <Badge variant="primary">✓ Respondido</Badge>
                      ) : l.status === "LOST" ? (
                        <Badge variant="outline">Perdido</Badge>
                      ) : l.status === "QUALIFIED" ? (
                        <Badge variant="warning">Calificado</Badge>
                      ) : (
                        <Badge variant="default">Nuevo</Badge>
                      )}
                      <span className="text-xs text-muted-foreground">{fmtFecha(l.createdAt)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {[l.business, l.rubro].filter(Boolean).join(" · ") || "Sin datos del negocio"}
                      {l.score > 0 ? ` · score ${l.score}` : ""}
                    </p>
                    {/* Temperatura: 1 clic marca / re-clic saca */}
                    <div className="flex gap-1 pt-0.5">
                      {TEMPS.map((t) => (
                        <button
                          key={t.key}
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            void patch(l.id, {
                              temperatura: l.temperatura === t.key ? null : t.key,
                            })
                          }
                          className={`rounded-full border px-2 py-0.5 text-xs transition ${
                            l.temperatura === t.key
                              ? "border-primary bg-primary-soft font-semibold text-primary"
                              : "bg-card opacity-50 hover:opacity-100"
                          }`}
                          title={t.label}
                        >
                          {t.icon}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                    {busy ? (
                      <Spinner className="text-muted-foreground" />
                    ) : (
                      <>
                        {wa ? (
                          <a
                            href={`https://wa.me/${wa.startsWith("54") ? wa : `54${wa}`}`}
                            target="_blank"
                            rel="noreferrer"
                            className={btnMini}
                            title="Abrir WhatsApp"
                          >
                            💬
                          </a>
                        ) : null}
                        {l.status !== "RESPONDIDO" && l.status !== "CONVERTED" ? (
                          <button
                            type="button"
                            className={btnMini}
                            onClick={() => void patch(l.id, { status: "RESPONDIDO" })}
                            title="Marcar como respondido"
                          >
                            ✓ Respondido
                          </button>
                        ) : null}
                        {l.status !== "CONVERTED" ? (
                          <button
                            type="button"
                            className={`${btnMini} text-success`}
                            onClick={() => void patch(l.id, { status: "CONVERTED" })}
                            title="Marcar como cliente"
                          >
                            🤝 Cliente
                          </button>
                        ) : null}
                        {l.status !== "LOST" && l.status !== "CONVERTED" ? (
                          <button
                            type="button"
                            className={btnMini}
                            onClick={() => void patch(l.id, { status: "LOST" })}
                            title="Marcar como perdido"
                          >
                            ✗
                          </button>
                        ) : null}
                        <button
                          type="button"
                          className={`${btnMini} hover:text-destructive`}
                          onClick={() => void borrar(l)}
                          title="Borrar lead"
                        >
                          🗑️
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
