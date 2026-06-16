"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Field,
  Input,
  Select,
  Spinner,
} from "@/components/ui";
import { fmtArs, fmtUsd } from "../money";
import { ACCOUNT_KIND_LABELS, type AccountLite } from "./types";

const SUGGESTED: { name: string; kind: string; currency: string }[] = [
  { name: "Efectivo", kind: "efectivo", currency: "ARS" },
  { name: "Mercado Pago", kind: "mp", currency: "ARS" },
  { name: "Banco", kind: "banco", currency: "ARS" },
];

function money(n: number, currency: string) {
  return currency === "USD" ? fmtUsd(n) : fmtArs(n);
}

export function AccountsSection({
  slug,
  accounts,
  arsTotal,
}: {
  slug: string;
  accounts: AccountLite[];
  arsTotal: number;
}) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);

  if (accounts.length === 0) {
    return (
      <div className="space-y-4">
        <EmptyState
          icon="🏦"
          title="Todavía no tenés cuentas"
          detail="Creá tus cuentas o billeteras (Efectivo, Mercado Pago, Banco…). Cada movimiento va a ajustar su saldo automáticamente."
          action={<Button onClick={() => setCreating(true)}>Crear primera cuenta</Button>}
        />
        {creating ? (
          <AccountForm slug={slug} onDone={() => router.refresh()} onCancel={() => setCreating(false)} showSuggested />
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Total en pesos (cuentas activas): <span className="font-semibold text-foreground">{fmtArs(arsTotal)}</span>
        </p>
        {!creating ? (
          <Button size="sm" onClick={() => setCreating(true)}>
            + Nueva cuenta
          </Button>
        ) : null}
      </div>

      {creating ? (
        <AccountForm slug={slug} onDone={() => router.refresh()} onCancel={() => setCreating(false)} />
      ) : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {accounts.map((a) => (
          <AccountCard key={a.id} slug={slug} account={a} />
        ))}
      </div>
    </div>
  );
}

function AccountCard({ slug, account }: { slug: string; account: AccountLite }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function toggleActive() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/os/${slug}/accounts/${account.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !account.active }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "No se pudo actualizar");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de conexión");
    } finally {
      setBusy(false);
    }
  }

  if (editing) {
    return (
      <AccountEditForm
        slug={slug}
        account={account}
        onDone={() => {
          setEditing(false);
          router.refresh();
        }}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <Card className={`p-4 ${account.active ? "" : "opacity-60"}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-medium">{account.name}</p>
          <div className="mt-1 flex items-center gap-1.5">
            <Badge variant="outline">{ACCOUNT_KIND_LABELS[account.kind] ?? account.kind}</Badge>
            <Badge variant={account.currency === "USD" ? "warning" : "default"}>{account.currency}</Badge>
            {!account.active ? <Badge variant="destructive">Inactiva</Badge> : null}
          </div>
        </div>
      </div>
      <p
        className={`mt-3 text-2xl font-semibold tabular-nums ${
          account.balance < 0 ? "text-destructive" : ""
        }`}
      >
        {money(account.balance, account.currency)}
      </p>
      {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
      <div className="mt-3 flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="h-7 rounded border bg-card px-2 text-xs font-medium hover:bg-muted"
        >
          Editar
        </button>
        <button
          type="button"
          onClick={toggleActive}
          disabled={busy}
          className="h-7 rounded border bg-card px-2 text-xs font-medium hover:bg-muted disabled:opacity-50"
        >
          {busy ? <Spinner /> : account.active ? "Desactivar" : "Reactivar"}
        </button>
      </div>
    </Card>
  );
}

function AccountForm({
  slug,
  onDone,
  onCancel,
  showSuggested,
}: {
  slug: string;
  onDone: () => void;
  onCancel: () => void;
  showSuggested?: boolean;
}) {
  const [name, setName] = useState("");
  const [kind, setKind] = useState("efectivo");
  const [currency, setCurrency] = useState("ARS");
  const [initial, setInitial] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function create(payload: { name: string; kind: string; currency: string; initialBalance: number }) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/os/${slug}/accounts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "No se pudo crear la cuenta");
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de conexión");
      setBusy(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("El nombre es obligatorio");
      return;
    }
    const n = Number(initial.replace(",", "."));
    await create({
      name: name.trim(),
      kind,
      currency,
      initialBalance: Number.isFinite(n) ? n : 0,
    });
  }

  return (
    <Card className="p-4">
      {showSuggested ? (
        <div className="mb-4">
          <p className="mb-2 text-xs font-medium text-muted-foreground">Sugeridas (clic para crear):</p>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTED.map((s) => (
              <button
                key={s.name}
                type="button"
                disabled={busy}
                onClick={() => create({ ...s, initialBalance: 0 })}
                className="rounded-full border bg-card px-3 py-1 text-xs font-medium hover:bg-muted disabled:opacity-50"
              >
                + {s.name}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
        <Field label="Nombre *">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Banco Galicia…" required />
        </Field>
        <Field label="Tipo">
          <Select value={kind} onChange={(e) => setKind(e.target.value)}>
            {Object.entries(ACCOUNT_KIND_LABELS).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Moneda">
          <Select value={currency} onChange={(e) => setCurrency(e.target.value)}>
            <option value="ARS">Pesos (ARS)</option>
            <option value="USD">Dólares (USD)</option>
          </Select>
        </Field>
        <Field label="Saldo inicial" help="Opcional. Lo que hay hoy en la cuenta.">
          <Input value={initial} onChange={(e) => setInitial(e.target.value)} placeholder="0" inputMode="decimal" />
        </Field>
        <div className="flex items-center gap-2 sm:col-span-2">
          <Button type="submit" disabled={busy}>
            {busy ? <Spinner /> : null}
            {busy ? "Creando…" : "Crear cuenta"}
          </Button>
          <Button type="button" variant="secondary" onClick={onCancel} disabled={busy}>
            Cancelar
          </Button>
        </div>
      </form>
      {error ? (
        <div className="mt-3">
          <ErrorState message={error} />
        </div>
      ) : null}
    </Card>
  );
}

function AccountEditForm({
  slug,
  account,
  onDone,
  onCancel,
}: {
  slug: string;
  account: AccountLite;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(account.name);
  const [kind, setKind] = useState(account.kind);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("El nombre es obligatorio");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/os/${slug}/accounts/${account.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), kind }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "No se pudo guardar");
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de conexión");
      setBusy(false);
    }
  }

  return (
    <Card className="p-4">
      <form onSubmit={onSubmit} className="grid gap-3">
        <Field label="Nombre *">
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </Field>
        <Field label="Tipo">
          <Select value={kind} onChange={(e) => setKind(e.target.value)}>
            {Object.entries(ACCOUNT_KIND_LABELS).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
        <p className="text-xs text-muted-foreground">
          La moneda y el saldo no se editan acá: el saldo lo manejan los movimientos.
        </p>
        <div className="flex items-center gap-2">
          <Button type="submit" size="sm" disabled={busy}>
            {busy ? <Spinner /> : null}
            {busy ? "Guardando…" : "Guardar"}
          </Button>
          <Button type="button" size="sm" variant="secondary" onClick={onCancel} disabled={busy}>
            Cancelar
          </Button>
        </div>
      </form>
      {error ? (
        <div className="mt-3">
          <ErrorState message={error} />
        </div>
      ) : null}
    </Card>
  );
}
