"use client";

import { useState } from "react";
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

// ── Opciones ─────────────────────────────────────────────
const SIZES = [
  { value: "solo", label: "Solo yo" },
  { value: "2-5", label: "2-5 personas" },
  { value: "6-20", label: "6-20 personas" },
  { value: "20+", label: "Más de 20" },
] as const;

const DOLORES = [
  { value: "ATENCION", label: "No doy abasto con los mensajes" },
  { value: "VENTAS_CRM", label: "Presupuestos que se enfrían" },
  { value: "MARKETING", label: "No llego a publicar todos los días" },
  { value: "OPERACIONES", label: "El stock y los pedidos me comen el día" },
  { value: "TURNOS", label: "Turnos y ausencias" },
  { value: "RRHH", label: "Horarios de empleados" },
  { value: "FINANZAS", label: "Cobranzas y facturas" },
  { value: "otro", label: "Otro" },
] as const;

const APPS = [
  "WhatsApp",
  "Instagram",
  "Sheets/Excel",
  "Mercado Pago",
  "Google Calendar",
  "Sistema propio",
  "Ninguna",
] as const;

const FRECUENCIAS = [
  { value: "pocas", label: "Pocas veces" },
  { value: "varias", label: "Varias veces" },
  { value: "todo_el_dia", label: "Todo el día" },
] as const;

const URGENCIAS = [
  { value: "ya_mismo", label: "Ya mismo" },
  { value: "este_mes", label: "Este mes" },
  { value: "explorando", label: "Estoy explorando" },
] as const;

const PRESUPUESTOS = [
  { value: "hasta_50", label: "Hasta 50 USD/mes" },
  { value: "50_300", label: "Entre 50 y 300 USD/mes" },
  { value: "300_1000", label: "Entre 300 y 1.000 USD/mes" },
  { value: "mas_1000", label: "Más de 1.000 USD/mes" },
  { value: "no_se", label: "Todavía no sé" },
] as const;

type Answers = {
  business: string;
  rubro: string;
  size: string;
  web: string;
  instagram: string;
  dolores: string[];
  dolorOtro: string;
  frecuencia: string;
  apps: string[];
  urgencia: string;
  presupuesto: string;
  name: string;
  email: string;
  whatsapp: string;
};

const INITIAL: Answers = {
  business: "",
  rubro: "",
  size: "",
  web: "",
  instagram: "",
  dolores: [],
  dolorOtro: "",
  frecuencia: "",
  apps: [],
  urgencia: "",
  presupuesto: "",
  name: "",
  email: "",
  whatsapp: "",
};

const STEP_TITLES = [
  "Tu negocio",
  "Tu dolor principal",
  "Frecuencia y apps",
  "Urgencia y presupuesto",
  "Tus datos",
];

