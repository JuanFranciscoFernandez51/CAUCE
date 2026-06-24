"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, ErrorState, Input, Spinner } from "@/components/ui";

type Propuesta = {
  titulo: string;
  detalle: string;
  // La acción es opaca para el front: la reenvía tal cual a /aplicar, que la revalida.
  accion: unknown;
};

type Msg = {
  id: string;
  role: "user" | "assistant";
  text: string;
  propuesta?: Propuesta;
  // estado de una propuesta una vez resuelta
  resuelta?: "aplicada" | "cancelada";
};

const SUGERENCIAS_OWNER = [
  "¿Qué tengo pendiente hoy?",
  "Cargá un turno para mañana a las 15",
  "Agregá un producto",
  "Cargá un contacto nuevo",
  "Cambiá mi color principal a azul",
];
const SUGERENCIAS_EQUIPO = [
  "¿Cómo viene el día?",
  "¿Cuántos turnos hay esta semana?",
  "¿Cuántos contactos tenemos en el CRM?",
  "¿Cuáles son los horarios de atención?",
];

function uid() {
  return Math.random().toString(36).slice(2);
}

export function AsistenteChat({
  slug,
  isOwner,
  aiAvailable,
  displayName,
}: {
  slug: string;
  isOwner: boolean;
  aiAvailable: boolean;
  displayName: string;
}) {
  const router = useRouter();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  if (!aiAvailable) {
    return (
      <Card className="p-6">
        <ErrorState message="El asistente no está disponible (falta configurar la IA)." />
      </Card>
    );
  }

  async function send(text: string) {
    const clean = text.trim();
    if (!clean || thinking) return;
    setError("");
    const userMsg: Msg = { id: uid(), role: "user", text: clean };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setThinking(true);
    try {
      const res = await fetch(`/api/os/${slug}/asistente`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next.map((m) => ({ role: m.role, content: m.text })),
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "No pude responder");
      setMessages((m) => [
        ...m,
        {
          id: uid(),
          role: "assistant",
          text: data.reply ?? "—",
          propuesta: data.propuesta ?? undefined,
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de conexión");
    } finally {
      setThinking(false);
    }
  }

  async function aplicar(msgId: string, propuesta: Propuesta) {
    setError("");
    try {
      const res = await fetch(`/api/os/${slug}/asistente/aplicar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(propuesta.accion),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "No se pudo aplicar el cambio");
      setMessages((m) =>
        m.map((x) => (x.id === msgId ? { ...x, resuelta: "aplicada" } : x))
      );
      setMessages((m) => [
        ...m,
        { id: uid(), role: "assistant", text: data.mensaje ?? "Listo, lo apliqué." },
      ]);
      router.refresh(); // que se vea el cambio (marca, horarios) en el resto del panel
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de conexión");
    }
  }

  function cancelar(msgId: string) {
    setMessages((m) => m.map((x) => (x.id === msgId ? { ...x, resuelta: "cancelada" } : x)));
  }

  const sugerencias = isOwner ? SUGERENCIAS_OWNER : SUGERENCIAS_EQUIPO;
  const vacio = messages.length === 0;

  return (
    <Card className="flex h-[70vh] min-h-[480px] flex-col overflow-hidden">
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
        {vacio ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-2xl">
              💬
            </div>
            <div>
              <p className="font-medium">Soy el asistente de {displayName}</p>
              <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                {isOwner
                  ? "Preguntame por tus números o pedime cambios chicos en tu sistema. Antes de aplicar nada, te lo muestro para que confirmes."
                  : "Preguntame lo que quieras saber de tu sistema. Los cambios los hace el dueño."}
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {sugerencias.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border bg-card px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
              <div className="max-w-[85%] space-y-2">
                <div
                  className={
                    m.role === "user"
                      ? "rounded-2xl rounded-br-sm bg-primary px-3.5 py-2 text-sm text-primary-foreground"
                      : "rounded-2xl rounded-bl-sm bg-muted px-3.5 py-2 text-sm text-foreground"
                  }
                >
                  <p className="whitespace-pre-wrap">{m.text}</p>
                </div>

                {m.propuesta ? (
                  <PropuestaCard
                    propuesta={m.propuesta}
                    resuelta={m.resuelta}
                    onAplicar={() => aplicar(m.id, m.propuesta!)}
                    onCancelar={() => cancelar(m.id)}
                  />
                ) : null}
              </div>
            </div>
          ))
        )}

        {thinking ? (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm bg-muted px-3.5 py-2 text-sm text-muted-foreground">
              <Spinner /> Pensando…
            </div>
          </div>
        ) : null}
      </div>

      <div className="border-t p-3 sm:p-4">
        {error ? (
          <div className="mb-2">
            <ErrorState message={error} />
          </div>
        ) : null}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex items-center gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isOwner ? "Preguntá o pedí un cambio…" : "Preguntá algo de tu sistema…"}
            disabled={thinking}
            aria-label="Mensaje para el asistente"
          />
          <Button type="submit" disabled={thinking || !input.trim()} className="shrink-0">
            {thinking ? <Spinner /> : "Enviar"}
          </Button>
        </form>
      </div>
    </Card>
  );
}

function PropuestaCard({
  propuesta,
  resuelta,
  onAplicar,
  onCancelar,
}: {
  propuesta: Propuesta;
  resuelta?: "aplicada" | "cancelada";
  onAplicar: () => void;
  onCancelar: () => void;
}) {
  const [busy, setBusy] = useState(false);

  return (
    <div className="rounded-xl border border-accent/40 bg-accent/5 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Cambio propuesto
      </p>
      <p className="mt-1 font-medium">{propuesta.titulo}</p>
      <p className="mt-0.5 text-sm text-muted-foreground">{propuesta.detalle}</p>

      {resuelta === "aplicada" ? (
        <p className="mt-2 text-sm font-medium text-success">Aplicado ✓</p>
      ) : resuelta === "cancelada" ? (
        <p className="mt-2 text-sm text-muted-foreground">Cancelado</p>
      ) : (
        <div className="mt-3 flex gap-2">
          <Button
            size="sm"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              await onAplicar();
              setBusy(false);
            }}
          >
            {busy ? <Spinner /> : null} Aplicar
          </Button>
          <Button size="sm" variant="ghost" disabled={busy} onClick={onCancelar}>
            Cancelar
          </Button>
        </div>
      )}
    </div>
  );
}
