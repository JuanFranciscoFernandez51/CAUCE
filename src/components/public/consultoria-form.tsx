"use client";

import { useState, type FormEvent } from "react";
import {
  Card,
  Field,
  Input,
  Textarea,
  Select,
  Button,
  Spinner,
  ErrorState,
} from "@/components/ui";

type FormState = {
  name: string;
  business: string;
  rubro: string;
  email: string;
  whatsapp: string;
  mensaje: string;
  preferencia: "manana" | "tarde" | "indistinto";
};

const INITIAL: FormState = {
  name: "",
  business: "",
  rubro: "",
  email: "",
  whatsapp: "",
  mensaje: "",
  preferencia: "indistinto",
};

export function ConsultoriaForm() {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.whatsapp.trim()) {
      setErrorMsg("Completá tu nombre y tu WhatsApp para poder coordinar.");
      setStatus("error");
      return;
    }
    setStatus("sending");
    setErrorMsg("");
    try {
      const res = await fetch("/api/public/consultoria", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.status === 429) {
        throw new Error("Demasiados intentos seguidos. Esperá un minuto y probá de nuevo.");
      }
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? "No pudimos enviar tu pedido. Probá de nuevo.");
      }
      setStatus("ok");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "No pudimos enviar tu pedido. Probá de nuevo.");
      setStatus("error");
    }
  }

  if (status === "ok") {
    return (
      <Card className="p-8 text-center">
        <div aria-hidden className="text-4xl">✅</div>
        <h2 className="mt-3 text-xl font-bold">Listo, pedido recibido</h2>
        <p className="mt-2 text-muted-foreground">
          Te escribimos por WhatsApp para coordinar el día y horario de la
          videollamada. Atento al teléfono.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6 sm:p-8">
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Tu nombre *">
            <Input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Ej: Mariana Pérez"
              required
              autoComplete="name"
            />
          </Field>
          <Field label="Nombre del negocio">
            <Input
              value={form.business}
              onChange={(e) => set("business", e.target.value)}
              placeholder="Ej: Estética Norte"
              autoComplete="organization"
            />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Rubro">
            <Input
              value={form.rubro}
              onChange={(e) => set("rubro", e.target.value)}
              placeholder="Ej: estética, taller, indumentaria…"
            />
          </Field>
          <Field label="Email">
            <Input
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="vos@tunegocio.com"
              autoComplete="email"
            />
          </Field>
        </div>
        <Field label="WhatsApp *" help="Por acá coordinamos la videollamada.">
          <Input
            type="tel"
            value={form.whatsapp}
            onChange={(e) => set("whatsapp", e.target.value)}
            placeholder="Ej: 291 555 0000"
            required
            autoComplete="tel"
          />
        </Field>
        <Field label="Contanos qué te gustaría que funcione solo">
          <Textarea
            value={form.mensaje}
            onChange={(e) => set("mensaje", e.target.value)}
            placeholder="Ej: respondo los mismos mensajes todo el día y se me pasan turnos…"
          />
        </Field>
        <Field label="Preferencia horaria para la llamada">
          <Select
            value={form.preferencia}
            onChange={(e) => set("preferencia", e.target.value as FormState["preferencia"])}
          >
            <option value="manana">Mañana</option>
            <option value="tarde">Tarde</option>
            <option value="indistinto">Indistinto</option>
          </Select>
        </Field>

        {status === "error" && errorMsg ? <ErrorState message={errorMsg} /> : null}

        <Button type="submit" size="lg" className="w-full" disabled={status === "sending"}>
          {status === "sending" ? (
            <>
              <Spinner /> Enviando…
            </>
          ) : (
            "Pedir mi consultoría gratis"
          )}
        </Button>
      </form>
    </Card>
  );
}
