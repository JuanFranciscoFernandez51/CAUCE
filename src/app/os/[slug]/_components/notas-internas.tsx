"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Textarea } from "@/components/ui";

/**
 * Descripción interna de una entidad (cliente, proveedor): textarea libre que
 * se guarda con PATCH sobre un campo de texto. Es NOTA INTERNA: nunca sale
 * a la web ni al cliente, y así está rotulada.
 */
export function NotasInternas({
  endpoint,
  field = "notes",
  value,
  titulo = "Descripción interna",
  ayuda = "Solo la ve tu equipo: cómo llegó, con quién hablar, qué le importa, condiciones especiales.",
  placeholder = "Ej: lo maneja la agencia, factura a nombre de la SRL, prefiere que lo llamen los martes…",
}: {
  endpoint: string;
  field?: string;
  value: string | null;
  titulo?: string;
  ayuda?: string;
  placeholder?: string;
}) {
  const router = useRouter();
  const [texto, setTexto] = useState(value ?? "");
  const [guardando, setGuardando] = useState(false);
  const [estado, setEstado] = useState<"" | "ok" | "error">("");
  const sucio = texto !== (value ?? "");

  async function guardar() {
    setGuardando(true);
    setEstado("");
    try {
      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: texto.trim() || null }),
      });
      if (!res.ok) throw new Error();
      setEstado("ok");
      router.refresh();
      setTimeout(() => setEstado(""), 1800);
    } catch {
      setEstado("error");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Card className="space-y-2 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-semibold">📝 {titulo}</h2>
          <p className="text-xs text-muted-foreground">{ayuda}</p>
        </div>
        <span className="text-xs text-muted-foreground">
          {estado === "ok" ? "✅ Guardado" : estado === "error" ? "❌ No se pudo guardar" : ""}
        </span>
      </div>
      <Textarea
        rows={4}
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder={placeholder}
      />
      <div className="flex justify-end">
        <Button size="sm" onClick={guardar} disabled={guardando || !sucio}>
          {guardando ? "Guardando…" : "Guardar nota"}
        </Button>
      </div>
    </Card>
  );
}
