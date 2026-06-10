"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button, Card, ErrorState, Field, Input, Spinner } from "@/components/ui";
import { ThemeToggle } from "@/components/theme";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Usuario o contraseña incorrectos.");
      return;
    }
    router.push(params.get("callbackUrl") || "/go");
    router.refresh();
  }

  return (
    <Card className="w-full max-w-sm p-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <Link href="/" className="text-2xl font-bold text-primary">
            Cauce
          </Link>
          <p className="mt-1 text-sm text-muted-foreground">
            Entrá a tu cuenta
          </p>
        </div>
        <ThemeToggle />
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Usuario">
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
            autoFocus
          />
        </Field>
        <Field label="Contraseña">
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </Field>
        {error ? <ErrorState message={error} /> : null}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <Spinner /> : null}
          {loading ? "Entrando…" : "Entrar"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        ¿Todavía no tenés cuenta?{" "}
        <Link href="/registro" className="font-medium text-primary hover:underline">
          Creá tu bot Starter
        </Link>
      </p>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <Suspense fallback={<Spinner />}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
