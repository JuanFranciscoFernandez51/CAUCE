"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, ErrorState, Input, Label, Select } from "@/components/ui";
import { InlineEdit } from "../inline-edit";
import { Modal } from "./modal";
import { fmtMoneda } from "../money";
import type { CuentaFin, SaldoCuenta } from "../../_lib/finanzas";

type SaldoView = Pick<SaldoCuenta, "saldoInicial" | "movimientoNeto" | "saldoActual"> & {
  id: string;
};

/**
 * Cuentas por moneda con saldo inicial editable inline → el saldo actual se
 * calcula solo (saldo inicial + movimientos, nunca almacenado).
 */
export function CuentasCliente({
  slug,
  cuentas,
  saldos,
}: {
  slug: string;
  cuentas: CuentaFin[];
  saldos: SaldoView[];
}) {
  const router = useRouter();
  const [nueva, setNueva] = useState(false);

  const saldoDe = (id: string) => saldos.find((s) => s.id === id);
  const grupos = [
    { titulo: "Cuentas en pesos (ARS)", lista: cuentas.filter((c) => c.currency === "ARS") },
    { titulo: "Cuentas en dólares (USD)", lista: cuentas.filter((c) => c.currency === "USD") },
  ];

  async function desactivar(c: CuentaFin) {
    if (
      !confirm(
        `¿Eliminar la cuenta "${c.name}"? Si tiene movimientos se desactiva (el historial se mantiene).`
      )
    )
      return;
    const res = await fetch(`/api/os/${slug}/accounts/${c.id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button size="sm" variant="secondary" onClick={() => setNueva(true)}>
          + Agregar cuenta
        </Button>
      </div>

      {grupos.map(
        (grupo) =>
          grupo.lista.length > 0 && (
            <div key={grupo.titulo} className="overflow-hidden rounded-lg border">
              <div className="bg-muted px-4 py-2.5 text-sm font-semibold">{grupo.titulo}</div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-xs text-muted-foreground">
                      <th className="px-4 py-2 text-left font-medium">Cuenta</th>
                      <th className="w-44 px-4 py-2 text-right font-medium">Saldo inicial</th>
                      <th className="px-4 py-2 text-right font-medium">Movimiento neto</th>
                      <th className="px-4 py-2 text-right font-medium">Saldo actual</th>
                      <th className="w-10 px-4 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {grupo.lista.map((c) => {
                      const s = saldoDe(c.id);
                      return (
                        <tr key={c.id} className="border-b last:border-0 hover:bg-muted/50">
                          <td className="px-4 py-2.5">
                            <InlineEdit
                              endpoint={`/api/os/${slug}/accounts/${c.id}`}
                              field="name"
                              value={c.name}
                            />
                            {c.excluirDeResultado ? (
                              <span className="ml-2 text-[10px] text-muted-foreground">
                                (excluida de resultados)
                              </span>
                            ) : null}
                            {!c.active ? (
                              <span className="ml-2 text-[10px] text-warning">(inactiva)</span>
                            ) : null}
                          </td>
                          <td className="px-4 py-2 text-right">
                            <InlineEdit
                              endpoint={`/api/os/${slug}/accounts/${c.id}`}
                              field="saldoInicial"
                              type="number"
                              alignRight
                              value={c.saldoInicial}
                              display={(v) => fmtMoneda(Number(v) || 0, c.currency)}
                            />
                          </td>
                          <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                            {fmtMoneda(s?.movimientoNeto ?? 0, c.currency)}
                          </td>
                          <td
                            className={`px-4 py-2.5 text-right font-semibold tabular-nums ${
                              (s?.saldoActual ?? 0) < 0 ? "text-destructive" : ""
                            }`}
                          >
                            {fmtMoneda(s?.saldoActual ?? 0, c.currency)}
                          </td>
                          <td className="px-4 py-2 text-right">
                            <button
                              onClick={() => desactivar(c)}
                              className="rounded p-1.5 text-destructive hover:bg-destructive/10"
                              title="Eliminar / desactivar"
                            >
                              🗑
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )
      )}

      <p className="text-xs text-muted-foreground">
        El saldo inicial es la plata que había en cada cuenta antes de empezar a cargar
        movimientos. El saldo actual se calcula solo: saldo inicial + movimientos. Hacé click en
        el nombre o el saldo inicial para editarlos.
      </p>

      {nueva ? (
        <NuevaCuentaDialog
          slug={slug}
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

function NuevaCuentaDialog({
  slug,
  onClose,
  onSaved,
}: {
  slug: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [nombre, setNombre] = useState("");
  const [moneda, setMoneda] = useState("ARS");
  const [saldoInicial, setSaldoInicial] = useState("0");
  const [excluir, setExcluir] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function guardar() {
    if (!nombre.trim()) {
      setError("Poné un nombre");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/os/${slug}/accounts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: nombre.trim(),
          currency: moneda,
          kind: moneda === "USD" ? "dolares" : "otro",
          initialBalance: Number(saldoInicial) || 0,
          excluirDeResultado: excluir,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "No se pudo crear");
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error de conexión");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title="Nueva cuenta"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button size="sm" onClick={guardar} disabled={saving}>
            {saving ? "Guardando…" : "Crear"}
          </Button>
        </>
      }
    >
      <div>
        <Label className="text-xs">Nombre</Label>
        <Input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej: Banco Galicia"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Moneda</Label>
          <Select value={moneda} onChange={(e) => setMoneda(e.target.value)}>
            <option value="ARS">Pesos (ARS)</option>
            <option value="USD">Dólares (USD)</option>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Saldo inicial</Label>
          <Input
            type="number"
            value={saldoInicial}
            onChange={(e) => setSaldoInicial(e.target.value)}
          />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <input
          type="checkbox"
          checked={excluir}
          onChange={(e) => setExcluir(e.target.checked)}
        />
        Excluir de ingresos/gastos (plata que no es del negocio)
      </label>
      {error ? <ErrorState message={error} /> : null}
    </Modal>
  );
}
