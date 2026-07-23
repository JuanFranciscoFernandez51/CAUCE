"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, ErrorState, Input, Label, Select } from "@/components/ui";
import { Modal } from "./modal";
import { fmtMoneda } from "../money";
import { fmtDateShort } from "../../_lib/dates";
import { TIPOS_POR_COBRAR, TIPOS_POR_PAGAR, type CuentaFin } from "../../_lib/finanzas";
import type { ChequeView, CobroView } from "./types";

const DORADO = "#CE9F33";

/**
 * Cartera: cuentas a cobrar, cuentas a pagar y cheques. Al marcar algo como
 * cobrado/pagado se ofrece registrar el movimiento de caja (cierre del círculo).
 */
export function CarteraCliente({
  slug,
  cobros,
  pagos,
  cheques,
  cuentas,
  totalCobrar,
  totalPagar,
}: {
  slug: string;
  cobros: CobroView[];
  pagos: CobroView[];
  cheques: ChequeView[];
  cuentas: CuentaFin[];
  totalCobrar: number;
  totalPagar: number;
}) {
  const [tab, setTab] = useState<"cobrar" | "pagar" | "cheques">("cobrar");
  const neto = totalCobrar - totalPagar;

  const TABS = [
    { id: "cobrar" as const, label: "Cuentas a cobrar" },
    { id: "pagar" as const, label: "Cuentas a pagar" },
    { id: "cheques" as const, label: "Cheques" },
  ];

  return (
    <div className="space-y-6">
      {/* Resumen */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Total a cobrar
          </p>
          <p className="text-2xl font-bold tabular-nums" style={{ color: DORADO }}>
            {fmtMoneda(totalCobrar, "ARS")}
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">Cuentas + cheques a cobrar (ARS)</p>
        </Card>
        <Card className="p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Total a pagar
          </p>
          <p className="text-2xl font-bold tabular-nums text-destructive">
            {fmtMoneda(totalPagar, "ARS")}
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">Cuentas + cheques a pagar (ARS)</p>
        </Card>
        <Card className="p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Posición neta
          </p>
          <p
            className={`text-2xl font-bold tabular-nums ${neto >= 0 ? "text-success" : "text-destructive"}`}
          >
            {fmtMoneda(neto, "ARS")}
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {neto >= 0 ? "Te queda a favor" : "Te queda en contra"}
          </p>
        </Card>
      </div>

      {/* Sub-pestañas */}
      <div className="flex flex-wrap gap-1.5 border-b pb-3">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
              tab === t.id
                ? "bg-primary-soft text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "cobrar" ? (
        <CuentasSentido slug={slug} registros={cobros} sentido="COBRAR" cuentas={cuentas} />
      ) : null}
      {tab === "pagar" ? (
        <CuentasSentido slug={slug} registros={pagos} sentido="PAGAR" cuentas={cuentas} />
      ) : null}
      {tab === "cheques" ? <Cheques slug={slug} cheques={cheques} cuentas={cuentas} /> : null}

      <p className="text-xs text-muted-foreground">
        La cartera es informativa: no toca el resultado hasta que marcás algo como cobrado o
        pagado y registrás el movimiento. Ahí se cierra el círculo con la caja.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
function CuentasSentido({
  slug,
  registros,
  sentido,
  cuentas,
}: {
  slug: string;
  registros: CobroView[];
  sentido: "COBRAR" | "PAGAR";
  cuentas: CuentaFin[];
}) {
  const router = useRouter();
  const [nuevo, setNuevo] = useState(false);
  const [editar, setEditar] = useState<CobroView | null>(null);
  const [concretando, setConcretando] = useState<CobroView | null>(null);

  const esPagar = sentido === "PAGAR";
  const tipos = esPagar ? TIPOS_POR_PAGAR : TIPOS_POR_COBRAR;
  const verbo = esPagar ? "pagar" : "cobrar";

  const pendientes = registros.filter((c) => c.estado === "PENDIENTE");
  const concretadas = registros.filter((c) => c.estado === "COBRADO");

  const totales = useMemo(() => {
    const ars = pendientes.filter((c) => c.moneda === "ARS").reduce((a, c) => a + c.monto, 0);
    const usd = pendientes.filter((c) => c.moneda === "USD").reduce((a, c) => a + c.monto, 0);
    return { ars, usd };
  }, [pendientes]);

  async function patch(id: string, body: Record<string, unknown>) {
    const res = await fetch(`/api/os/${slug}/caja/cartera/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) router.refresh();
  }

  async function borrar(id: string) {
    if (!confirm("¿Borrar este registro?")) return;
    const res = await fetch(`/api/os/${slug}/caja/cartera/${id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-muted-foreground">
          Pendiente:{" "}
          <strong className="tabular-nums" style={{ color: esPagar ? "var(--destructive)" : DORADO }}>
            {fmtMoneda(totales.ars, "ARS")}
          </strong>
          {totales.usd > 0 ? (
            <>
              {" "}
              + <strong className="tabular-nums">{fmtMoneda(totales.usd, "USD")}</strong>
            </>
          ) : null}{" "}
          en {pendientes.length} {pendientes.length === 1 ? "cuenta" : "cuentas"}
        </span>
        <div className="ml-auto">
          <Button size="sm" onClick={() => setNuevo(true)}>
            + Nueva cuenta a {verbo}
          </Button>
        </div>
      </div>

      <TablaCobros
        titulo="Pendientes"
        registros={pendientes}
        concretadas={false}
        verbo={verbo}
        onConcretar={setConcretando}
        onEdit={setEditar}
        onPendiente={(id) => patch(id, { estado: "PENDIENTE" })}
        onBorrar={borrar}
      />
      {concretadas.length > 0 ? (
        <TablaCobros
          titulo={esPagar ? "Pagadas" : "Cobradas"}
          registros={concretadas}
          concretadas
          verbo={verbo}
          onConcretar={setConcretando}
          onEdit={setEditar}
          onPendiente={(id) => patch(id, { estado: "PENDIENTE" })}
          onBorrar={borrar}
        />
      ) : null}

      {nuevo || editar ? (
        <CobroDialog
          slug={slug}
          cobro={editar}
          sentido={sentido}
          tipos={tipos}
          onClose={() => {
            setNuevo(false);
            setEditar(null);
          }}
          onSaved={() => {
            setNuevo(false);
            setEditar(null);
            router.refresh();
          }}
        />
      ) : null}
      {concretando ? (
        <ConcretarDialog
          cuentas={cuentas}
          verbo={verbo}
          detalle={`${concretando.cliente} — ${fmtMoneda(concretando.monto, concretando.moneda)}`}
          onClose={() => setConcretando(null)}
          onConfirm={async (crearMovimiento, cuentaId) => {
            await patch(concretando.id, {
              estado: "COBRADO",
              crearMovimiento,
              ...(cuentaId ? { cuentaId } : {}),
            });
            setConcretando(null);
          }}
        />
      ) : null}
    </div>
  );
}

function TablaCobros({
  titulo,
  registros,
  concretadas,
  verbo,
  onConcretar,
  onEdit,
  onPendiente,
  onBorrar,
}: {
  titulo: string;
  registros: CobroView[];
  concretadas: boolean;
  verbo: string;
  onConcretar: (c: CobroView) => void;
  onEdit: (c: CobroView) => void;
  onPendiente: (id: string) => void;
  onBorrar: (id: string) => void;
}) {
  const [ahora] = useState(() => Date.now());
  return (
    <div className="overflow-hidden rounded-lg border">
      <div className="bg-muted px-4 py-2.5 text-sm font-semibold">
        {titulo} ({registros.length})
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-xs text-muted-foreground">
              <th className="px-4 py-2 text-left font-medium">Cliente</th>
              <th className="px-4 py-2 text-left font-medium">Tipo</th>
              <th className="px-4 py-2 text-left font-medium">Detalle</th>
              <th className="px-4 py-2 text-right font-medium">Monto</th>
              <th className="px-4 py-2 text-left font-medium">Vencimiento</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {registros.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                  Sin registros.
                </td>
              </tr>
            ) : null}
            {registros.map((c) => {
              const vencido =
                !concretadas && c.fechaVencimiento && new Date(c.fechaVencimiento).getTime() < ahora;
              return (
                <tr key={c.id} className="border-b last:border-0 hover:bg-muted/50">
                  <td className="px-4 py-2.5 font-medium">{c.cliente}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{c.tipo}</td>
                  <td
                    className="max-w-[220px] truncate px-4 py-2.5 text-muted-foreground"
                    title={c.descripcion || ""}
                  >
                    {c.descripcion || "—"}
                  </td>
                  <td className="px-4 py-2.5 text-right font-medium tabular-nums">
                    {fmtMoneda(c.monto, c.moneda)}
                  </td>
                  <td className="px-4 py-2.5">
                    {c.fechaVencimiento ? (
                      <span className={vencido ? "font-medium text-destructive" : "text-muted-foreground"}>
                        {vencido ? "⚠ " : ""}
                        {fmtDateShort(new Date(c.fechaVencimiento))}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/50">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-end gap-1">
                      {concretadas ? (
                        <button
                          onClick={() => onPendiente(c.id)}
                          className="rounded p-1.5 text-muted-foreground hover:bg-muted"
                          title="Volver a pendiente"
                        >
                          ↩
                        </button>
                      ) : (
                        <button
                          onClick={() => onConcretar(c)}
                          className="rounded p-1.5 text-success hover:bg-success/10"
                          title={`Marcar ${verbo === "pagar" ? "pagada" : "cobrada"}`}
                        >
                          ✓
                        </button>
                      )}
                      <button
                        onClick={() => onEdit(c)}
                        className="rounded p-1.5 text-muted-foreground hover:bg-muted"
                        title="Editar"
                      >
                        ✎
                      </button>
                      <button
                        onClick={() => onBorrar(c.id)}
                        className="rounded p-1.5 text-destructive hover:bg-destructive/10"
                        title="Borrar"
                      >
                        🗑
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CobroDialog({
  slug,
  cobro,
  sentido,
  tipos,
  onClose,
  onSaved,
}: {
  slug: string;
  cobro: CobroView | null;
  sentido: "COBRAR" | "PAGAR";
  tipos: readonly string[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const esEdit = !!cobro;
  const verbo = sentido === "PAGAR" ? "pagar" : "cobrar";
  const [cliente, setCliente] = useState(cobro?.cliente ?? "");
  const [tipo, setTipo] = useState(cobro?.tipo ?? tipos[0]);
  const [descripcion, setDescripcion] = useState(cobro?.descripcion ?? "");
  const [monto, setMonto] = useState(cobro ? String(cobro.monto) : "");
  const [moneda, setMoneda] = useState(cobro?.moneda ?? "ARS");
  const [fecha, setFecha] = useState(
    cobro?.fechaVencimiento ? cobro.fechaVencimiento.slice(0, 10) : ""
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function guardar() {
    if (!cliente.trim() || !monto || Number(monto) <= 0) {
      setError("Nombre y monto son obligatorios");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const body = {
        sentido,
        cliente: cliente.trim(),
        tipo,
        descripcion,
        monto: Number(monto),
        moneda,
        fechaVencimiento: fecha || null,
      };
      const res = esEdit
        ? await fetch(`/api/os/${slug}/caja/cartera/${cobro!.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          })
        : await fetch(`/api/os/${slug}/caja/cartera`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "No se pudo guardar");
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error de conexión");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title={esEdit ? `Editar cuenta a ${verbo}` : `Nueva cuenta a ${verbo}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button size="sm" onClick={guardar} disabled={saving}>
            {saving ? "Guardando…" : "Guardar"}
          </Button>
        </>
      }
    >
      <div>
        <Label className="text-xs">{sentido === "PAGAR" ? "A quién le debés" : "Cliente"}</Label>
        <Input
          value={cliente}
          onChange={(e) => setCliente(e.target.value)}
          placeholder="Nombre de la persona o empresa"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Tipo</Label>
          <Select value={tipo} onChange={(e) => setTipo(e.target.value)}>
            {tipos.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label className="text-xs">Vencimiento (opcional)</Label>
          <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Monto</Label>
          <Input type="number" value={monto} onChange={(e) => setMonto(e.target.value)} />
        </div>
        <div>
          <Label className="text-xs">Moneda</Label>
          <Select value={moneda} onChange={(e) => setMoneda(e.target.value)}>
            <option value="ARS">Pesos (ARS)</option>
            <option value="USD">Dólares (USD)</option>
          </Select>
        </div>
      </div>
      <div>
        <Label className="text-xs">Detalle</Label>
        <Input
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder="Ej: saldo de la factura 0003-125"
        />
      </div>
      {error ? <ErrorState message={error} /> : null}
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────
function Cheques({
  slug,
  cheques,
  cuentas,
}: {
  slug: string;
  cheques: ChequeView[];
  cuentas: CuentaFin[];
}) {
  const router = useRouter();
  const [nuevo, setNuevo] = useState(false);
  const [concretando, setConcretando] = useState<ChequeView | null>(null);

  const aCobrar = cheques.filter((c) => c.tipo === "A_COBRAR");
  const aPagar = cheques.filter((c) => c.tipo === "A_PAGAR");

  async function patch(id: string, body: Record<string, unknown>) {
    const res = await fetch(`/api/os/${slug}/caja/cheques/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) router.refresh();
  }
  async function borrar(id: string) {
    if (!confirm("¿Borrar este cheque?")) return;
    const res = await fetch(`/api/os/${slug}/caja/cheques/${id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setNuevo(true)}>
          + Nuevo cheque
        </Button>
      </div>
      <SeccionCheques
        titulo="A cobrar"
        cheques={aCobrar}
        onConcretar={setConcretando}
        onPendiente={(id) => patch(id, { estado: "PENDIENTE" })}
        onBorrar={borrar}
      />
      <SeccionCheques
        titulo="A pagar"
        cheques={aPagar}
        onConcretar={setConcretando}
        onPendiente={(id) => patch(id, { estado: "PENDIENTE" })}
        onBorrar={borrar}
      />
      {nuevo ? (
        <ChequeDialog
          slug={slug}
          onClose={() => setNuevo(false)}
          onSaved={() => {
            setNuevo(false);
            router.refresh();
          }}
        />
      ) : null}
      {concretando ? (
        <ConcretarDialog
          cuentas={cuentas}
          verbo={concretando.tipo === "A_COBRAR" ? "cobrar" : "pagar"}
          detalle={`Cheque ${concretando.beneficiario} — ${fmtMoneda(concretando.monto, concretando.moneda)}`}
          onClose={() => setConcretando(null)}
          onConfirm={async (crearMovimiento, cuentaId) => {
            await patch(concretando.id, {
              estado: "CONCRETADO",
              crearMovimiento,
              ...(cuentaId ? { cuentaId } : {}),
            });
            setConcretando(null);
          }}
        />
      ) : null}
    </div>
  );
}

function SeccionCheques({
  titulo,
  cheques,
  onConcretar,
  onPendiente,
  onBorrar,
}: {
  titulo: string;
  cheques: ChequeView[];
  onConcretar: (c: ChequeView) => void;
  onPendiente: (id: string) => void;
  onBorrar: (id: string) => void;
}) {
  const [ahora] = useState(() => Date.now());
  return (
    <div className="overflow-hidden rounded-lg border">
      <div className="bg-muted px-4 py-2.5 text-sm font-semibold">
        {titulo} ({cheques.length})
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-xs text-muted-foreground">
              <th className="px-4 py-2 text-left font-medium">Beneficiario</th>
              <th className="px-4 py-2 text-right font-medium">Monto</th>
              <th className="px-4 py-2 text-left font-medium">Vencimiento</th>
              <th className="px-4 py-2 text-left font-medium">Formato</th>
              <th className="px-4 py-2 text-left font-medium">Estado</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {cheques.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                  Sin cheques.
                </td>
              </tr>
            ) : null}
            {cheques.map((c) => {
              const vencido =
                c.estado === "PENDIENTE" && new Date(c.fechaVencimiento).getTime() < ahora;
              return (
                <tr key={c.id} className="border-b last:border-0 hover:bg-muted/50">
                  <td className="px-4 py-2.5">{c.beneficiario}</td>
                  <td className="px-4 py-2.5 text-right font-medium tabular-nums">
                    {fmtMoneda(c.monto, c.moneda)}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={vencido ? "font-medium text-destructive" : "text-muted-foreground"}>
                      {vencido ? "⚠ " : ""}
                      {fmtDateShort(new Date(c.fechaVencimiento))}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">{c.formato}</td>
                  <td className="px-4 py-2.5">
                    <span
                      className={
                        c.estado === "CONCRETADO"
                          ? "text-xs font-semibold text-success"
                          : c.estado === "ANULADO"
                            ? "text-xs font-semibold text-muted-foreground line-through"
                            : vencido
                              ? "text-xs font-semibold text-destructive"
                              : "text-xs font-semibold text-warning"
                      }
                    >
                      {c.estado === "CONCRETADO"
                        ? c.tipo === "A_COBRAR"
                          ? "Cobrado"
                          : "Pagado"
                        : c.estado === "ANULADO"
                          ? "Anulado"
                          : vencido
                            ? "Vencido"
                            : "Pendiente"}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-end gap-1">
                      {c.estado === "PENDIENTE" ? (
                        <button
                          onClick={() => onConcretar(c)}
                          className="rounded p-1.5 text-success hover:bg-success/10"
                          title={c.tipo === "A_COBRAR" ? "Marcar cobrado" : "Marcar pagado"}
                        >
                          ✓
                        </button>
                      ) : (
                        <button
                          onClick={() => onPendiente(c.id)}
                          className="rounded p-1.5 text-muted-foreground hover:bg-muted"
                          title="Volver a pendiente"
                        >
                          ↩
                        </button>
                      )}
                      <button
                        onClick={() => onBorrar(c.id)}
                        className="rounded p-1.5 text-destructive hover:bg-destructive/10"
                        title="Borrar"
                      >
                        🗑
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ChequeDialog({
  slug,
  onClose,
  onSaved,
}: {
  slug: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [tipo, setTipo] = useState<"A_COBRAR" | "A_PAGAR">("A_COBRAR");
  const [beneficiario, setBeneficiario] = useState("");
  const [monto, setMonto] = useState("");
  const [moneda, setMoneda] = useState("ARS");
  const [fecha, setFecha] = useState("");
  const [formato, setFormato] = useState("E-Cheq");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function guardar() {
    if (!beneficiario.trim() || !monto || !fecha) {
      setError("Completá beneficiario, monto y vencimiento");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/os/${slug}/caja/cheques`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo,
          beneficiario: beneficiario.trim(),
          monto: Number(monto),
          moneda,
          fechaVencimiento: fecha,
          formato,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "No se pudo cargar");
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error de conexión");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title="Nuevo cheque"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button size="sm" onClick={guardar} disabled={saving}>
            {saving ? "Guardando…" : "Cargar"}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setTipo("A_COBRAR")}
          className={`h-10 rounded-md border text-sm font-semibold transition-colors ${
            tipo === "A_COBRAR"
              ? "border-success bg-success/10 text-success"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          A cobrar
        </button>
        <button
          type="button"
          onClick={() => setTipo("A_PAGAR")}
          className={`h-10 rounded-md border text-sm font-semibold transition-colors ${
            tipo === "A_PAGAR"
              ? "border-destructive bg-destructive/10 text-destructive"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          A pagar
        </button>
      </div>
      <div>
        <Label className="text-xs">Beneficiario</Label>
        <Input
          value={beneficiario}
          onChange={(e) => setBeneficiario(e.target.value)}
          placeholder="Ej: proveedor, cliente…"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Monto</Label>
          <Input type="number" value={monto} onChange={(e) => setMonto(e.target.value)} />
        </div>
        <div>
          <Label className="text-xs">Vencimiento</Label>
          <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Formato</Label>
          <Input value={formato} onChange={(e) => setFormato(e.target.value)} placeholder="E-Cheq" />
        </div>
        <div>
          <Label className="text-xs">Moneda</Label>
          <Select value={moneda} onChange={(e) => setMoneda(e.target.value)}>
            <option value="ARS">Pesos (ARS)</option>
            <option value="USD">Dólares (USD)</option>
          </Select>
        </div>
      </div>
      {error ? <ErrorState message={error} /> : null}
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────
/**
 * Al marcar cobrada/pagada, ofrece registrar el movimiento de caja
 * en una cuenta (cierra el círculo contable).
 */
function ConcretarDialog({
  cuentas,
  verbo,
  detalle,
  onClose,
  onConfirm,
}: {
  cuentas: CuentaFin[];
  verbo: "cobrar" | "pagar";
  detalle?: string;
  onClose: () => void;
  onConfirm: (crearMovimiento: boolean, cuentaId: string | null) => void;
}) {
  const [cuentaId, setCuentaId] = useState(cuentas[0]?.id ?? "");
  const part = verbo === "cobrar" ? "cobrada" : "pagada";
  const accion = verbo === "cobrar" ? "Entró" : "Salió";

  return (
    <Modal
      title={`Marcar como ${part}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={() => onConfirm(false, null)}>
            Solo marcar (sin movimiento)
          </Button>
          <Button size="sm" onClick={() => onConfirm(true, cuentaId)} disabled={!cuentaId}>
            Registrar movimiento y marcar
          </Button>
        </>
      }
    >
      {detalle ? <p className="text-sm text-muted-foreground">{detalle}</p> : null}
      <p className="text-sm text-muted-foreground">
        ¿Registrar el movimiento de caja? {accion} la plata — ¿de qué cuenta?
      </p>
      <div>
        <Label className="text-xs">Cuenta</Label>
        <Select value={cuentaId} onChange={(e) => setCuentaId(e.target.value)}>
          {cuentas.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} {c.currency === "USD" ? "(USD)" : ""}
            </option>
          ))}
        </Select>
      </div>
    </Modal>
  );
}
