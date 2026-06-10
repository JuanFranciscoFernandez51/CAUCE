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
  source: string | null;
  lastTouchAt: string | null;
};

export function CrmBoard({ slug, contacts }: { slug: string; contacts: BoardContact[] }) {
  const router = useRouter();
  const [movingId, setMovingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function moveStage(contact: BoardContact, dir: -1 | 1) {
    const idx = CRM_STAGES.indexOf(contact.stage as (typeof CRM_STAGES)[number]);
    const safeIdx = idx === -1 ? 0 : idx;
    const next = CRM_STAGES[safeIdx + dir];
    if (!next) return;
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

  return (
    <div className="space-y-3">
      {error ? <ErrorState message={error} /> : null}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {CRM_STAGES.map((stage) => {
          const items = contacts.filter(
            (c) => c.stage === stage || (stage === "nuevo" && !STAGE_LABELS[c.stage])
          );
          return (
            <div key={stage} className="rounded-lg bg-muted/60 p-2">
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
                      <Card key={c.id} className={`p-2.5 ${busy ? "opacity-50" : ""}`}>
                        <Link
                          href={`/os/${slug}/crm/${c.id}`}
                          className="block truncate text-sm font-medium hover:text-primary hover:underline"
                        >
                          {c.name}
                        </Link>
                        {c.phone ? (
                          <p className="truncate text-xs text-muted-foreground">{c.phone}</p>
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
