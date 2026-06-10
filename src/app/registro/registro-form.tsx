"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Button,
  Card,
  ErrorState,
  Field,
  Input,
  Spinner,
} from "@/components/ui";
import { ThemeToggle } from "@/components/theme";

function StepDot({ n, label, active, done }: { n: number; label: string; active: boolean; done: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={
          "flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold " +
          (done || active
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground")
        }
      >
        {done ? "✓" : n}
      </span>
      <span className={"text-sm font-medium " + (active ? "text-foreground" : "text-muted-foreground")}>
        {label}
      </span>
    </div>
  );
}

export function RegistroForm({ monthlyUsd }: { monthlyUsd: number }) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Paso 1 — datos del negocio
  const [business, setBusiness] = useState("");
  const [rubro, setRubro] = useState("");
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");

  // Paso 2 — tu cuenta
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");

  function next(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStep(2);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("La contraseña necesita al menos 8 caracteres.");
      return;
    }
    if (password !== password2) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/public/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business, rubro, name, whatsapp, email, username, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "No pudimos crear tu cuenta. Probá de nuevo.");
        setLoading(false);
        return;
      }
      const login = await signIn("credentials", {
        username: username.toLowerCase().trim(),
        password,
        redirect: false,
      });
      if (login?.error) {
        // La cuenta se creó pero el login automático falló — lo mandamos al login
        router.push("/login");
        return;
      }
      router.push("/portal");
      router.refresh();
    } catch {
      setError("Error de conexión. Revisá tu internet y probá de nuevo.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link href="/" className="text-xl font-bold text-primary">
            Cauce
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-10">
        <h1 className="text-2xl font-bold sm:text-3xl">Creá tu bot Starter</h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Bot de FAQ + captura de leads por WhatsApp o Instagram. USD{" "}
          {monthlyUsd.toLocaleString("es-AR")}/mes, sin costo de setup. Lo activás vos.
        </p>

        <div className="mt-8 flex w-full items-center justify-center gap-6">
          <StepDot n={1} label="Datos del negocio" active={step === 1} done={step === 2} />
          <div className="h-px w-10 bg-border" />
          <StepDot n={2} label="Tu cuenta" active={step === 2} done={false} />
        </div>

        <Card className="mt-6 w-full p-6 sm:p-8">
          {step === 1 ? (
            <form onSubmit={next} className="space-y-4">
              <Field label="Nombre del negocio *">
                <Input
                  value={business}
                  onChange={(e) => setBusiness(e.target.value)}
                  placeholder="Ej: Vespa Bahía"
                  required
                  minLength={2}
                  autoFocus
                />
              </Field>
              <Field label="Rubro *">
                <Input
                  value={rubro}
                  onChange={(e) => setRubro(e.target.value)}
                  placeholder="Ej: taller de motos, consultorio, tienda de ropa"
                  required
                  minLength={2}
                />
              </Field>
              <Field label="Tu nombre *">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nombre y apellido"
                  required
                  minLength={2}
                  autoComplete="name"
                />
              </Field>
              <Field label="WhatsApp *" help="Con código de área, ej: +54 9 291 471 3920">
                <Input
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="+54 9 …"
                  required
                  minLength={6}
                  inputMode="tel"
                  autoComplete="tel"
                />
              </Field>
              <Field label="Email">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="opcional"
                  autoComplete="email"
                />
              </Field>
              <Button type="submit" className="w-full">
                Continuar →
              </Button>
            </form>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <Field label="Usuario *" help="Letras, números, puntos y guiones. Lo usás para entrar al portal.">
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="ej: vespabahia"
                  required
                  minLength={3}
                  autoComplete="username"
                  autoFocus
                />
              </Field>
              <Field label="Contraseña *" help="Mínimo 8 caracteres">
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </Field>
              <Field label="Repetir contraseña *">
                <Input
                  type="password"
                  value={password2}
                  onChange={(e) => setPassword2(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </Field>
              {error ? <ErrorState message={error} /> : null}
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setError(null);
                    setStep(1);
                  }}
                  disabled={loading}
                >
                  ← Volver
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? <Spinner /> : null}
                  {loading ? "Creando tu cuenta…" : "Crear mi bot"}
                </Button>
              </div>
            </form>
          )}
        </Card>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          ¿Ya tenés cuenta?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Entrá acá
          </Link>
        </p>
      </div>
    </main>
  );
}
