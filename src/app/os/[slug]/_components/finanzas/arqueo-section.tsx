"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Card, ErrorState, Field, Input, Spinner } from "@/components/ui";
import { fmtArs } from "../money";

export type SaldoData = {
  moneda: string;
  saldoInicial: number;
  ingresos: number;
  egresos: number;
  contado: number | null;
  diferencia: number | null;
};

export type ArqueoData = {
  fecha: string;
  abierta: boolean;
  cerrada: boolean;
  usuario: string | null;
  saldos: SaldoData[];
};

export type ArqueoHistItem = {
  fecha: string;
  usuario: string | null;
  saldos: SaldoData[];
};

const fmtMoneda = (moneda: string, n: number) =>
  moneda === "USD"
    ? `USD ${n.toLocaleString("es-AR", { maximumFractionDigits: 2 })}`
    : fmtArs(n);

/**
 * Arqueo de caja del día (patrón La Base): abrís con lo que hay en el cajón,
 * el sistema suma el efectivo del día y al cierre contás lo real.
 * La diferencia queda registrada — en verde si da, en rojo si falta.
 */
export function ArqueoSection({
  slug,
  hoy,
  efectivoHoy,
  tieneUsd,
  historial,
}: {
  slug: string;
  hoy: ArqueoData | null;
  efectivoHoy: { ingresos: number; egresos: number };
  tieneUsd: boolean;
  historial: ArqueoHistItem[];
}) {
  const router = useRouter();
  const [inicialArs, setInicialArs] = useState("");
  const [inicialUsd, setInicialUsd] = useState("");
  const [contadoArs, setContadoArs] = useState("");
  const [contadoUsd, setContadoUsd] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function post(body: unknown) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/os/${slug}/caja/arqueo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "No se pudo guardar");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error de conexión");
    } finally {
      setBusy(false);
    }
  }

  function abrir(e: React.FormEvent) {
    e.preventDefault();
    const saldos = [{ moneda: "ARS", saldoInicial: Number(inicialArs) || 0 }];
    if (tieneUsd) saldos.push({ moneda: "USD", saldoInicial: Number(inicialUsd) || 0 });
    void post({ action: "abrir", saldos });
  }

  function cerrar(e: React.FormEvent) {
    e.preventDefault();
    const contados = [{ moneda: "ARS", contado: Number(contadoArs) || 0 }];
    if (hoy?.saldos.some((s) => s.moneda === "USD")) {
      contados.push({ moneda: "USD", contado: Number(contadoUsd) || 0 });
    }
    void post({ action: "cerrar", contados });
  }

  const saldoArs = hoy?.saldos.find((s) => s.moneda === "ARS");
  const esperadoArs =
    saldoArs && hoy && !hoy.cerrada
      ? saldoArs.saldoInicial + efectivoHoy.ingresos - efectivoHoy.egresos
      : null;

  return (
    <div className="space-y-5">
      {/* Estado del día */}
      {!hoy ? (
        <Card className="p-5">
          <h2 className="font-semibold">Abrir la caja de hoy</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Contá lo que hay en el cajón y arrancá el día. Al cierre el sistema te dice
            cuánto debería haber.
          </p>
          <form onSubmit={abrir} className="mt-4 flex flex-wrap items-end gap-3">
            <Field label="Efectivo inicial (ARS)">
              <Input
                type="number"
                min="0"
                step="0.01"
                value={inicialArs}
                onChange={(e) => setInicialArs(e.target.value)}
                required
                className="w-40"
              />
            </Field>
            {tieneUsd ? (
              <Field label="Dólares iniciales (USD)">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={inicialUsd}
                  onChange={(e) => setInicialUsd(e.target.value)}
                  className="w-40"
                />
              </Field>
            ) : null}
            <Button type="submit" disabled={busy}>
              {busy ? <Spinner /> : null} Abrir caja
            </Button>
          </form>
          {error ? <div className="mt-3"><ErrorState message={error} /></div> : null}
        </Card>
      ) : !hoy.cerrada ? (
        <Card className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold">Caja de hoy — abierta</h2>
            <Badge variant="success">En curso</Badge>
          </div>
          <dl className="mt-4 grid gap-3 sm:grid-cols-4">
            <div>
              <dt className="text-xs text-muted-foreground">Inicial</dt>
              <dd className="font-semibold">{fmtArs(saldoArs?.saldoInicial ?? 0)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Entró (efectivo)</dt>
              <dd className="font-semibold text-success">+{fmtArs(efectivoHoy.ingresos)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Salió (efectivo)</dt>
              <dd className="font-semibold text-destructive">−{fmtArs(efectivoHoy.egresos)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Debería haber</dt>
              <dd className="font-bold">{fmtArs(esperadoArs ?? 0)}</dd>
            </div>
          </dl>
          <form onSubmit={cerrar} className="mt-5 flex flex-wrap items-end gap-3 border-t pt-4">
            <Field label="Contado real (ARS)" help="Lo que hay en el cajón ahora.">
              <Input
                type="number"
                min="0"
                step="0.01"
                value={contadoArs}
                onChange={(e) => setContadoArs(e.target.value)}
                required
                className="w-40"
              />
            </Field>
            {hoy.saldos.some((s) => s.moneda === "USD") ? (
              <Field label="Contado real (USD)">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={contadoUsd}
                  onChange={(e) => setContadoUsd(e.target.value)}
                  className="w-40"
                />
              </Field>
            ) : null}
            <Button type="submit" disabled={busy} variant="secondary">
              {busy ? <Spinner /> : null} Cerrar caja
            </Button>
          </form>
          {error ? <div className="mt-3"><ErrorState message={error} /></div> : null}
        </Card>
      ) : (
        <Card className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold">Caja de hoy — cerrada</h2>
            <Badge>Cerrada{hoy.usuario ? ` por ${hoy.usuario}` : ""}</Badge>
          </div>
          <CierreTable saldos={hoy.saldos} />
        </Card>
      )}

      {/* Historial */}
      <Card className="p-5">
        <h2 className="mb-3 font-semibold">Últimos cierres</h2>
        {historial.length === 0 ? (
          <p className="rounded-md border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
            Todavía no hay cierres de caja. El primero aparece acá.
          </p>
        ) : (
          <ul className="divide-y">
            {historial.map((h) => {
              const difTotal = h.saldos.reduce((s, x) => s + (x.diferencia ?? 0), 0);
              const ok = Math.abs(difTotal) < 0.01;
              return (
                <li key={h.fecha} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                  <div>
                    <p className="font-medium">{h.fecha}</p>
                    <p className="text-xs text-muted-foreground">
                      {h.saldos
                        .map((s) => `${s.moneda}: contado ${fmtMoneda(s.moneda, s.contado ?? 0)}`)
                        .join(" · ")}
                    </p>
                  </div>
                  <Badge variant={ok ? "success" : "destructive"}>
                    {ok ? "Cuadró ✓" : `Dif: ${fmtArs(difTotal)}`}
                  </Badge>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}

function CierreTable({ saldos }: { saldos: SaldoData[] }) {
  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
            <th className="py-1.5 pr-3">Moneda</th>
            <th className="py-1.5 pr-3">Inicial</th>
            <th className="py-1.5 pr-3">Entró</th>
            <th className="py-1.5 pr-3">Salió</th>
            <th className="py-1.5 pr-3">Esperado</th>
            <th className="py-1.5 pr-3">Contado</th>
            <th className="py-1.5">Diferencia</th>
          </tr>
        </thead>
        <tbody>
          {saldos.map((s) => {
            const esperado = s.saldoInicial + s.ingresos - s.egresos;
            const dif = s.diferencia ?? 0;
            const ok = Math.abs(dif) < 0.01;
            return (
              <tr key={s.moneda} className="border-t">
                <td className="py-2 pr-3 font-medium">{s.moneda}</td>
                <td className="py-2 pr-3">{fmtMoneda(s.moneda, s.saldoInicial)}</td>
                <td className="py-2 pr-3 text-success">+{fmtMoneda(s.moneda, s.ingresos)}</td>
                <td className="py-2 pr-3 text-destructive">−{fmtMoneda(s.moneda, s.egresos)}</td>
                <td className="py-2 pr-3 font-medium">{fmtMoneda(s.moneda, esperado)}</td>
                <td className="py-2 pr-3">{fmtMoneda(s.moneda, s.contado ?? 0)}</td>
                <td className={`py-2 font-semibold ${ok ? "text-success" : "text-destructive"}`}>
                  {ok ? "✓ Cuadró" : fmtMoneda(s.moneda, dif)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
