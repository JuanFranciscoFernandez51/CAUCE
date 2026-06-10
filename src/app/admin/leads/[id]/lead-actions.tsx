"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, ErrorState, Spinner } from "@/components/ui";

export function DiagnosticoButton({ leadId }: { leadId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/leads/${leadId}/diagnostico`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Falló el diagnóstico");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falló el diagnóstico");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button onClick={run} disabled={loading}>
        {loading ? <Spinner /> : "🤖"}
        {loading ? "La IA está diagnosticando…" : "Correr diagnóstico"}
      </Button>
      {loading ? (
        <p className="text-xs text-muted-foreground">Puede tardar unos 10 segundos.</p>
      ) : null}
      {error ? <ErrorState message={error} /> : null}
    </div>
  );
}

export function BlueprintActions({
  blueprintId,
  status,
}: {
  blueprintId: string;
  status: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<"aprobar" | "rechazar" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function aprobar() {
    setBusy("aprobar");
    setError(null);
    try {
      const res = await fetch(`/api/admin/blueprints/${blueprintId}/aprobar`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo aprobar");
      router.push(`/admin/clientes/${data.clientId}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo aprobar");
      setBusy(null);
    }
  }

  async function rechazar() {
    setBusy("rechazar");
    setError(null);
    try {
      const res = await fetch(`/api/admin/blueprints/${blueprintId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "REJECTED" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo rechazar");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo rechazar");
    } finally {
      setBusy(null);
    }
  }

  if (status !== "DRAFT") return null;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button onClick={aprobar} disabled={busy !== null}>
          {busy === "aprobar" ? <Spinner /> : "✓"}
          {busy === "aprobar" ? "Aprobando…" : "Aprobar blueprint"}
        </Button>
        <Button variant="destructive" onClick={rechazar} disabled={busy !== null}>
          {busy === "rechazar" ? <Spinner /> : null}
          {busy === "rechazar" ? "Rechazando…" : "Rechazar"}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Aprobar convierte el lead en cliente y crea sus automatizaciones en TEST.
      </p>
      {error ? <ErrorState message={error} /> : null}
    </div>
  );
}

export function MarkLostButton({ leadId, status }: { leadId: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status === "LOST" || status === "CONVERTED") return null;

  async function markLost() {
    if (!confirm("¿Marcar este lead como perdido?")) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "LOST" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo actualizar");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo actualizar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button variant="ghost" size="sm" onClick={markLost} disabled={busy} className="text-destructive">
        {busy ? <Spinner /> : null} Marcar como perdido
      </Button>
      {error ? <ErrorState message={error} /> : null}
    </div>
  );
}
