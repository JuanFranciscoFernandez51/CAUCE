"use client";

import { useMemo, useState } from "react";
import type { PricingData, PackKey } from "@/lib/pricing";
import { Badge, Button, Card, Field, Input } from "@/components/ui";
import type { ProcesoCatalogo } from "@/lib/procesos-catalogo";

const PACKS: PackKey[] = ["starter", "pro", "scale", "custom"];

const fmtUsd = (n: number) => `USD ${n.toLocaleString("es-AR")}`;
const fmtArs = (n: number) => `$ ${Math.round(n).toLocaleString("es-AR")}`;

/**
 * Armador de presupuestos: elegís pack + módulos + procesos y te da el
 * número final en vivo (USD y ARS, con y sin IVA) + el texto listo para
 * mandar por WhatsApp. Sin pantallas intermedias.
 */
export function PresupuestoBuilder({
  pricing,
  procesos,
}: {
  pricing: PricingData;
  procesos: ProcesoCatalogo[];
}) {
  const [negocio, setNegocio] = useState("");
  const [pack, setPack] = useState<PackKey>("scale");
  const [mods, setMods] = useState<string[]>([]);
  const [procs, setProcs] = useState<string[]>([]);
  const [conIva, setConIva] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const p = pricing.packs[pack];
  const moduleEntries = Object.entries(pricing.modulePricing);

  const calc = useMemo(() => {
    const setupBase = p.setupUsd ?? 0;
    const mensualBase = p.monthlyUsd ?? 0;
    // Los módulos suman al mensual solo en Scale/Custom (el software propio).
    const sumaModulos =
      pack === "scale" || pack === "custom"
        ? mods.reduce((acc, m) => acc + (pricing.modulePricing[m]?.monthlyUsd ?? 0), 0)
        : 0;
    const iva = conIva ? 1 + pricing.ivaPct / 100 : 1;
    const setup = setupBase * iva;
    const mensual = (mensualBase + sumaModulos) * iva;
    return {
      setup,
      mensual,
      setupArs: setup * pricing.dolarArs,
      mensualArs: mensual * pricing.dolarArs,
      aCotizar: p.setupUsd === null || p.monthlyUsd === null,
    };
  }, [p, pack, mods, conIva, pricing]);

  const toggle = (list: string[], set: (v: string[]) => void, key: string) =>
    set(list.includes(key) ? list.filter((x) => x !== key) : [...list, key]);

  const texto = useMemo(() => {
    const lineas: string[] = [];
    lineas.push(`Presupuesto Cauce${negocio ? ` — ${negocio}` : ""}`);
    lineas.push("");
    lineas.push(`Pack ${p.label}: ${p.tagline}`);
    if (mods.length > 0) {
      lineas.push(`Software propio con: ${mods.map((m) => pricing.modulePricing[m]?.label ?? m).join(", ")}.`);
    }
    if (procs.length > 0) {
      lineas.push("");
      lineas.push("Procesos que quedan corriendo solos:");
      for (const k of procs) {
        const pr = procesos.find((x) => x.key === k);
        if (pr) lineas.push(`• ${pr.nombre}: ${pr.queHace}`);
      }
    }
    lineas.push("");
    if (calc.aCotizar) {
      lineas.push("Inversión: a cotizar según alcance (coordinamos una llamada).");
    } else {
      lineas.push(
        `Inversión: ${fmtUsd(calc.setup)} de armado (único) + ${fmtUsd(calc.mensual)}/mes` +
          (conIva ? " (IVA incluido)" : " + IVA")
      );
      lineas.push(`En pesos hoy: ${fmtArs(calc.setupArs)} + ${fmtArs(calc.mensualArs)}/mes.`);
    }
    lineas.push("");
    lineas.push("Incluye: tu web, tu software de gestión y tus procesos, con tu marca. Lo dejamos andando y lo mantenemos.");
    return lineas.join("\n");
  }, [negocio, p, mods, procs, calc, conIva, pricing, procesos]);

  async function copiar() {
    await navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      {/* Columna izquierda: elegir */}
      <div className="space-y-5">
        <Card className="p-5">
          <Field label="Negocio" help="Para el encabezado del presupuesto.">
            <Input
              value={negocio}
              onChange={(e) => setNegocio(e.target.value)}
              placeholder="Ej: Bicicletería Ruta 3"
            />
          </Field>
        </Card>

        <Card className="p-5">
          <h2 className="mb-3 font-semibold">1 · Pack</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {PACKS.map((k) => {
              const pk = pricing.packs[k];
              const active = pack === k;
              return (
                <button
                  key={k}
                  onClick={() => setPack(k)}
                  className={`rounded-md border p-3 text-left transition-colors ${
                    active ? "border-primary bg-primary-soft" : "hover:bg-muted"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold">{pk.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {pk.monthlyUsd === null ? "a cotizar" : `${fmtUsd(pk.monthlyUsd)}/mes`}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{pk.tagline}</p>
                </button>
              );
            })}
          </div>
        </Card>

        {pack === "scale" || pack === "custom" ? (
          <Card className="p-5">
            <h2 className="mb-1 font-semibold">2 · Módulos del software</h2>
            <p className="mb-3 text-sm text-muted-foreground">Cada módulo suma al mensual.</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {moduleEntries.map(([key, m]) => {
                const active = mods.includes(key);
                return (
                  <button
                    key={key}
                    onClick={() => toggle(mods, setMods, key)}
                    className={`flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                      active ? "border-primary bg-primary-soft" : "hover:bg-muted"
                    }`}
                  >
                    <span className="font-medium">{m.label}</span>
                    <span className="text-xs text-muted-foreground">+{fmtUsd(m.monthlyUsd)}/mes</span>
                  </button>
                );
              })}
            </div>
          </Card>
        ) : null}

        <Card className="p-5">
          <h2 className="mb-1 font-semibold">{pack === "scale" || pack === "custom" ? "3" : "2"} · Procesos</h2>
          <p className="mb-3 text-sm text-muted-foreground">
            Lo que queda corriendo solo. Entra al texto del presupuesto tal cual.
          </p>
          <div className="space-y-2">
            {procesos.map((pr) => {
              const active = procs.includes(pr.key);
              return (
                <button
                  key={pr.key}
                  onClick={() => toggle(procs, setProcs, pr.key)}
                  className={`block w-full rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                    active ? "border-primary bg-primary-soft" : "hover:bg-muted"
                  }`}
                >
                  <span className="font-medium">{pr.nombre}</span>
                  <span className="block text-xs text-muted-foreground">{pr.queHace}</span>
                </button>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Columna derecha: el número + el texto, en vivo */}
      <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
        <Card className="p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-semibold">El número</h2>
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={conIva}
                onChange={(e) => setConIva(e.target.checked)}
                className="h-3.5 w-3.5 accent-[var(--primary)]"
              />
              con IVA ({pricing.ivaPct}%)
            </label>
          </div>
          {calc.aCotizar ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Este pack se cotiza según alcance — el texto lo aclara.
            </p>
          ) : (
            <dl className="mt-3 space-y-2">
              <div className="flex items-baseline justify-between">
                <dt className="text-sm text-muted-foreground">Armado (único)</dt>
                <dd className="text-right">
                  <span className="text-lg font-bold">{fmtUsd(calc.setup)}</span>
                  <span className="block text-xs text-muted-foreground">{fmtArs(calc.setupArs)}</span>
                </dd>
              </div>
              <div className="flex items-baseline justify-between">
                <dt className="text-sm text-muted-foreground">Mensual</dt>
                <dd className="text-right">
                  <span className="text-lg font-bold">{fmtUsd(calc.mensual)}</span>
                  <span className="block text-xs text-muted-foreground">{fmtArs(calc.mensualArs)}/mes</span>
                </dd>
              </div>
            </dl>
          )}
          <p className="mt-2 text-xs text-muted-foreground">
            Dólar de referencia: ${pricing.dolarArs.toLocaleString("es-AR")} (se cambia en Configuración).
          </p>
        </Card>

        <Card className="p-5">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 className="font-semibold">Texto para mandar</h2>
            <div className="flex items-center gap-2">
              {copiado ? <Badge variant="success">Copiado ✓</Badge> : null}
              <Button size="sm" onClick={copiar}>Copiar</Button>
            </div>
          </div>
          <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-md bg-muted/50 p-3 text-xs leading-relaxed">
            {texto}
          </pre>
        </Card>
      </div>
    </div>
  );
}
