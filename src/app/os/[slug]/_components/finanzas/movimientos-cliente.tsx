"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, ErrorState, Input, Label, Select } from "@/components/ui";
import { InlineEdit } from "../inline-edit";
import { Modal } from "./modal";
import { fmtMoneda } from "../money";
import { argDateStr, fmtDateShort } from "../../_lib/dates";
import {
  MESES_ES,
  argMonthIdx,
  resultadoDe,
  type CuentaFin,
  type MovFin,
} from "../../_lib/finanzas";

type Categorias = { ingreso: string[]; gasto: string[] };

const catsDe = (cats: Categorias, kind: string) =>
  kind === "venta" ? cats.ingreso : cats.gasto;

/**
 * Libro diario: filtros por mes/tipo/cuenta + buscador, totales del filtro y
 * tabla con todas las celdas editables inline estilo planilla (menos las patas
 * de transferencia, que se borran y recargan).
 */
export function MovimientosCliente({
  slug,
  cuentas,
  movimientos,
  anio,
  categorias,
  storageReady,
}: {
  slug: string;
  cuentas: CuentaFin[];
  movimientos: MovFin[];
  anio: number;
  categorias: Categorias;
  storageReady: boolean;
}) {
  const router = useRouter();

  // Filtros (client-side sobre el año cargado)
  const [mes, setMes] = useState<number>(argMonthIdx(new Date()));
  const [cuentaFiltro, setCuentaFiltro] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("");
  const [q, setQ] = useState("");

  // Diálogos
  const [movDialog, setMovDialog] = useState(false);
  const [transferDialog, setTransferDialog] = useState(false);
  const [editando, setEditando] = useState<MovFin | null>(null);
  const [editandoTransf, setEditandoTransf] = useState<MovFin | null>(null);

  const cuentaDe = (id: string | null) => cuentas.find((c) => c.id === id);
  const excluidas = useMemo(
    () => new Set(cuentas.filter((c) => c.excluirDeResultado).map((c) => c.id)),
    [cuentas]
  );

  const filtrados = useMemo(() => {
    return movimientos.filter((m) => {
      if (mes >= 0 && argMonthIdx(m.date) !== mes) return false;
      if (cuentaFiltro && m.accountId !== cuentaFiltro && m.toAccountId !== cuentaFiltro)
        return false;
      if (tipoFiltro) {
        if (tipoFiltro === "venta" && m.kind !== "venta" && m.kind !== "ajuste") return false;
        if (tipoFiltro === "gasto" && m.kind !== "gasto") return false;
        if (tipoFiltro === "transferencia" && m.kind !== "transferencia") return false;
      }
      if (q) {
        const cuenta = cuentaDe(m.accountId)?.name ?? "";
        const t = `${m.concept} ${m.categoria ?? ""} ${cuenta}`.toLowerCase();
        if (!t.includes(q.toLowerCase())) return false;
      }
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movimientos, mes, cuentaFiltro, tipoFiltro, q, cuentas]);

  const totales = useMemo(() => {
    let ing = 0,
      gas = 0;
    for (const m of filtrados) {
      if (m.moneda !== "ARS") continue;
      if (m.accountId && excluidas.has(m.accountId)) continue;
      const r = resultadoDe(m);
      if (!r) continue;
      if (r.tipo === "INGRESO") ing += r.monto;
      else gas += r.monto;
    }
    return { ing, gas, res: ing - gas };
  }, [filtrados, excluidas]);

  async function borrar(m: MovFin) {
    const msg = m.transferenciaId
      ? "¿Borrar esta transferencia? Se eliminan las dos patas."
      : "¿Borrar este movimiento?";
    if (!confirm(msg)) return;
    const res = await fetch(`/api/os/${slug}/cash/${m.id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
  }

  const endpoint = (m: MovFin) => `/api/os/${slug}/cash/${m.id}`;
  const cuentasActivas = cuentas.filter((c) => c.active);

  return (
    <div className="space-y-5">
      {/* Acciones */}
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={() => { setEditando(null); setMovDialog(true); }}>
          + Nuevo movimiento
        </Button>
        <Button size="sm" variant="secondary" onClick={() => setTransferDialog(true)}>
          ⇄ Transferencia entre cuentas
        </Button>
        <Button size="sm" variant="secondary" disabled title="Próximamente">
          ⬆ Importar de banco (IA)
        </Button>
        <div className="ml-auto">
          <Select
            className="h-9 w-auto"
            value={anio}
            onChange={(e) => router.push(`/os/${slug}/caja/movimientos?anio=${e.target.value}`)}
          >
            {[anio - 1, anio, anio + 1].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2">
        <Select className="h-9 w-auto" value={mes} onChange={(e) => setMes(Number(e.target.value))}>
          <option value={-1}>Todo el año</option>
          {MESES_ES.map((m, i) => (
            <option key={i} value={i}>
              {m}
            </option>
          ))}
        </Select>
        <Select
          className="h-9 w-auto"
          value={tipoFiltro}
          onChange={(e) => setTipoFiltro(e.target.value)}
        >
          <option value="">Todos los tipos</option>
          <option value="venta">Ingresos</option>
          <option value="gasto">Gastos</option>
          <option value="transferencia">Transferencias</option>
        </Select>
        <Select
          className="h-9 w-auto"
          value={cuentaFiltro}
          onChange={(e) => setCuentaFiltro(e.target.value)}
        >
          <option value="">Todas las cuentas</option>
          {cuentas.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <Input
          className="h-9 w-48"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar…"
        />
      </div>

      {/* Totales del filtro */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            ↑ Ingresos
          </p>
          <p className="text-lg font-bold tabular-nums text-success">{fmtMoneda(totales.ing, "ARS")}</p>
        </Card>
        <Card className="p-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            ↓ Gastos
          </p>
          <p className="text-lg font-bold tabular-nums text-destructive">
            {fmtMoneda(totales.gas, "ARS")}
          </p>
        </Card>
        <Card className="p-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Resultado
          </p>
          <p
            className={`text-lg font-bold tabular-nums ${totales.res >= 0 ? "" : "text-destructive"}`}
          >
            {fmtMoneda(totales.res, "ARS")}
          </p>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground">
        Tip: hacé click en cualquier celda (fecha, categoría, descripción, cuenta, monto) para
        editarla, como en una planilla. Enter guarda, Esc cancela.
      </p>

      {/* Tabla */}
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr>
              {["Fecha", "Tipo", "Categoría", "Descripción", "Cuenta", "Monto", ""].map((h, i) => (
                <th
                  key={i}
                  className={`border-b bg-muted px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground ${h === "Monto" ? "text-right" : "text-left"}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-10 text-center text-muted-foreground">
                  No hay movimientos para este filtro.
                </td>
              </tr>
            ) : null}
            {filtrados.map((m) => {
              const esTransf = m.kind === "transferencia";
              const esAjuste = m.kind === "ajuste";
              const cuenta = cuentaDe(m.accountId);
              const cuentaLabel = esTransf && m.toAccountId
                ? `${cuenta?.name ?? "?"} → ${cuentaDe(m.toAccountId)?.name ?? "?"}`
                : cuenta?.name ?? "—";
              return (
                <tr key={m.id} className="border-b last:border-0 hover:bg-muted/50">
                  <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">
                    {esTransf ? (
                      fmtDateShort(new Date(m.date))
                    ) : (
                      <InlineEdit
                        endpoint={endpoint(m)}
                        field="date"
                        type="date"
                        value={argDateStr(new Date(m.date))}
                        display={() => fmtDateShort(new Date(m.date))}
                      />
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={
                        m.kind === "venta"
                          ? "text-xs font-semibold text-success"
                          : m.kind === "gasto"
                            ? "text-xs font-semibold text-destructive"
                            : "text-xs font-semibold text-primary"
                      }
                    >
                      {m.kind === "venta"
                        ? "Ingreso"
                        : m.kind === "gasto"
                          ? "Gasto"
                          : esAjuste
                            ? "Ajuste"
                            : "Transf."}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    {esTransf ? (
                      <span className="text-muted-foreground">{m.categoria ?? "Transferencia"}</span>
                    ) : (
                      <InlineEdit
                        endpoint={endpoint(m)}
                        field="categoria"
                        value={m.categoria}
                        placeholder="Sin categoría"
                        options={[
                          ...(m.categoria && !catsDe(categorias, m.kind === "gasto" ? "gasto" : "venta").includes(m.categoria)
                            ? [{ value: m.categoria, label: m.categoria }]
                            : []),
                          ...catsDe(categorias, m.kind === "gasto" ? "gasto" : "venta").map((c) => ({
                            value: c,
                            label: c,
                          })),
                        ]}
                      />
                    )}
                  </td>
                  <td className="max-w-[280px] px-3 py-2" title={m.concept}>
                    {esTransf ? (
                      <span className="block truncate text-muted-foreground">{m.concept}</span>
                    ) : (
                      <InlineEdit
                        endpoint={endpoint(m)}
                        field="concept"
                        value={m.concept}
                        placeholder="(sin descripción)"
                      />
                    )}
                    {m.attachmentUrl ? (
                      <a
                        href={m.attachmentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="ml-1 text-xs text-primary hover:underline"
                        title="Ver comprobante"
                      >
                        📎
                      </a>
                    ) : null}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">
                    {esTransf ? (
                      cuentaLabel
                    ) : (
                      <InlineEdit
                        endpoint={endpoint(m)}
                        field="accountId"
                        value={m.accountId}
                        options={cuentasActivas.map((c) => ({ value: c.id, label: c.name }))}
                        display={() => cuentaLabel}
                      />
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-right font-medium tabular-nums">
                    {esTransf || esAjuste ? (
                      <span className={m.amountArs < 0 ? "text-destructive" : "text-foreground"}>
                        {esTransf && m.toAccountId ? "" : m.amountArs >= 0 ? "+" : "−"}
                        {fmtMoneda(Math.abs(m.amountArs), m.moneda)}
                      </span>
                    ) : (
                      <InlineEdit
                        endpoint={endpoint(m)}
                        field="amountArs"
                        type="number"
                        alignRight
                        value={m.amountArs}
                        display={(v) => (
                          <span className={m.kind === "venta" ? "text-success" : "text-destructive"}>
                            {m.kind === "gasto" ? "−" : "+"}
                            {fmtMoneda(Math.abs(Number(v)), m.moneda)}
                          </span>
                        )}
                      />
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-end gap-1">
                      {m.transferenciaId ? (
                        <button
                          onClick={() => setEditandoTransf(m)}
                          className="rounded p-1.5 text-muted-foreground hover:bg-muted"
                          title="Editar transferencia"
                        >
                          ✎
                        </button>
                      ) : !esTransf ? (
                        <button
                          onClick={() => {
                            setEditando(m);
                            setMovDialog(true);
                          }}
                          className="rounded p-1.5 text-muted-foreground hover:bg-muted"
                          title="Editar"
                        >
                          ✎
                        </button>
                      ) : null}
                      <button
                        onClick={() => borrar(m)}
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

      <p className="text-xs text-muted-foreground">
        El resultado se calcula solo con la plata que entró y salió de verdad (cash-basis). Las
        transferencias entre cuentas no suman ni restan.
      </p>

      {movDialog ? (
        <MovimientoDialog
          slug={slug}
          cuentas={cuentasActivas}
          categorias={categorias}
          editando={editando}
          storageReady={storageReady}
          onClose={() => setMovDialog(false)}
          onSaved={() => {
            setMovDialog(false);
            router.refresh();
          }}
        />
      ) : null}
      {transferDialog || editandoTransf ? (
        <TransferenciaDialog
          slug={slug}
          cuentas={cuentasActivas}
          movimientos={movimientos}
          editando={editandoTransf}
          onClose={() => {
            setTransferDialog(false);
            setEditandoTransf(null);
          }}
          onSaved={() => {
            setTransferDialog(false);
            setEditandoTransf(null);
            router.refresh();
          }}
        />
      ) : null}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
function MovimientoDialog({
  slug,
  cuentas,
  categorias,
  editando,
  storageReady,
  onClose,
  onSaved,
}: {
  slug: string;
  cuentas: CuentaFin[];
  categorias: Categorias;
  editando: MovFin | null;
  storageReady: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [kind, setKind] = useState<"venta" | "gasto">(
    editando?.kind === "gasto" ? "gasto" : "venta"
  );
  const [fecha, setFecha] = useState(
    editando ? argDateStr(new Date(editando.date)) : argDateStr()
  );
  const [categoria, setCategoria] = useState(editando?.categoria ?? "");
  const [concept, setConcept] = useState(editando?.concept ?? "");
  const [monto, setMonto] = useState(editando ? String(Math.abs(editando.amountArs)) : "");
  const [cuentaId, setCuentaId] = useState(editando?.accountId ?? cuentas[0]?.id ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const cats = catsDe(categorias, kind);

  async function guardar() {
    if (!monto || Number(monto) <= 0) {
      setError("Ingresá un monto válido");
      return;
    }
    if (!cuentaId) {
      setError("Elegí una cuenta");
      return;
    }
    setSaving(true);
    setError("");
    try {
      // Comprobante opcional (Cloudinary) — solo en alta y si hay storage.
      let attachmentUrl: string | undefined;
      const file = fileRef.current?.files?.[0];
      if (file && storageReady) {
        const fd = new FormData();
        fd.append("file", file);
        const up = await fetch(`/api/os/${slug}/cash/upload`, { method: "POST", body: fd });
        const upData = await up.json().catch(() => null);
        if (!up.ok) throw new Error(upData?.error ?? "No se pudo subir el comprobante");
        attachmentUrl = upData.url;
      }

      const body = {
        kind,
        date: fecha,
        categoria: categoria || cats[0],
        concept,
        amountArs: Number(monto),
        accountId: cuentaId,
        ...(attachmentUrl ? { attachmentUrl } : {}),
      };
      const res = editando
        ? await fetch(`/api/os/${slug}/cash/${editando.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          })
        : await fetch(`/api/os/${slug}/cash`, {
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
      title={editando ? "Editar movimiento" : "Nuevo movimiento"}
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
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => {
            setKind("venta");
            setCategoria("");
          }}
          className={`h-10 rounded-md border text-sm font-semibold transition-colors ${
            kind === "venta"
              ? "border-success bg-success/10 text-success"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          Ingreso
        </button>
        <button
          type="button"
          onClick={() => {
            setKind("gasto");
            setCategoria("");
          }}
          className={`h-10 rounded-md border text-sm font-semibold transition-colors ${
            kind === "gasto"
              ? "border-destructive bg-destructive/10 text-destructive"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          Gasto
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Fecha</Label>
          <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </div>
        <div>
          <Label className="text-xs">Monto</Label>
          <Input
            type="number"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            placeholder="0"
          />
        </div>
      </div>
      <div>
        <Label className="text-xs">Categoría</Label>
        <Select value={categoria || cats[0]} onChange={(e) => setCategoria(e.target.value)}>
          {cats.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label className="text-xs">Cuenta / Medio de pago</Label>
        <Select value={cuentaId} onChange={(e) => setCuentaId(e.target.value)}>
          {cuentas.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} {c.currency === "USD" ? "(USD)" : ""}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label className="text-xs">Descripción</Label>
        <Input
          value={concept}
          onChange={(e) => setConcept(e.target.value)}
          placeholder="Ej: venta mostrador, pago de luz…"
        />
      </div>
      {!editando && storageReady ? (
        <div>
          <Label className="text-xs">Comprobante (opcional)</Label>
          <input ref={fileRef} type="file" accept="image/*,application/pdf" className="block w-full text-sm text-muted-foreground" />
        </div>
      ) : null}
      {error ? <ErrorState message={error} /> : null}
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────
function TransferenciaDialog({
  slug,
  cuentas,
  movimientos,
  editando,
  onClose,
  onSaved,
}: {
  slug: string;
  cuentas: CuentaFin[];
  movimientos: MovFin[];
  editando: MovFin | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  // Si estamos editando, buscamos las dos patas de la transferencia.
  const patas = editando
    ? movimientos.filter((m) => m.transferenciaId === editando.transferenciaId)
    : [];
  const pataOrigen = patas.find((m) => m.amountArs < 0);
  const pataDestino = patas.find((m) => m.amountArs > 0);

  const [fecha, setFecha] = useState(
    editando ? argDateStr(new Date(editando.date)) : argDateStr()
  );
  const [origenId, setOrigenId] = useState(pataOrigen?.accountId ?? cuentas[0]?.id ?? "");
  const [destinoId, setDestinoId] = useState(pataDestino?.accountId ?? cuentas[1]?.id ?? "");
  const [montoOrigen, setMontoOrigen] = useState(
    pataOrigen ? String(Math.abs(pataOrigen.amountArs)) : ""
  );
  const [montoDestino, setMontoDestino] = useState(
    pataDestino ? String(Math.abs(pataDestino.amountArs)) : ""
  );
  const [descripcion, setDescripcion] = useState(editando?.concept ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const origen = cuentas.find((c) => c.id === origenId);
  const destino = cuentas.find((c) => c.id === destinoId);
  const distintaMoneda = origen && destino && origen.currency !== destino.currency;

  async function guardar() {
    if (origenId === destinoId) {
      setError("Elegí cuentas distintas");
      return;
    }
    if (!montoOrigen || Number(montoOrigen) <= 0) {
      setError("Ingresá el monto");
      return;
    }
    if (distintaMoneda && (!montoDestino || Number(montoDestino) <= 0)) {
      setError("Cambio de divisa: ingresá también cuánto entra");
      return;
    }
    setSaving(true);
    setError("");
    try {
      // Editar = borrar la transferencia vieja (las dos patas) y recrearla.
      if (editando) {
        await fetch(`/api/os/${slug}/cash/${editando.id}`, { method: "DELETE" });
      }
      const res = await fetch(`/api/os/${slug}/caja/transferencias`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: fecha,
          origenId,
          destinoId,
          montoOrigen: Number(montoOrigen),
          montoDestino: distintaMoneda ? Number(montoDestino) : undefined,
          descripcion,
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
      title={editando ? "Editar transferencia" : "Transferencia entre cuentas"}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button size="sm" onClick={guardar} disabled={saving}>
            {saving ? "Guardando…" : editando ? "Guardar cambios" : "Cargar transferencia"}
          </Button>
        </>
      }
    >
      <div>
        <Label className="text-xs">Fecha</Label>
        <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Desde (sale)</Label>
          <Select value={origenId} onChange={(e) => setOrigenId(e.target.value)}>
            {cuentas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.currency === "USD" ? "(USD)" : ""}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label className="text-xs">Hacia (entra)</Label>
          <Select value={destinoId} onChange={(e) => setDestinoId(e.target.value)}>
            {cuentas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.currency === "USD" ? "(USD)" : ""}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <div className={`grid gap-3 ${distintaMoneda ? "grid-cols-2" : "grid-cols-1"}`}>
        <div>
          <Label className="text-xs">Monto que sale {origen ? `(${origen.currency})` : ""}</Label>
          <Input
            type="number"
            value={montoOrigen}
            onChange={(e) => setMontoOrigen(e.target.value)}
            placeholder="0"
          />
        </div>
        {distintaMoneda ? (
          <div>
            <Label className="text-xs">Monto que entra ({destino?.currency})</Label>
            <Input
              type="number"
              value={montoDestino}
              onChange={(e) => setMontoDestino(e.target.value)}
              placeholder="0"
            />
          </div>
        ) : null}
      </div>
      {distintaMoneda ? (
        <p className="text-[11px] text-warning">
          Cambio de divisa: cargá cuánto sale y cuánto entra (montos distintos).
        </p>
      ) : null}
      <div>
        <Label className="text-xs">Descripción</Label>
        <Input
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder="Opcional"
        />
      </div>
      {error ? <ErrorState message={error} /> : null}
    </Modal>
  );
}
