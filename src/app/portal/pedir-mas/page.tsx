"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Button,
  Card,
  ErrorState,
  Field,
  Select,
  Spinner,
  Textarea,
} from "@/components/ui";

function PedirMasForm() {
  const params = useSearchParams();
  const isUpgrade = params.get("upgrade") === "pro";

  const [pedido, setPedido] = useState(isUpgrade ? "Quiero pasarme a Pro" : "");
  const [interes, setInteres] = useState(isUpgrade ? "upgrade_pro" : "otro_bot");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/portal/pedir-mas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pedido: pedido.trim(), interes }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "No pudimos enviar tu pedido. Probá de nuevo.");
        return;
      }
      setSent(true);
    } catch {
      setError("Error de conexión. Probá de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <Card className="p-8 text-center">
        <p className="text-3xl">🙌</p>
        <h2 className="mt-2 text-lg font-semibold">Recibido.</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Te contactamos en menos de 24h.
        </p>
        <Button
          variant="secondary"
          className="mt-6"
          onClick={() => {
            setSent(false);
            setPedido("");
            setInteres("otro_bot");
          }}
        >
          Pedir otra cosa
        </Button>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <form onSubmit={onSubmit} className="space-y-4">
        <Field
          label="¿Qué más querés que funcione solo? *"
          help="Contanos en tus palabras: qué tarea te come tiempo, qué te gustaría automatizar."
        >
          <Textarea
            value={pedido}
            onChange={(e) => setPedido(e.target.value)}
            required
            minLength={5}
            placeholder="Ej: que el bot agende turnos solo, que me cargue las ventas en una planilla…"
            className="min-h-32"
          />
        </Field>
        <Field label="¿Qué te interesa?">
          <Select value={interes} onChange={(e) => setInteres(e.target.value)}>
            <option value="otro_bot">Otro bot</option>
            <option value="integracion">Integración con mi sistema</option>
            <option value="cauce_os">Mi propio software (Cauce OS)</option>
            <option value="upgrade_pro">Pasarme al pack Pro</option>
            <option value="asesorame">No sé, asesorame</option>
          </Select>
        </Field>
        {error ? <ErrorState message={error} /> : null}
        <Button type="submit" disabled={loading} className="w-full sm:w-auto">
          {loading ? <Spinner /> : null}
          {loading ? "Enviando…" : "Enviar pedido"}
        </Button>
      </form>
    </Card>
  );
}

export default function PedirMasPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pedir más</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tu bot es el primer paso. Contanos qué más te gustaría que funcione
          solo y te armamos una propuesta.
        </p>
      </div>
      <Suspense fallback={<Spinner />}>
        <PedirMasForm />
      </Suspense>
    </div>
  );
}