// ── Chip ─────────────────────────────────────────────────
function Chip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
        selected
          ? "border-primary bg-primary-soft text-primary"
          : "bg-card text-card-foreground hover:bg-muted"
      }`}
    >
      {children}
    </button>
  );
}

// ── Wizard ───────────────────────────────────────────────
export function IntakeWizard() {
  const [step, setStep] = useState(0);
  const [a, setA] = useState<Answers>(INITIAL);
  const [stepError, setStepError] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "error">("idle");
  const [submitError, setSubmitError] = useState("");

  const total = STEP_TITLES.length;

  function set<K extends keyof Answers>(key: K, value: Answers[K]) {
    setA((prev) => ({ ...prev, [key]: value }));
    setStepError("");
  }

  function toggleDolor(value: string) {
    set(
      "dolores",
      a.dolores.includes(value)
        ? a.dolores.filter((d) => d !== value)
        : [...a.dolores, value]
    );
  }

  function toggleApp(value: string) {
    if (value === "Ninguna") {
      set("apps", a.apps.includes("Ninguna") ? [] : ["Ninguna"]);
      return;
    }
    const next = a.apps.includes(value)
      ? a.apps.filter((x) => x !== value)
      : [...a.apps.filter((x) => x !== "Ninguna"), value];
    set("apps", next);
  }

  function validateStep(s: number): string {
    switch (s) {
      case 0:
        if (!a.business.trim()) return "Contanos el nombre de tu negocio.";
        if (!a.rubro.trim()) return "Contanos el rubro (ej: estética, taller, indumentaria).";
        if (!a.size) return "Elegí el tamaño de tu equipo.";
        return "";
      case 1:
        if (a.dolores.length === 0) return "Elegí al menos un dolor (podés marcar varios).";
        if (a.dolores.includes("otro") && !a.dolorOtro.trim())
          return "Contanos un poco más sobre ese otro dolor.";
        return "";
      case 2:
        if (!a.frecuencia) return "Elegí con qué frecuencia te pasa.";
        return "";
      case 3:
        if (!a.urgencia) return "Elegí para cuándo lo necesitás.";
        if (!a.presupuesto) return "Elegí un rango de presupuesto (o \"no sé\").";
        return "";
      case 4:
        if (!a.name.trim()) return "Necesitamos tu nombre.";
        if (!a.whatsapp.trim()) return "Necesitamos tu WhatsApp para mandarte el plan.";
        if (a.email.trim() && !/^\S+@\S+\.\S+$/.test(a.email.trim()))
          return "Ese email no parece válido.";
        return "";
      default:
        return "";
    }
  }

  function next() {
    const err = validateStep(step);
    if (err) {
      setStepError(err);
      return;
    }
    setStepError("");
    setStep((s) => Math.min(s + 1, total - 1));
  }

  function back() {
    setStepError("");
    setStep((s) => Math.max(s - 1, 0));
  }

  async function submit() {
    const err = validateStep(4);
    if (err) {
      setStepError(err);
      return;
    }
    setStatus("sending");
    setSubmitError("");
    try {
      const res = await fetch("/api/public/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(a),
      });
      if (res.status === 429) {
        throw new Error("Demasiados intentos seguidos. Esperá un minuto y probá de nuevo.");
      }
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? "No pudimos enviar tus respuestas. Probá de nuevo.");
      }
      setStatus("ok");
    } catch (e) {
      setSubmitError(
        e instanceof Error ? e.message : "No pudimos enviar tus respuestas. Probá de nuevo."
      );
      setStatus("error");
    }
  }

  // ── Estados finales ──
  if (status === "sending") {
    return (
      <Card className="flex flex-col items-center gap-4 p-10 text-center">
        <Spinner className="h-8 w-8 text-primary" />
        <p className="font-medium">La IA está analizando tu negocio…</p>
        <p className="text-sm text-muted-foreground">
          Estamos cruzando tus respuestas con nuestro recetario de automatizaciones.
        </p>
      </Card>
    );
  }

  if (status === "ok") {
    return (
      <Card className="p-10 text-center">
        <div aria-hidden className="text-4xl">🚀</div>
        <h2 className="mt-3 text-2xl font-bold">Tu diagnóstico está en marcha</h2>
        <p className="mx-auto mt-2 max-w-md text-muted-foreground">
          En menos de 24 horas te mandamos tu plan de automatización por
          WhatsApp, con propuesta y precios. Atento al teléfono.
        </p>
      </Card>
    );
  }

  // ── Wizard ──
  return (
    <Card className="p-6 sm:p-8">
      {/* Progreso */}
      <div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Paso {step + 1} de {total}
          </span>
          <span>{STEP_TITLES[step]}</span>
        </div>
        <div
          className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={total}
          aria-valuenow={step + 1}
          aria-label="Progreso del cuestionario"
        >
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${((step + 1) / total) * 100}%` }}
          />
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {step === 0 ? (
          <>
            <Field label="Nombre del negocio *">
              <Input
                value={a.business}
                onChange={(e) => set("business", e.target.value)}
                placeholder="Ej: Lubricentro García"
              />
            </Field>
            <Field label="Rubro *">
              <Input
                value={a.rubro}
                onChange={(e) => set("rubro", e.target.value)}
                placeholder="Ej: taller mecánico, estética, indumentaria…"
              />
            </Field>
            <div>
              <p className="mb-1.5 block text-sm font-medium">¿Cuántos son? *</p>
              <div className="flex flex-wrap gap-2">
                {SIZES.map((s) => (
                  <Chip key={s.value} selected={a.size === s.value} onClick={() => set("size", s.value)}>
                    {s.label}
                  </Chip>
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-dashed bg-muted/40 p-4">
              <p className="text-sm font-medium">¿Ya tenés web o Instagram? 🎨</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Opcional. Si nos pasás el link, tomamos tu identidad (colores, logo y estilo) para armar todo con tu marca.
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Field label="Tu web">
                  <Input
                    value={a.web}
                    onChange={(e) => set("web", e.target.value)}
                    placeholder="tunegocio.com"
                    inputMode="url"
                  />
                </Field>
                <Field label="Tu Instagram">
                  <Input
                    value={a.instagram}
                    onChange={(e) => set("instagram", e.target.value)}
                    placeholder="@tunegocio"
                  />
                </Field>
              </div>
            </div>
          </>
        ) : null}

        {step === 1 ? (
          <>
            <div>
              <p className="mb-1.5 block text-sm font-medium">
                ¿Qué te está comiendo el día? * <span className="font-normal text-muted-foreground">(podés marcar varios)</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {DOLORES.map((d) => (
                  <Chip key={d.value} selected={a.dolores.includes(d.value)} onClick={() => toggleDolor(d.value)}>
                    {d.label}
                  </Chip>
                ))}
              </div>
            </div>
            {a.dolores.includes("otro") ? (
              <Field label="Contanos ese otro dolor *">
                <Textarea
                  value={a.dolorOtro}
                  onChange={(e) => set("dolorOtro", e.target.value)}
                  placeholder="Ej: cargo los mismos datos en tres sistemas distintos…"
                />
              </Field>
            ) : null}
          </>
        ) : null}

        {step === 2 ? (
          <>
            <Field label="¿Cuántas veces por día pasa esto? *">
              <Select value={a.frecuencia} onChange={(e) => set("frecuencia", e.target.value)}>
                <option value="" disabled>
                  Elegí una opción…
                </option>
                {FRECUENCIAS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </Select>
            </Field>
            <div>
              <p className="mb-1.5 block text-sm font-medium">
                ¿Qué apps usás hoy? <span className="font-normal text-muted-foreground">(las que apliquen)</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {APPS.map((app) => (
                  <Chip key={app} selected={a.apps.includes(app)} onClick={() => toggleApp(app)}>
                    {app}
                  </Chip>
                ))}
              </div>
            </div>
          </>
        ) : null}

        {step === 3 ? (
          <>
            <Field label="¿Para cuándo lo necesitás? *">
              <Select value={a.urgencia} onChange={(e) => set("urgencia", e.target.value)}>
                <option value="" disabled>
                  Elegí una opción…
                </option>
                {URGENCIAS.map((u) => (
                  <option key={u.value} value={u.value}>
                    {u.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field
              label="Presupuesto mensual aproximado *"
              help="Nos ayuda a recomendarte el plan justo, no el más caro."
            >
              <Select value={a.presupuesto} onChange={(e) => set("presupuesto", e.target.value)}>
                <option value="" disabled>
                  Elegí una opción…
                </option>
                {PRESUPUESTOS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </Select>
            </Field>
          </>
        ) : null}

        {step === 4 ? (
          <>
            <Field label="Tu nombre *">
              <Input
                value={a.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Ej: Mariana Pérez"
                autoComplete="name"
              />
            </Field>
            <Field label="Email">
              <Input
                type="email"
                value={a.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="vos@tunegocio.com"
                autoComplete="email"
              />
            </Field>
            <Field label="WhatsApp *" help="Por acá te mandamos tu plan de automatización.">
              <Input
                type="tel"
                value={a.whatsapp}
                onChange={(e) => set("whatsapp", e.target.value)}
                placeholder="Ej: 291 555 0000"
                autoComplete="tel"
              />
            </Field>
          </>
        ) : null}

        {stepError ? <ErrorState message={stepError} /> : null}
        {status === "error" && submitError ? <ErrorState message={submitError} /> : null}
      </div>

      {/* Navegación */}
      <div className="mt-6 flex items-center justify-between gap-3">
        <Button variant="ghost" onClick={back} disabled={step === 0} type="button">
          ← Atrás
        </Button>
        {step < total - 1 ? (
          <Button onClick={next} type="button">
            Siguiente →
          </Button>
        ) : (
          <Button onClick={submit} type="button" size="lg">
            {status === "error" ? "Reintentar envío" : "Pedir mi diagnóstico"}
          </Button>
        )}
      </div>
    </Card>
  );
}
