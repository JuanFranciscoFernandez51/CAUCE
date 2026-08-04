"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type Miembro = { id: string; username: string; name: string; email: string | null; createdAt: string };

/** El equipo que entra al panel de Cauce. Son usuarios ADMIN. */
export function EquipoPanel({ inicial }: { inicial: Miembro[] }) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [form, setForm] = useState({ name: "", username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [ocupado, setOcupado] = useState(false);

  async function crear() {
    setError("");
    if (form.password.length < 8) return setError("La contraseña tiene que tener al menos 8 caracteres");
    setOcupado(true);
    const res = await fetch("/api/admin/equipo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setOcupado(false);
    if (!res.ok) {
      const d = await res.json().catch(() => null);
      return setError(d?.error ?? "No se pudo crear");
    }
    setForm({ name: "", username: "", email: "", password: "" });
    setAbierto(false);
    router.refresh();
  }

  async function borrar(id: string, nombre: string) {
    if (!confirm(`¿Sacar a ${nombre} del equipo? No va a poder entrar más al panel.`)) return;
    const res = await fetch(`/api/admin/equipo/${id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
    else setError("No se pudo eliminar");
  }

  const input = "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary";

  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Equipo</h2>
          <p className="text-xs text-muted-foreground">Quiénes pueden entrar a este panel.</p>
        </div>
        <button
          onClick={() => setAbierto((v) => !v)}
          className="h-9 rounded-lg bg-foreground px-4 text-sm font-medium text-background transition hover:opacity-90"
        >
          {abierto ? "Cancelar" : "+ Sumar a alguien"}
        </button>
      </div>

      {abierto ? (
        <div className="mt-4 grid gap-3 rounded-lg border border-border bg-muted/30 p-3 sm:grid-cols-2 lg:grid-cols-4">
          <input placeholder="Nombre y apellido" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={input} />
          <input placeholder="Usuario para entrar" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className={input} />
          <input placeholder="Email (opcional)" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={input} />
          <input placeholder="Contraseña" type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={input} />
          <div className="sm:col-span-2 lg:col-span-4 flex items-center gap-3">
            <button
              onClick={crear}
              disabled={ocupado || !form.name || !form.username || !form.password}
              className="h-9 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-40"
            >
              {ocupado ? "Creando…" : "Crear usuario"}
            </button>
            <p className="text-xs text-muted-foreground">
              Anotá la contraseña antes de guardar: después queda cifrada y no se puede ver.
            </p>
          </div>
        </div>
      ) : null}

      {error ? <p className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}

      <div className="mt-4 overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Nombre</th>
              <th className="px-3 py-2">Usuario</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Desde</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {inicial.map((m) => (
              <tr key={m.id}>
                <td className="px-3 py-2 font-medium">{m.name}</td>
                <td className="px-3 py-2 text-muted-foreground">{m.username}</td>
                <td className="px-3 py-2 text-muted-foreground">{m.email ?? "—"}</td>
                <td className="px-3 py-2 text-xs text-muted-foreground">{m.createdAt}</td>
                <td className="px-3 py-2 text-right">
                  {inicial.length > 1 ? (
                    <button onClick={() => borrar(m.id, m.name)} className="text-xs text-muted-foreground hover:text-destructive">
                      Sacar
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
