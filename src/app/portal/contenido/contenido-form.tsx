"use client";

import { useState } from "react";
import {
  Button,
  Card,
  ErrorState,
  Field,
  Input,
  Select,
  Spinner,
  Textarea,
} from "@/components/ui";

type Faq = { q: string; a: string };

export function ContenidoForm({
  initial,
}: {
  initial: { horarios: string; datosNegocio: string; tono: string; faqs: Faq[] };
}) {
  const [faqs, setFaqs] = useState<Faq[]>(initial.faqs);
  const [horarios, setHorarios] = useState(initial.horarios);
  const [datosNegocio, setDatosNegocio] = useState(initial.datosNegocio);
  const [tono, setTono] = useState(initial.tono);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function setFaq(i: number, patch: Partial<Faq>) {
    setFaqs((prev) => prev.map((f, idx) => (idx === i ? { ...f, ...patch } : f)));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);

    const cleanFaqs = faqs
      .map((f) => ({ q: f.q.trim(), a: f.a.trim() }))
      .filter((f) => f.q && f.a);
    if (cleanFaqs.length === 0) {
      setError("Cargá al menos una pregunta con su respuesta.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/portal/contenido", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          faqs: cleanFaqs,
          horarios: horarios.trim(),
          datosNegocio: datosNegocio.trim(),
          tono,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "No pudimos guardar. Probá de nuevo.");
        return;
      }
      setFaqs(cleanFaqs);
      setSaved(true);
    } catch {
      setError("Error de conexión. Probá de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* FAQs */}
      <Card className="p-5">
        <h2 className="font-semibold">Preguntas frecuentes</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Lo que te preguntan siempre: precios, envíos, formas de pago, garantía…
        </p>
        <div className="mt-4 space-y-4">
          {faqs.map((f, i) => (
            <div key={i} className="rounded-md border p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Pregunta {i + 1}
                </p>
                {faqs.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => setFaqs((prev) => prev.filter((_, idx) => idx !== i))}
                    className="text-xs font-medium text-destructive hover:underline"
                  >
                    Quitar
                  </button>
                ) : null}
              </div>
              <div className="mt-2 space-y-2">
                <Input
                  value={f.q}
                  onChange={(e) => setFaq(i, { q: e.target.value })}
                  placeholder="Ej: ¿Hacen envíos?"
                  aria-label={`Pregunta ${i + 1}`}
                />
                <Textarea
                  value={f.a}
                  onChange={(e) => setFaq(i, { a: e.target.value })}
                  placeholder="Ej: Sí, enviamos a todo el país por correo. Demora 3 a 5 días hábiles."
                  className="min-h-16"
                  aria-label={`Respuesta ${i + 1}`}
                />
              </div>
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="mt-4"
          onClick={() => setFaqs((prev) => [...prev, { q: "", a: "" }])}
        >
          + Agregar pregunta
        </Button>
      </Card>

      {/* Horarios + datos + tono */}
      <Card className="space-y-4 p-5">
        <Field label="Horarios de atención" help="Ej: Lun a Vie 9-13 y 16-20, Sáb 9-13">
          <Textarea
            value={horarios}
            onChange={(e) => setHorarios(e.target.value)}
            className="min-h-16"
            placeholder="¿Cuándo atendés?"
          />
        </Field>
        <Field
          label="Datos del negocio"
          help="Dirección, formas de pago, redes, lo que el bot tiene que saber para responder bien."
        >
          <Textarea
            value={datosNegocio}
            onChange={(e) => setDatosNegocio(e.target.value)}
            placeholder="Ej: Estamos en Alem 1234, Bahía Blanca. Aceptamos efectivo, transferencia y todas las tarjetas."
          />
        </Field>
        <Field label="Tono del bot" help="Cómo le habla el bot a tus clientes.">
          <Select value={tono} onChange={(e) => setTono(e.target.value)}>
            <option value="amable e informal">Amable e informal</option>
            <option value="profesional">Profesional</option>
            <option value="divertido">Divertido</option>
          </Select>
        </Field>
      </Card>

      {error ? <ErrorState message={error} /> : null}
      {saved ? (
        <p className="rounded-md border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
          Guardado — tu bot ya usa este contenido.
        </p>
      ) : null}

      <Button type="submit" disabled={loading} className="w-full sm:w-auto">
        {loading ? <Spinner /> : null}
        {loading ? "Guardando…" : "Guardar contenido"}
      </Button>
    </form>
  );
}
