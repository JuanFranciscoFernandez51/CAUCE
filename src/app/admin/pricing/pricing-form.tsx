"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PricingData, PackKey } from "@/lib/pricing";
import { Button, Card, ErrorState, Field, Input, Spinner, Textarea } from "@/components/ui";

const PACKS: PackKey[] = ["starter", "pro", "scale", "custom"];

function ars(usd: number | null, dolar: number): string {
  if (usd === null || Number.isNaN(usd)) return "";
  return `≈ $ ${Math.round(usd * dolar).toLocaleString("es-AR")} ARS`;
}

type PackForm = {
  label: string;
  tagline: string;
  setupUsd: string;
  setupFrom: boolean;
  monthlyUsd: string;
  monthlyFrom: boolean;
  fairUseMsgs: string;
  features: string;
};

export function PricingForm({ initial }: { initial: PricingData }) {
  const router = useRouter();
  const [dolarArs, setDolarArs] = useState(String(initial.dolarArs));
  const [ivaPct, setIvaPct] = useState(String(initial.ivaPct));
  const [roadmapPriceUsd, setRoadmapPriceUsd] = useState(String(initial.roadmapPriceUsd));
  const [roadmapCredit, setRoadmapCredit] = useState(initial.roadmapCredit);
  const [packs, setPacks] = useState<Record<PackKey, PackForm>>(() => {
    const out = {} as Record<PackKey, PackForm>;
    for (const k of PACKS) {
      const p = initial.packs[k];
      out[k] = {
        label: p.label,
        tagline: p.tagline,
        setupUsd: p.setupUsd === null ? "" : String(p.setupUsd),
        setupFrom: p.setupFrom,
        monthlyUsd: p.monthlyUsd === null ? "" : String(p.monthlyUsd),
        monthlyFrom: p.monthlyFrom,
        fairUseMsgs: p.fairUseMsgs === null ? "" : String(p.fairUseMsgs),
        features: p.features.join("\n"),
      };
    }
    return out;
  });
  const [modules, setModules] = useState(
    Object.entries(initial.modulePricing).map(([key, m]) => ({
      key,
      label: m.label,
      monthlyUsd: String(m.monthlyUsd),
    }))
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const dolar = Number(dolarArs) || 0;

  function setPack(k: PackKey, patch: Partial<PackForm>) {
    setPacks((ps) => ({ ...ps, [k]: { ...ps[k], ...patch } }));
  }

  async function save() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const body = {
        dolarArs: Number(dolarArs),
        ivaPct: Number(ivaPct),
        roadmapPriceUsd: Number(roadmapPriceUsd) || 0,
        roadmapCredit,
        packs: Object.fromEntries(
          PACKS.map((k) => {
            const p = packs[k];
            return [
              k,
              {
                label: p.label,
                tagline: p.tagline,
                setupUsd: p.setupUsd.trim() === "" ? null : Number(p.setupUsd),
                setupFrom: p.setupFrom,
                monthlyUsd: p.monthlyUsd.trim() === "" ? null : Number(p.monthlyUsd),
                monthlyFrom: p.monthlyFrom,
                fairUseMsgs: p.fairUseMsgs.trim() === "" ? null : Number(p.fairUseMsgs),
                features: p.features.split("\n").map((f) => f.trim()).filter(Boolean),
              },
            ];
          })
        ),
        modulePricing: Object.fromEntries(
          modules.map((m) => [m.key, { label: m.label, monthlyUsd: Number(m.monthlyUsd) || 0 }])
        ),
      };
      const res = await fetch("/api/admin/pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "No se pudo guardar");
      setSaved(true);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <h2 className="mb-3 font-semibold">General</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Dólar (ARS por USD)" help="Para mostrar la referencia en pesos">
            <Input type="number" min="1" value={dolarArs} onChange={(e) => setDolarArs(e.target.value)} />
          </Field>
          <Field label="IVA %">
            <Input type="number" min="0" value={ivaPct} onChange={(e) => setIvaPct(e.target.value)} />
          </Field>
          <Field label="Precio del roadmap (USD)" help="0 = la consultoría incluye el roadmap gratis">
            <Input
              type="number"
              min="0"
              value={roadmapPriceUsd}
              onChange={(e) => setRoadmapPriceUsd(e.target.value)}
            />
          </Field>
          <div className="flex items-end pb-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={roadmapCredit}
                onChange={(e) => setRoadmapCredit(e.target.checked)}
                className="h-4 w-4 accent-[var(--primary)]"
              />
              El roadmap pago se acredita al setup
            </label>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {PACKS.map((k) => {
          const p = packs[k];
          return (
            <Card key={k} className="space-y-3 p-5">
              <h2 className="font-semibold capitalize">{p.label || k}</h2>
              <Field label="Tagline">
                <Input value={p.tagline} onChange={(e) => setPack(k, { tagline: e.target.value })} />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Setup USD (único)" help={p.setupUsd === "" ? "Vacío = a cotizar" : ars(Number(p.setupUsd), dolar)}>
                  <Input
                    type="number"
                    min="0"
                    value={p.setupUsd}
                    placeholder="a cotizar"
                    onChange={(e) => setPack(k, { setupUsd: e.target.value })}
                  />
                </Field>
                <Field label="Mensual USD (retainer)" help={p.monthlyUsd === "" ? "Vacío = a consultar" : ars(Number(p.monthlyUsd), dolar)}>
                  <Input
                    type="number"
                    min="0"
                    value={p.monthlyUsd}
                    placeholder="a consultar"
                    onChange={(e) => setPack(k, { monthlyUsd: e.target.value })}
                  />
                </Field>
              </div>
              <div className="flex flex-wrap gap-4 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={p.setupFrom}
                    onChange={(e) => setPack(k, { setupFrom: e.target.checked })}
                    className="h-4 w-4 accent-[var(--primary)]"
                  />
                  Setup &quot;desde&quot;
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={p.monthlyFrom}
                    onChange={(e) => setPack(k, { monthlyFrom: e.target.checked })}
                    className="h-4 w-4 accent-[var(--primary)]"
                  />
                  Mensual &quot;desde&quot;
                </label>
              </div>
              <Field label="Tope de mensajes/mes (fair use)" help="Vacío = sin tope. Al 80% avisa, al 100% CTA de upgrade.">
                <Input
                  type="number"
                  min="0"
                  value={p.fairUseMsgs}
                  placeholder="sin tope"
                  onChange={(e) => setPack(k, { fairUseMsgs: e.target.value })}
                />
              </Field>
              <Field label="Features (una por línea)">
                <Textarea
                  rows={5}
                  value={p.features}
                  onChange={(e) => setPack(k, { features: e.target.value })}
                />
              </Field>
            </Card>
          );
        })}
      </div>

      <Card className="p-5">
        <h2 className="mb-1 font-semibold">Módulos de Cauce OS (pack Scale)</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          El mensual de Scale sube según los módulos activos del cliente.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((m, i) => (
            <Field key={m.key} label={m.label} help={ars(Number(m.monthlyUsd), dolar)}>
              <Input
                type="number"
                min="0"
                value={m.monthlyUsd}
                onChange={(e) =>
                  setModules((ms) => ms.map((x, j) => (j === i ? { ...x, monthlyUsd: e.target.value } : x)))
                }
              />
            </Field>
          ))}
        </div>
      </Card>

      {error ? <ErrorState message={error} /> : null}
      {saved ? <p className="text-sm font-medium text-success">Guardado. El sitio público ya muestra los nuevos precios.</p> : null}
      <Button onClick={save} disabled={saving} size="lg">
        {saving ? <Spinner /> : null} Guardar pricing
      </Button>
    </div>
  );
}
