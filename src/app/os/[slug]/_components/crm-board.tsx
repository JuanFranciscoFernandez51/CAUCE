"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge, Card, ErrorState } from "@/components/ui";
import { CRM_STAGES, STAGE_LABELS } from "../_lib/labels";
import { relativeTime } from "../_lib/dates";

export type BoardContact = {
  id: string;
  name: string;
  phone: string | null;
  stage: string;
  temperatura: string;
  source: string | null;
  lastTouchAt: string | null;
};

/** Ciclo de temperatura al clic: caliente → tibio → frío → caliente. */
const TEMPS = ["caliente", "tibio", "frio"] as const;
const TEMP_UI: Record<string, { emoji: string; label: string }> = {
  caliente: { emoji: "🔥", label: "Caliente" },
  tibio: { emoji: "🟡", label: "Tibio" },
  frio: { emoji: "🔵", label: "Frío" },
};

/** Teléfono argentino → formato wa.me. */
function waNumber(tel: string): string {
  let d = tel.replace(/\D/g, "");
  if (d.startsWith("0")) d = d.slice(1);
  if (!d.startsWith("54")) d = `54${d}`;
  if (!d.startsWith("549")) d = `549${d.slice(2)}`;
  return d;
}

export function CrmBoard({ slug, contacts }: { slug: string; contacts: BoardContact[] }) {
  const router = useRouter();
  const [movingId, setMovingId] = useState<string | null>(null);
  const [dropStage, setDropStage] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function cycleTemp(contact: BoardContact) {
    const idx = TEMPS.indexOf(contact.temperatura as (typeof TEMPS)[number]);
    const next = TEMPS[(idx + 1) % TEMPS.length];
    setError("");
    const res = await fetch(`/api/os/${slug}/contacts/${contact.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ temperatura: next }),
    });
    if (res.ok) router.refresh();
    else setError("No se pudo cambiar la temperatura");
  }

  async function setStage(contact: BoardContact, next: string) {
    if (next === contact.stage) return;
    setMovingId(contact.id);
    setError("");
    try {
      const res = await fetch(`/api/os/${slug}/contacts/${contact.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: next }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "No se pudo mover el contacto");
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error de conexión");
    } finally {
      setMovingId(null);
    }
  }

  function moveStage(contact: BoardContact, dir: -1 | 1) {
    const idx = CRM_STAGES.indexOf(contact.stage as (typeof CRM_STAGES)[number]);
    const next = CRM_STAGES[(idx === -1 ? 0 : idx) + dir];
    if (next) void setStage(contact, next);
  }

  return (
    <div className="space-y-3">
      {error ? <ErrorState message={error} /> : null}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {CRM_STAGES.map((stage) => {
          const items = contacts.filter(
            (c) => c.stage === stage || (stage === "nuevo" && !STAGE_LABELS[c.stage])
          );
          return (
            <div
              key={stage}
              onDragOver={(e) => {
                e.preventDefault();
                setDropStage(stage);
              }}
              onDragLeave={() => setDropStage((d) => (d === stage ? null : d))}
              onDrop={(e) => {
                e.preventDefault();
                setDropStage(null);
                const id = e.dataTransfer.getData("text/contact-id");
                const c = contacts.find((x) => x.id === id);
                if (c) void setStage(c, stage);
              }}
              className={`rounded-lg p-2 transition-colors ${
                dropStage === stage ? "bg-primary-soft ring-2 ring-primary/40" : "bg-muted/60"
              }`}
            >
              <div className="flex items-center justify-between px-1 pb-2 pt-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {STAGE_LABELS[stage]}
                </p>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {items.length}
                </span>
              </div>
              <div className="space-y-2">
                {items.length === 0 ? (
                  <p className="px-1 py-3 text-center text-xs text-muted-foreground">—</p>
                ) : (
                  items.map((c) => {
                    const idx = CRM_STAGES.indexOf(stage);
                    const busy = movingId === c.id;
                    return (
                      <Card
                        key={c.id}
                        draggable
                        onDragStart={(e) => e.dataTransfer.setData("text/contact-id", c.id)}
                        className={`cursor-grab p-2.5 active:cursor-grabbing ${busy ? "opacity-50" : ""}`}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <Link
                            href={`/os/${slug}/crm/${c.id}`}
                            className="block truncate text-sm font-medium hover:text-primary hover:underline"
                          >
                            {c.name}
                          </Link>
                          <button
                            type="button"
                            onClick={() => void cycleTemp(c)}
                            title={`${TEMP_UI[c.temperatura]?.label ?? "Tibio"} — clic para cambiar`}
                            aria-label={`Temperatura de ${c.name}: ${TEMP_UI[c.temperatura]?.label ?? "tibio"}. Clic para cambiar.`}
                            className="shrink-0 rounded px-1 text-sm hover:bg-muted"
                          >
                            {TEMP_UI[c.temperatura]?.emoji ?? "🟡"}
                          </button>
                        </div>
                        {c.phone ? (
                          <p className="truncate text-xs text-muted-foreground">
                            <a
                              href={`https://wa.me/${waNumber(c.phone)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-success hover:underline"
                              title="Abrir WhatsApp"
                            >
                              💬 {c.phone}
                            </a>
                          </p>
                        ) : null}
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          {c.source === "bot" ? (
                            <Badge variant="primary">Vino del bot 🤖</Badge>
                          ) : null}
                          <span className="text-[11px] text-muted-foreground">
                            {relativeTime(c.lastTouchAt)}
                          </span>
                        </div>
                        <div className="mt-2 flex justify-between gap-1">
                          <button
                            type="button"
                            onClick={() => moveStage(c, -1)}
                            disabled={busy || idx <= 0}
                            aria-label={`Mover ${c.name} a la etapa anterior`}
                            className="h-7 flex-1 rounded border bg-card text-xs hover:bg-muted disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            ←
                          </button>
                          <button
                            type="button"
                            onClick={() => moveStage(c, 1)}
                            disabled={busy || idx >= CRM_STAGES.length - 1}
                            aria-label={`Mover ${c.name} a la etapa siguiente`}
                            className="h-7 flex-1 rounded border bg-card text-xs hover:bg-muted disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            →
                          </button>
                        </div>
                      </Card>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
