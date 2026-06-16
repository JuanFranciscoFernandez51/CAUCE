"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  Field,
  Input,
  Select,
  Spinner,
  Stat,
} from "@/components/ui";
import { fmtArs } from "../money";
import { argDateStr, fmtDateShort, fmtMonthLabel, addMonths } from "../../_lib/dates";
import { MOV_KIND_LABELS, METHOD_LABELS, type AccountLite } from "./types";

type MovDto = {
  id: string;
  kind: string;
  concept: string;
  amountArs: number;
  method: string | null;
  date: string;
  accountId: string | null;
  toAccountId: string | null;
  attachmentUrl: string | null;
};

type Totals = { ingresos: number; egresos: number; balance: number };

export function MonthSection({
  slug,
  month,
  accounts,
  accountFilter,
  movements,
  totals,
  storageReady,
}: {
  slug: string;
  month: string;
  accounts: AccountLite[];
  accountFilter: string;
  movements: MovDto[];
  totals: Totals;
  storageReady: boolean;
}) {
  const router = useRouter();
  const accountName = (id: string | null) => accounts.find((a) => a.id === id)?.name ?? null;

  function go(next: { month?: string; account?: string }) {
    const q = new URLSearchParams({
      tab: "mes",
      month: next.month ?? month,
      account: next.account ?? accountFilter,
    });
    router.push(`/os/${slug}/caja?${q.toString()}`);
  }

  return (
    <div className="space-y-5">
      {/* Selector de mes + filtro de cuenta */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => go({ month: addMonths(month, -1) })}
          className="h-9 rounded-md border bg-card px-3 text-sm font-medium hover:bg-muted"
          aria-label="Mes anterior"
        >
          ‹
        </button>
        <span className="min-w-40 text-center text-sm font-medium capitalize">{fmtMonthLabel(month)}</span>
        <button
          type="button"
          onClick={() => go({ month: addMonths(month, 1) })}
          className="h-9 rounded-md border bg-card px-3 text-sm font-medium hover:bg-muted"
          aria-label="Mes siguiente"
        >
          ›
        </button>
        <div className="ml-auto">
          <Select
            value={accountFilter}
            onChange={(e) => go({ account: e.target.value })}
            aria-label="Filtrar por cuenta"
            className="h-9 sm:w-48"
          >
            <option value="">Todas las cuentas</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat label="Ingresos" value={fmtArs(totals.ingresos)} tone="success" />
        <Stat label="Egresos" value={fmtArs(totals.egresos)} tone="destructive" />
        <Stat
          label="Balance"
          value={fmtArs(totals.balance)}
          tone={totals.balance > 0 ? "success" : totals.balance < 0 ? "destructive" : "default"}
        />
      </div>

      <MovementForm slug={slug} accounts={accounts} storageReady={storageReady} onDone={() => router.refresh()} />

      <section>
        <h2 className="mb-2 font-semibold">Movimientos del mes</h2>
        {movements.length === 0 ? (
          <EmptyState
            icon="🧾"
            title="Sin movimientos este mes"
            detail="Cargá ventas, gastos o transferencias con el formulario de arriba."
          />
        ) : (
          <Card className="divide-y p-0">
            {movements.map((mv) => (
              <MovementRow key={mv.id} slug={slug} mv={mv} accountName={accountName} />
            ))}
          </Card>
        )}
      </section>
    </div>
  );
}

