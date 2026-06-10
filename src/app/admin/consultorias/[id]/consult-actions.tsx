"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, ErrorState, Field, Input, Spinner, Textarea } from "@/components/ui";

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  // datetime-local en hora argentina
  const ar = new Date(d.getTime() - 3 * 60 * 60 * 1000);
  return ar.toISOString().slice(0, 16);
}

export function ConsultActions(props: {
  noteId: string;
  leadId: string;
  status: string;
  scheduledAt: string | null;
  callNotes: string;
  hasRoadmap: boolean;
  hasProject: boolean;
}) {
  const router = useRouter();
  const [scheduledAt, setScheduledAt] = useState(toLocalInput(props.scheduledAt));
  const [callNotes, setCallNotes] = useState(props.callNotes);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [acting, setActing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function call(path: string, body?: unknown, method = "POST") {
    const res = await fetch(path, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error ?? "Algo salió mal");
    return data;
  }

  async function save() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await call(
        `/api/admin/consultas/${props.noteId}`,
        {
          callNotes,
          scheduledAt: scheduledAt ? new Date(`${scheduledAt}:00-03:00`).toISOString() : null,
        },
        "PATCH"
      );
      setSaved(true);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  }

  async function generarRoadmap() {
    setGenerating(true);
    setError(null);
    try {
      // primero guardamos las notas para que la IA use lo último
      await call(
        `/api/admin/consultas/${props.noteId}`,
        { callNotes },
        "PATCH"
      );
      await call(`/api/admin/consultas/${props.noteId}/roadmap`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo generar el roadmap");
    } finally {
      setGenerating(false);
    }
  }

  async function marcar(status: string) {
    setActing(status);
    setError(null);
    try {
      await call(`/api/admin/consultas/${props.noteId}`, { status }, "PATCH");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo actualizar");
    } finally {
      setActing(null);
    }
  }

  async function convertir() {
    setActing("proyecto");
    setError(null);
    try {
      await call(`/api/admin/consultas/${props.noteId}/proyecto`);
      router.push("/admin/pipeline");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo crear el proyecto");
      setActing(null);
    }
  }

  return (
    <Card className="space-y-4 p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Fecha y hora de la llamada" help="Hora argentina">
          <Input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
          />
        </Field>
      </div>
      <Field
        label="Notas de la llamada"
        help="Todo lo que contó del negocio: procesos, dolores, herramientas, volumen. De acá sale el roadmap."
      >
        <Textarea
          rows={10}
          value={callNotes}
          onChange={(e) => setCallNotes(e.target.value)}
          placeholder="Ej: Tiene una distribuidora, 3 empleados. Pierde pedidos porque los toma por WhatsApp a mano. Usa Excel para stock…"
        />
      </Field>
      {error ? <ErrorState message={error} /> : null}
      {saved ? <p className="text-sm font-medium text-success">Guardado.</p> : null}
      <div className="flex flex-wrap gap-2">
        <Button onClick={save} disabled={saving} variant="secondary">
          {saving ? <Spinner /> : null} Guardar notas
        </Button>
        <Button onClick={generarRoadmap} disabled={generating || !callNotes.trim()}>
          {generating ? <Spinner /> : null}
          {generating
            ? "La IA está armando el roadmap…"
            : props.hasRoadmap
              ? "Regenerar roadmap"
              : "Generar roadmap"}
        </Button>
        {props.hasRoadmap && props.status !== "ROADMAP_SENT" ? (
          <Button variant="secondary" onClick={() => marcar("ROADMAP_SENT")} disabled={acting !== null}>
            {acting === "ROADMAP_SENT" ? <Spinner /> : null} Marcar como enviado
          </Button>
        ) : null}
        {props.hasRoadmap && !props.hasProject ? (
          <Button variant="accent" onClick={convertir} disabled={acting !== null}>
            {acting === "proyecto" ? <Spinner /> : null} Convertir en proyecto
          </Button>
        ) : null}
        {props.status === "SCHEDULED" ? (
          <Button variant="ghost" onClick={() => marcar("CANCELLED")} disabled={acting !== null}>
            Cancelar consultoría
          </Button>
        ) : null}
      </div>
    </Card>
  );
}
