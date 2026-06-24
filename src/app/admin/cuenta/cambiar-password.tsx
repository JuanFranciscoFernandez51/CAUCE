"use client";

import { useState } from "react";
import { Button, Card, ErrorState, Field, Input, Spinner } from "@/components/ui";

export function CambiarPassword() {
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [repetir, setRepetir] = useState("");
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setOk(false);
    if (nueva.length < 8) return setError("La nueva contraseña debe tener al menos 8 caracteres.");
    if (nueva !== repetir) return setError("Las contraseñas nuevas no coinciden.");
    setBusy(true);
    try {
      const res = await fetch("/api/admin/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actual, nueva }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "No se pudo cambiar la contraseña");
      setOk(true);
      setActual(""); setNueva(""); setRepetir("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de conexión");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="p-5">
      <h2 className="mb-4 font-semibold">Cambiar contraseña</h2>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Contraseña actual">
          <Input type="password" value={actual} onChange={(e) => setActual(e.target.value)} autoComplete="current-password" required />
        </Field>
        <Field label="Nueva contraseña" help="Mínimo 8 caracteres.">
          <Input type="password" value={nueva} onChange={(e) => setNueva(e.target.value)} autoComplete="new-password" required />
        </Field>
        <Field label="Repetir nueva">
          <Input type="password" value={repetir} onChange={(e) => setRepetir(e.target.value)} autoComplete="new-password" required />
        </Field>
        {error ? <ErrorState message={error} /> : null}
        {ok ? <p className="text-sm font-medium text-success">✓ Contraseña actualizada.</p> : null}
        <Button type="submit" disabled={busy}>
          {busy ? <Spinner /> : null} Guardar nueva contraseña
        </Button>
      </form>
    </Card>
  );
}
