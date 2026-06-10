"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge, Button, Card, ErrorState, Field, Input, Spinner } from "@/components/ui";
import { fmtDate } from "../../_components/format";

export type PortalUserData = {
  id: string;
  username: string;
  name: string;
  email: string | null;
  createdAt: string;
};

export function PortalAccessSection({
  clientId,
  users,
}: {
  clientId: string;
  users: PortalUserData[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(users.length === 0);
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, name: name || username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo crear el usuario");
      setOk(`Usuario "${username}" creado. Ya puede entrar al portal.`);
      setUsername("");
      setName("");
      setPassword("");
      setOpen(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo crear el usuario");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold">Acceso al portal</h2>
        <Button size="sm" variant="secondary" onClick={() => setOpen((v) => !v)}>
          {open ? "Cerrar" : "+ Usuario"}
        </Button>
      </div>

      {users.length === 0 ? (
        <p className="mb-3 text-sm text-muted-foreground">
          Este cliente todavía no tiene usuario para entrar a su portal.
        </p>
      ) : (
        <ul className="mb-3 divide-y">
          {users.map((u) => (
            <li key={u.id} className="flex flex-wrap items-center gap-2 py-2.5">
              <span className="font-medium">{u.name}</span>
              <Badge variant="outline">@{u.username}</Badge>
              {u.email ? <span className="text-xs text-muted-foreground">{u.email}</span> : null}
              <span className="ml-auto text-xs text-muted-foreground">Alta: {fmtDate(u.createdAt)}</span>
            </li>
          ))}
        </ul>
      )}

      {ok ? <p className="mb-3 text-sm font-medium text-success">{ok}</p> : null}
      {error ? <div className="mb-3"><ErrorState message={error} /></div> : null}

      {open ? (
        <form onSubmit={submit} className="grid gap-3 rounded-md border border-dashed p-3 sm:grid-cols-3">
          <Field label="Usuario" help="Para el login (sin espacios)">
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ""))}
              required
              minLength={3}
            />
          </Field>
          <Field label="Nombre">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre visible" />
          </Field>
          <Field label="Contraseña" help="Mínimo 8 caracteres">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </Field>
          <div className="sm:col-span-3">
            <Button type="submit" size="sm" disabled={busy || !username || password.length < 8}>
              {busy ? <Spinner /> : null} Crear usuario
            </Button>
          </div>
        </form>
      ) : null}
    </Card>
  );
}
