"use client";

import { useEffect, useState } from "react";
import {
  Button,
  Card,
  ErrorState,
  Field,
  Input,
  Spinner,
  Textarea,
} from "@/components/ui";
import { fmtDayLabel, fmtTime } from "@/app/os/[slug]/_lib/dates";

type Employee = { id: string; name: string; role: string | null };
type Glossary = { appointment: string; appointmentCap: string };

type Step = 1 | 2 | 3 | 4;

export function BookingFlow({
  slug,
  employees,
  days,
  glossary,
}: {
  slug: string;
  employees: Employee[];
  days: string[];
  glossary: Glossary;
}) {
  const hasEmployees = employees.length > 0;
  // Si no hay recursos, arrancamos directo en elegir día.
  const [step, setStep] = useState<Step>(hasEmployees ? 1 : 2);
  const [employeeId, setEmployeeId] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [time, setTime] = useState<string>("");

  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState("");

  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [nota, setNota] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ fecha: string; hora: string } | null>(null);

  // Cargar huecos libres cuando hay día (y recurso si aplica).
  useEffect(() => {
    if (step !== 3 || !date) return;
    let alive = true;
    setLoadingSlots(true);
    setSlotsError("");
    setTime("");
    const qs = new URLSearchParams({ date });
    if (employeeId) qs.set("employeeId", employeeId);
    fetch(`/api/public/agendar/${slug}?${qs.toString()}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("No pudimos cargar los horarios");
        const data = await res.json();
        if (alive) setSlots(data.slots ?? []);
      })
      .catch(() => {
        if (alive) {
          setSlots([]);
          setSlotsError("No pudimos cargar los horarios. Probá de nuevo.");
        }
      })
      .finally(() => {
        if (alive) setLoadingSlots(false);
      });
    return () => {
      alive = false;
    };
  }, [step, date, employeeId, slug]);

  async function confirmar(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!nombre.trim()) return setError("Decinos tu nombre");
    if (telefono.trim().length < 6) return setError("Dejanos un teléfono válido");
    setSaving(true);
    try {
      const res = await fetch(`/api/public/agendar/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nombre.trim(),
          telefono: telefono.trim(),
          email: email.trim() || "",
          nota: nota.trim() || "",
          employeeId: employeeId || undefined,
          fecha: date,
          hora: time,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        // Si el slot se ocupó, volvemos a horarios con la lista fresca.
        if (res.status === 409 && Array.isArray(data?.slots)) {
          setSlots(data.slots);
          setTime("");
          setStep(3);
        }
        throw new Error(data?.error ?? "No se pudo confirmar");
      }
      setDone({ fecha: date, hora: time });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de conexión");
    } finally {
      setSaving(false);
    }
  }

  // ── Éxito ──────────────────────────────────────────────
  if (done) {
    const emp = employees.find((x) => x.id === employeeId);
    return (
      <Card className="space-y-3 p-6 text-center">
        <div className="text-4xl">✅</div>
        <h1 className="text-xl font-semibold">¡Listo {nombre.split(" ")[0]}!</h1>
        <p className="text-sm text-muted-foreground">
          Tu {glossary.appointment} quedó para el{" "}
          <span className="font-medium text-foreground capitalize">{fmtDayLabel(done.fecha)}</span> a
          las <span className="font-medium text-foreground">{done.hora}</span>
          {emp ? (
            <>
              {" "}
              con <span className="font-medium text-foreground">{emp.name}</span>
            </>
          ) : null}
          .
        </p>
        <p className="text-xs text-muted-foreground">
          Te vamos a confirmar por teléfono. ¡Gracias!
        </p>
      </Card>
    );
  }

  const steps: { n: Step; label: string }[] = [
    ...(hasEmployees ? [{ n: 1 as Step, label: "Con quién" }] : []),
    { n: 2, label: "Día" },
    { n: 3, label: "Horario" },
    { n: 4, label: "Tus datos" },
  ];

  return (
    <div className="space-y-4">
      {/* Pasos */}
      <div className="flex items-center gap-1.5 text-xs">
        {steps.map((s, i) => (
          <div key={s.n} className="flex items-center gap-1.5">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full font-semibold ${
                step >= s.n
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {i + 1}
            </span>
            <span className={step >= s.n ? "font-medium" : "text-muted-foreground"}>
              {s.label}
            </span>
            {i < steps.length - 1 ? <span className="text-muted-foreground">›</span> : null}
          </div>
        ))}
      </div>

      {/* Paso 1: recurso */}
      {step === 1 && hasEmployees ? (
        <Card className="space-y-2 p-4">
          <h2 className="font-semibold">¿Con quién querés tu {glossary.appointment}?</h2>
          <div className="grid gap-2">
            {employees.map((emp) => (
              <button
                key={emp.id}
                type="button"
                onClick={() => {
                  setEmployeeId(emp.id);
                  setStep(2);
                }}
                className="flex items-center gap-3 rounded-md border bg-card px-3 py-3 text-left transition-colors hover:bg-muted"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-bold text-primary">
                  {emp.name.charAt(0).toUpperCase()}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{emp.name}</span>
                  {emp.role ? (
                    <span className="block truncate text-xs text-muted-foreground">{emp.role}</span>
                  ) : null}
                </span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setEmployeeId("");
                setStep(2);
              }}
              className="rounded-md border border-dashed px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted"
            >
              No tengo preferencia
            </button>
          </div>
        </Card>
      ) : null}

      {/* Paso 2: día */}
      {step === 2 ? (
        <Card className="space-y-3 p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Elegí el día</h2>
            {hasEmployees ? (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs text-primary hover:underline"
              >
                ← Cambiar recurso
              </button>
            ) : null}
          </div>
          {days.length === 0 ? (
            <p className="rounded-md border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
              No hay días con disponibilidad por ahora. Probá más tarde.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {days.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => {
                    setDate(d);
                    setStep(3);
                  }}
                  className={`rounded-md border px-2 py-2.5 text-center text-sm capitalize transition-colors hover:bg-muted ${
                    date === d ? "border-primary bg-primary-soft text-primary" : "bg-card"
                  }`}
                >
                  {fmtDayLabel(d)}
                </button>
              ))}
            </div>
          )}
        </Card>
      ) : null}

      {/* Paso 3: horario */}
      {step === 3 ? (
        <Card className="space-y-3 p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold capitalize">{fmtDayLabel(date)}</h2>
            <button
              type="button"
              onClick={() => setStep(2)}
              className="text-xs text-primary hover:underline"
            >
              ← Cambiar día
            </button>
          </div>
          {slotsError ? <ErrorState message={slotsError} /> : null}
          {loadingSlots ? (
            <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
              <Spinner /> Buscando horarios libres…
            </div>
          ) : slots.length === 0 ? (
            <p className="rounded-md border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
              No quedan horarios libres ese día. Probá con otro.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {slots.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setTime(t);
                    setStep(4);
                  }}
                  className={`rounded-md border px-2 py-2.5 text-center font-mono text-sm tabular-nums transition-colors hover:bg-muted ${
                    time === t ? "border-primary bg-primary-soft text-primary" : "bg-card"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          )}
        </Card>
      ) : null}

      {/* Paso 4: datos + confirmar */}
      {step === 4 ? (
        <Card className="p-4">
          <form onSubmit={confirmar} className="space-y-4">
            <div className="rounded-md bg-muted px-3 py-2 text-sm">
              <span className="capitalize">{fmtDayLabel(date)}</span> a las{" "}
              <span className="font-medium">{time}</span>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="ml-2 text-xs text-primary hover:underline"
              >
                cambiar
              </button>
            </div>

            {error ? <ErrorState message={error} /> : null}

            <Field label="Tu nombre *">
              <Input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Nombre y apellido"
                autoFocus
                required
              />
            </Field>
            <Field label="Teléfono / WhatsApp *">
              <Input
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="Ej: 11 5555 5555"
                inputMode="tel"
                required
              />
            </Field>
            <Field label="Email (opcional)">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tucorreo@email.com"
              />
            </Field>
            <Field label="Algo que quieras aclarar (opcional)">
              <Textarea
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                placeholder="Motivo, comentario…"
              />
            </Field>

            <Button type="submit" disabled={saving} className="w-full">
              {saving ? <Spinner /> : null}
              {saving ? "Confirmando…" : `Confirmar ${glossary.appointment}`}
            </Button>
          </form>
        </Card>
      ) : null}
    </div>
  );
}
