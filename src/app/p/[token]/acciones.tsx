"use client";

import { useState } from "react";
import { Button, Card } from "@/components/ui";

/** Aceptar la propuesta o abrir WhatsApp para charlarla. */
export function PropuestaAcciones({ token, estado }: { token: string; estado: string }) {
  const [actual, setActual] = useState(estado);
  const [busy, setBusy] = useState(false);

  async function responder(accion: "aceptar" | "rechazar") {
    setBusy(true);
    try {
      const res = await fetch(`/api/public/propuesta/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok) setActual(data.estado);
    } finally {
      setBusy(false);
    }
  }

  if (actual === "ACEPTADA") {
    return (
      <Card className="border-success/40 bg-success/10 p-6 text-center">
        <p className="text-3xl">🤝</p>
        <h2 className="mt-2 text-lg font-semibold">¡Trato hecho!</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Te escribimos hoy mismo para arrancar. Bienvenido a Cauce.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-5 text-center">
      <p className="mb-4 text-sm text-muted-foreground">
        ¿Arrancamos? Aceptá y hoy mismo nos ponemos en marcha.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button size="lg" onClick={() => void responder("aceptar")} disabled={busy}>
          ✓ Aceptar propuesta
        </Button>
        <a
          href={`https://wa.me/5492915729501?text=${encodeURIComponent("Hola Cauce! Vi la propuesta y quiero charlarla.")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md border bg-card px-5 text-sm font-medium hover:bg-muted"
        >
          💬 Charlarla por WhatsApp
        </a>
      </div>
    </Card>
  );
}
