"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, ErrorState, Spinner, Textarea } from "@/components/ui";

/** Pausar/Reanudar una automatización (solo el dueño ve este botón). */
export function AutomationToggle({
  slug,
  automationId,
  status,
}: {
  slug: string;
  automationId: string;
  status: "ACTIVE" | "PAUSED";
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onToggle() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/os/${slug}/automations/${automationId}/toggle`, {
        method: "POST",
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "No se pudo cambiar el estado");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error de conexión");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant="secondary"
        size="sm"
        onClick={onToggle}
        disabled={busy}
        className={status === "ACTIVE" ? "text-warning" : "text-success"}
      >
        {busy ? <Spinner /> : null}
        {status === "ACTIVE" ? "Pausar" : "Reanudar"}
      </Button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

/** CTA "Pedir un cambio": abre un form chico y crea un lead para que lo vea Cauce. */
export function AutomationChangeRequest({
  slug,
  automationId,
}: {
  slug: string;
  automationId: string;
}) {
  const [open, setOpen] = useState(false);
  const [pedido, setPedido] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pedido.trim().length < 5) {
      setError("Contanos un poco más qué querés cambiar.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/os/${slug}/automations/${automationId}/pedido`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pedido: pedido.trim() }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "No se pudo enviar el pedido");
      setSent(true);
      setPedido("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de conexión");
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <p className="rounded-md bg-success/15 px-3 py-2 text-sm text-success">
        ✓ Pedido enviado — Cauce lo revisa y te contacta.
      </p>
    );
  }

  if (!open) {
    return (
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        ✏️ Pedir un cambio
      </Button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2">
      {error ? <ErrorState message={error} /> : null}
      <Textarea
        value={pedido}
        onChange={(e) => setPedido(e.target.value)}
        placeholder="Ej: quiero que el mensaje de bienvenida mencione el horario de los sábados…"
        maxLength={2000}
        autoFocus
      />
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={busy}>
          {busy ? <Spinner /> : null}
          {busy ? "Enviando…" : "Enviar pedido"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
