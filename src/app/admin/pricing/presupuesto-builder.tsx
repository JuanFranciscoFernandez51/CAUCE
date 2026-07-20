"use client";

import { useMemo, useState } from "react";
import type { PricingData } from "@/lib/pricing";
import { Badge, Button, Card, Field, Input } from "@/components/ui";
import type { ProcesoCatalogo } from "@/lib/procesos-catalogo";
import {
  calcularPiezas,
  ESPEJOS,
  PIEZA_BASE,
  PIEZAS,
  valorHorasUsdMes,
  VALOR_EMPLEADO_USD_MES,
} from "@/lib/piezas";

const fmtUsd = (n: number) => `USD ${n.toLocaleString("es-AR")}`;
const fmtArs = (n: number) => `$ ${Math.round(n).toLocaleString("es-AR")}`;

/**
 * Armador de presupuestos en 3 capas (modelo jul-2026):
 * 1) RESULTADO: horas que recupera (según procesos elegidos) y qué valen.
 * 2) ESPEJO: el caso real que se le parece, con su ancla de precio.
 * 3) DESGLOSE: base + piezas con precio chico, total en vivo.
 */
export function PresupuestoBuilder({
  pricing,
  procesos,
}: {
  pricing: PricingData;
  procesos: ProcesoCatalogo[];
}) {
  const [negocio, setNegocio] = useState("");
  const [contacto, setContacto] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [espejo, setEspejo] = useState(ESPEJOS[0].key);
  const [piezas, setPiezas] = useState<string[]>(ESPEJOS[0].piezas);
  const [procs, setProcs] = useState<string[]>(procesos.filter((p) => p.base).map((p) => p.key));
  const [conIva, setConIva] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [propuestaUrl, setPropuestaUrl] = useState("");
  const [generando, setGenerando] = useState(false);
  const [genError, setGenError] = useState("");

  const grandes = PIEZAS.filter((p) => !p.micro);
  const micros = PIEZAS.filter((p) => p.micro);

  const calc = useMemo(() => {
    const { setupUsd, monthlyUsd } = calcularPiezas(piezas);
    const iva = conIva ? 1 + pricing.ivaPct / 100 : 1;
    const horas = procs.reduce((s, k) => s + (procesos.find((p) => p.key === k)?.horasSemana ?? 0), 0);
    return {
      setup: setupUsd * iva,
      mensual: monthlyUsd * iva,
      setupArs: setupUsd * iva * pricing.dolarArs,
      mensualArs: monthlyUsd * iva * pricing.dolarArs,
      horas,
      valorUsdMes: valorHorasUsdMes(horas),
    };
  }, [piezas, procs, conIva, pricing, procesos]);

  const espejoData = ESPEJOS.find((e) => e.key === espejo) ?? ESPEJOS[0];

  function elegirEspejo(key: string) {
    setEspejo(key);
    const e = ESPEJOS.find((x) => x.key === key);
    if (e) setPiezas(e.piezas);
  }

  const toggle = (list: string[], set: (v: string[]) => void, key: string) =>
    set(list.includes(key) ? list.filter((x) => x !== key) : [...list, key]);

  const texto = useMemo(() => {
    const l: string[] = [];
    l.push(`Presupuesto Cauce${negocio ? ` — ${negocio}` : ""}`);
    l.push("");
    l.push(`⏱ Un negocio como el tuyo pierde ~${calc.horas} hs/semana en tareas que Cauce hace solo.`);
    l.push(`A valor de un empleado (USD ${VALOR_EMPLEADO_USD_MES}/mes), eso es ~${fmtArs(calc.valorUsdMes * pricing.dolarArs)} por mes.`);
    l.push("");
    l.push(`🪞 Así quedó ${espejoData.nombre} (${espejoData.rubro}): ${fmtUsd(espejoData.setupUsd)} + ${fmtUsd(espejoData.monthlyUsd)}/mes.`);
    l.push("");
    l.push(`Tu sistema, pieza por pieza:`);
    l.push(`• ${PIEZA_BASE.label}: ${fmtUsd(PIEZA_BASE.setupUsd)} + ${fmtUsd(PIEZA_BASE.monthlyUsd)}/mes`);
    for (const k of piezas) {
      const p = PIEZAS.find((x) => x.key === k);
      if (p) l.push(`• ${p.label}: +${fmtUsd(p.setupUsd)} (+${fmtUsd(p.monthlyUsd)}/mes)`);
    }
    l.push("");
    l.push(`TOTAL: ${fmtUsd(calc.setup)} de creación + ${fmtUsd(calc.mensual)}/mes${conIva ? " (IVA incluido)" : " + IVA"}.`);
    l.push(`En pesos hoy: ${fmtArs(calc.setupArs)} + ${fmtArs(calc.mensualArs)}/mes.`);
    l.push("");
    l.push(`El sistema te devuelve ~${fmtArs(calc.valorUsdMes * pricing.dolarArs)}/mes en horas: se paga solo.`);
    return l.join("\n");
  }, [negocio, calc, piezas, conIva, pricing, espejoData]);

  async function copiar() {
    await navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  async function generarPropuesta() {
    setGenerando(true);
    setGenError("");
    try {
      const res = await fetch("/api/admin/propuestas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          negocio: negocio.trim() || "Tu negocio",
          contactoNombre: contacto.trim(),
          whatsapp: whatsapp.trim(),
          pack: "SCALE",
          setupUsd: calcularPiezas(piezas).setupUsd,
          monthlyUsd: calcularPiezas(piezas).monthlyUsd,
          dolarArs: pricing.dolarArs,
          conIva,
          ivaPct: pricing.ivaPct,
          modulos: piezas.filter((k) => PIEZAS.find((p) => p.key === k && !p.micro)),
          procesoKeys: procs,
          piezas,
          horasSemana: calc.horas,
          casoEspejo: espejo,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "No se pudo generar");
      const url = `${window.location.origin}${data.url}`;
      setPropuestaUrl(url);
      await navigator.clipboard.writeText(url).catch(() => undefined);
    } catch (e) {
      setGenError(e instanceof Error ? e.message : "Error de conexión");
    } finally {
      setGenerando(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      {/* Columna izquierda: armar */}
      <div className="space-y-5">
        <Card className="p-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Negocio">
              <Input value={negocio} onChange={(e) => setNegocio(e.target.value)} placeholder="Bicicletería Ruta 3" />
            </Field>
            <Field label="Contacto">
              <Input value={contacto} onChange={(e) => setContacto(e.target.value)} placeholder="Nombre" />
            </Field>
            <Field label="WhatsApp">
              <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="291..." />
            </Field>
          </div>
        </Card>

        {/* 1 · Espejo */}
        <Card className="p-5">
          <h2 className="mb-1 font-semibold">1 · ¿A cuál se parece?</h2>
          <p className="mb-3 text-sm text-muted-foreground">
            Elegir el caso precarga las piezas y le da el ancla de precio.
          </p>
          <div className="grid gap-2 sm:grid-cols-3">
            {ESPEJOS.map((e) => (
              <button
                key={e.key}
                onClick={() => elegirEspejo(e.key)}
                className={`rounded-md border p-3 text-left transition-colors ${
                  espejo === e.key ? "border-primary bg-primary-soft" : "hover:bg-muted"
                }`}
              >
                <p className="font-semibold">{e.nombre}</p>
                <p className="text-xs text-muted-foreground">{e.rubro}</p>
                <p className="mt-1 text-xs font-medium">
                  {fmtUsd(e.setupUsd)} + {fmtUsd(e.monthlyUsd)}/mes
                </p>
              </button>
            ))}
          </div>
        </Card>

        {/* 2 · Piezas */}
        <Card className="p-5">
          <h2 className="mb-1 font-semibold">2 · Las piezas</h2>
          <p className="mb-3 text-sm text-muted-foreground">
            La base va siempre: {PIEZA_BASE.queIncluye.split(",")[0].toLowerCase()} —{" "}
            <span className="font-medium text-foreground">
              {fmtUsd(PIEZA_BASE.setupUsd)} + {fmtUsd(PIEZA_BASE.monthlyUsd)}/mes
            </span>
            .
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {grandes.map((p) => {
              const on = piezas.includes(p.key);
              return (
                <button
                  key={p.key}
                  onClick={() => toggle(piezas, setPiezas, p.key)}
                  className={`rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                    on ? "border-primary bg-primary-soft" : "hover:bg-muted"
                  }`}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="font-medium">{p.label}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      +{fmtUsd(p.setupUsd)} · {fmtUsd(p.monthlyUsd)}/mes
                    </span>
                  </span>
                  <span className="block text-xs text-muted-foreground">{p.queIncluye}</span>
                </button>
              );
            })}
          </div>
          <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Ajuste fino
          </p>
          <div className="flex flex-wrap gap-1.5">
            {micros.map((p) => {
              const on = piezas.includes(p.key);
              return (
                <button
                  key={p.key}
                  onClick={() => toggle(piezas, setPiezas, p.key)}
                  title={p.queIncluye}
                  className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                    on ? "border-primary bg-primary-soft" : "hover:bg-muted"
                  }`}
                >
                  {p.label} +{p.setupUsd}
                </button>
              );
            })}
          </div>
        </Card>

        {/* 3 · Procesos (alimentan la capa de resultado) */}
        <Card className="p-5">
          <h2 className="mb-1 font-semibold">3 · Lo que corre solo</h2>
          <p className="mb-3 text-sm text-muted-foreground">
            Cada proceso suma horas recuperadas al argumento de venta.
          </p>
          <div className="space-y-1.5">
            {procesos.map((pr) => {
              const on = procs.includes(pr.key);
              return (
                <button
                  key={pr.key}
                  onClick={() => toggle(procs, setProcs, pr.key)}
                  className={`flex w-full items-center justify-between gap-2 rounded-md border px-3 py-1.5 text-left text-sm transition-colors ${
                    on ? "border-primary bg-primary-soft" : "hover:bg-muted"
                  }`}
                >
                  <span className="font-medium">{pr.nombre}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">~{pr.horasSemana} hs/sem</span>
                </button>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Columna derecha: el argumento + el número */}
      <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
        <Card className="border-primary/40 bg-primary-soft/40 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">El argumento</p>
          <p className="mt-1 text-2xl font-bold">~{calc.horas} hs/semana</p>
          <p className="text-sm text-muted-foreground">
            recuperadas ≈{" "}
            <span className="font-semibold text-foreground">{fmtArs(calc.valorUsdMes * pricing.dolarArs)}/mes</span>{" "}
            a valor de empleado (USD {VALOR_EMPLEADO_USD_MES}/mes).
          </p>
        </Card>

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
          <dl className="mt-3 space-y-2">
            <div className="flex items-baseline justify-between">
              <dt className="text-sm text-muted-foreground">Creación (único)</dt>
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
          <p className="mt-2 text-xs text-muted-foreground">
            Espejo: {espejoData.nombre} ({fmtUsd(espejoData.setupUsd)} + {fmtUsd(espejoData.monthlyUsd)}/mes) · Dólar $
            {pricing.dolarArs.toLocaleString("es-AR")}
          </p>
        </Card>

        <Card className="p-5">
          <h2 className="mb-1 font-semibold">Propuesta enviable</h2>
          <p className="mb-3 text-sm text-muted-foreground">
            El link con las 3 capas y el botón de aceptar.
          </p>
          <Button size="sm" onClick={() => void generarPropuesta()} disabled={generando}>
            {generando ? "Generando…" : "🔗 Generar link de propuesta"}
          </Button>
          {propuestaUrl ? (
            <p className="mt-2 break-all rounded-md bg-muted/50 px-3 py-2 text-xs">
              Copiado ✓ —{" "}
              <a href={propuestaUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
                {propuestaUrl}
              </a>
            </p>
          ) : null}
          {genError ? <p className="mt-2 text-xs text-destructive">{genError}</p> : null}
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