function MovementRow({
  slug,
  mv,
  accountName,
}: {
  slug: string;
  mv: MovDto;
  accountName: (id: string | null) => string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  // Signo y color por tipo.
  const sign = mv.kind === "venta" ? 1 : mv.kind === "gasto" ? -1 : mv.kind === "ajuste" ? Math.sign(mv.amountArs) || 1 : 0;
  const color =
    mv.kind === "venta"
      ? "text-success"
      : mv.kind === "gasto"
        ? "text-destructive"
        : mv.kind === "transferencia"
          ? "text-muted-foreground"
          : mv.amountArs >= 0
            ? "text-success"
            : "text-destructive";

  const accLabel =
    mv.kind === "transferencia"
      ? `${accountName(mv.accountId) ?? "?"} → ${accountName(mv.toAccountId) ?? "?"}`
      : accountName(mv.accountId);

  async function onDelete() {
    if (!confirm(`¿Borrar “${mv.concept}”? Se revierte el saldo de la cuenta.`)) return;
    setBusy(true);
    setError(false);
    try {
      const res = await fetch(`/api/os/${slug}/cash/${mv.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setError(true);
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2.5 sm:px-4">
      <span className="w-20 shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
        {fmtDateShort(new Date(mv.date))}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{mv.concept}</p>
        <p className="text-xs text-muted-foreground">
          {MOV_KIND_LABELS[mv.kind] ?? mv.kind}
          {accLabel ? ` · ${accLabel}` : ""}
          {mv.method && mv.kind !== "transferencia" ? ` · ${METHOD_LABELS[mv.method] ?? mv.method}` : ""}
        </p>
      </div>
      {mv.attachmentUrl ? (
        <a
          href={mv.attachmentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-xs font-medium text-primary underline-offset-2 hover:underline"
        >
          ver comprobante
        </a>
      ) : null}
      <span className={`text-sm font-semibold tabular-nums ${color}`}>
        {mv.kind === "transferencia" ? "" : sign > 0 ? "+" : sign < 0 ? "−" : ""}
        {fmtArs(Math.abs(mv.amountArs))}
      </span>
      <div className="flex items-center gap-1.5">
        {error ? <span className="text-xs text-destructive">Error</span> : null}
        {busy ? (
          <Spinner className="text-muted-foreground" />
        ) : (
          <button
            type="button"
            onClick={onDelete}
            className="h-7 rounded border bg-card px-2 text-xs font-medium text-destructive hover:bg-muted"
          >
            Borrar
          </button>
        )}
      </div>
    </div>
  );
}

function MovementForm({
  slug,
  accounts,
  storageReady,
  onDone,
}: {
  slug: string;
  accounts: AccountLite[];
  storageReady: boolean;
  onDone: () => void;
}) {
  const [kind, setKind] = useState<"venta" | "gasto" | "ajuste" | "transferencia">("venta");
  const [concept, setConcept] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("efectivo");
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [toAccountId, setToAccountId] = useState("");
  const [date, setDate] = useState(argDateStr());
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isTransfer = kind === "transferencia";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const n = Number(amount.replace(",", "."));
    if (!concept.trim()) {
      setError("El concepto es obligatorio");
      return;
    }
    if (!Number.isFinite(n) || (kind === "ajuste" ? n === 0 : n <= 0)) {
      setError(kind === "ajuste" ? "El ajuste debe ser distinto de 0 (puede ser negativo)" : "El monto debe ser mayor a 0");
      return;
    }
    if (isTransfer) {
      if (!accountId || !toAccountId) {
        setError("Elegí cuenta de origen y destino");
        return;
      }
      if (accountId === toAccountId) {
        setError("Origen y destino deben ser distintos");
        return;
      }
    }

    setSaving(true);
    setError("");
    try {
      // 1) Comprobante opcional (si hay storage y archivo).
      let attachmentUrl: string | undefined;
      if (file && storageReady) {
        const fd = new FormData();
        fd.append("file", file);
        const up = await fetch(`/api/os/${slug}/cash/upload`, { method: "POST", body: fd });
        const upData = await up.json().catch(() => null);
        if (!up.ok) throw new Error(upData?.error ?? "No se pudo subir el comprobante");
        attachmentUrl = upData.url;
      }

      // 2) Movimiento.
      const res = await fetch(`/api/os/${slug}/cash`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          concept: concept.trim(),
          amountArs: n,
          method: isTransfer ? undefined : method || undefined,
          accountId: accountId || undefined,
          toAccountId: isTransfer ? toAccountId || undefined : undefined,
          date,
          attachmentUrl,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "No se pudo cargar el movimiento");
      setConcept("");
      setAmount("");
      setFile(null);
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de conexión");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="p-4">
      <h2 className="mb-3 font-semibold">Cargar movimiento</h2>
      {accounts.length === 0 ? (
        <p className="rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground">
          Creá una cuenta en la pestaña Saldos para empezar a cargar movimientos.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Tipo">
            <Select value={kind} onChange={(e) => setKind(e.target.value as typeof kind)}>
              <option value="venta">Venta / Ingreso</option>
              <option value="gasto">Gasto</option>
              <option value="ajuste">Ajuste</option>
              <option value="transferencia">Transferencia</option>
            </Select>
          </Field>
          <Field label="Concepto *">
            <Input
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              placeholder={kind === "gasto" ? "Mercadería, alquiler…" : "Venta mostrador…"}
              required
            />
          </Field>
          <Field label="Monto (ARS) *" help={kind === "ajuste" ? "Puede ser negativo." : undefined}>
            <Input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="15000" inputMode="decimal" required />
          </Field>

          <Field label={isTransfer ? "Desde cuenta *" : "Cuenta"}>
            <Select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
              {!isTransfer ? <option value="">Sin cuenta</option> : null}
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.currency})
                </option>
              ))}
            </Select>
          </Field>

          {isTransfer ? (
            <Field label="Hacia cuenta *">
              <Select value={toAccountId} onChange={(e) => setToAccountId(e.target.value)}>
                <option value="">Elegí destino…</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.currency})
                  </option>
                ))}
              </Select>
            </Field>
          ) : (
            <Field label="Medio">
              <Select value={method} onChange={(e) => setMethod(e.target.value)}>
                <option value="efectivo">Efectivo</option>
                <option value="mp">Mercado Pago</option>
                <option value="transferencia">Transferencia</option>
              </Select>
            </Field>
          )}

          <Field label="Fecha">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>

          <Field
            label="Comprobante"
            help={storageReady ? "Opcional (imagen o PDF)." : "Subí la credencial de Cloudinary para adjuntar comprobantes."}
          >
            <Input
              type="file"
              accept="image/*,application/pdf"
              disabled={!storageReady}
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="file:mr-2 file:rounded file:border-0 file:bg-muted file:px-2 file:py-1 file:text-xs"
            />
          </Field>

          <div className="flex items-end sm:col-span-2 lg:col-span-3">
            <Button type="submit" disabled={saving}>
              {saving ? <Spinner /> : null}
              {saving ? "Cargando…" : "Cargar movimiento"}
            </Button>
          </div>
        </form>
      )}
      {error ? (
        <div className="mt-3">
          <ErrorState message={error} />
        </div>
      ) : null}
    </Card>
  );
}
