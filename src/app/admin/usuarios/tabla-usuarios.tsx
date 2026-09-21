"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Usuario = {
  id: string;
  username: string;
  name: string;
  email: string | null;
  role: "ADMIN" | "CLIENT";
  osRole: string;
  clientId: string | null;
  createdAt: string;
};
type Cliente = { id: string; name: string; slug: string };

export function TablaUsuarios({ yo, usuarios, clientes }: { yo: string; usuarios: Usuario[]; clientes: Cliente[] }) {
  const [abierto, setAbierto] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [filtro, setFiltro] = useState<"todos" | "ADMIN" | "CLIENT" | "huerfanos">("todos");
  const nombreCliente = (id: string | null) => clientes.find((c) => c.id === id)?.name ?? null;

  const lista = usuarios.filter((u) => {
    if (filtro === "ADMIN" && u.role !== "ADMIN") return false;
    if (filtro === "CLIENT" && u.role !== "CLIENT") return false;
    if (filtro === "huerfanos" && !(u.role === "CLIENT" && !u.clientId)) return false;
    if (!q) return true;
    return `${u.username} ${u.name} ${u.email ?? ""} ${nombreCliente(u.clientId) ?? ""}`.toLowerCase().includes(q.toLowerCase());
  });
  const huerfanos = usuarios.filter((u) => u.role === "CLIENT" && !u.clientId).length;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            ["todos", `Todos ${usuarios.length}`],
            ["ADMIN", `Equipo Cauce ${usuarios.filter((u) => u.role === "ADMIN").length}`],
            ["CLIENT", `Clientes ${usuarios.filter((u) => u.role === "CLIENT").length}`],
            ...(huerfanos ? [["huerfanos", `Sin negocio ${huerfanos}`]] : []),
          ] as [typeof filtro, string][]
        ).map(([k, l]) => (
          <button
            key={k}
            type="button"
            onClick={() => setFiltro(k)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${filtro === k ? "border-foreground bg-foreground text-background" : "border-border hover:bg-muted"}`}
          >
            {l}
          </button>
        ))}
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar usuario, nombre o negocio…"
          className="ml-auto h-9 w-64 rounded-lg border border-border bg-card px-3 text-sm"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5">Usuario</th>
              <th className="px-4 py-2.5">Nombre</th>
              <th className="px-4 py-2.5">Tipo</th>
              <th className="px-4 py-2.5">Negocio</th>
              <th className="px-4 py-2.5">Alta</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {lista.map((u) => (
              <Fila
                key={u.id}
                u={u}
                yo={u.username === yo}
                clientes={clientes}
                abierto={abierto === u.id}
                onToggle={() => setAbierto(abierto === u.id ? null : u.id)}
                nombreCliente={nombreCliente(u.clientId)}
              />
            ))}
          </tbody>
        </table>
        {!lista.length ? <p className="py-10 text-center text-sm text-muted-foreground">No hay usuarios con ese filtro.</p> : null}
      </div>
    </div>
  );
}

function Fila({
  u,
  yo,
  clientes,
  abierto,
  onToggle,
  nombreCliente,
}: {
  u: Usuario;
  yo: boolean;
  clientes: Cliente[];
  abierto: boolean;
  onToggle: () => void;
  nombreCliente: string | null;
}) {
  const router = useRouter();
  const [f, setF] = useState({ name: u.name, username: u.username, email: u.email ?? "", role: u.role, osRole: u.osRole, clientId: u.clientId ?? "" });
  const [clave, setClave] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);

  async function guardar() {
    setOcupado(true);
    setMsg(null);
    const r = await fetch(`/api/admin/usuarios/${u.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...f, clientId: f.clientId || null, ...(clave ? { password: clave } : {}) }),
    });
    const d = await r.json().catch(() => ({}));
    setOcupado(false);
    if (!r.ok) return setMsg({ ok: false, t: d.error ?? "No se pudo guardar" });
    setClave("");
    setMsg({ ok: true, t: clave ? "Guardado, con contraseña nueva." : "Guardado." });
    router.refresh();
  }

  async function borrar() {
    if (!confirm(`¿Borrar el usuario "${u.username}"? No va a poder entrar más.`)) return;
    setOcupado(true);
    const r = await fetch(`/api/admin/usuarios/${u.id}`, { method: "DELETE" });
    const d = await r.json().catch(() => ({}));
    setOcupado(false);
    if (!r.ok) return setMsg({ ok: false, t: d.error ?? "No se pudo borrar" });
    router.refresh();
  }

  const input = "h-9 w-full rounded-lg border border-border bg-card px-3 text-sm";
  return (
    <>
      <tr onClick={onToggle} className={`cursor-pointer transition hover:bg-muted/40 ${abierto ? "bg-muted/40" : ""}`}>
        <td className="px-4 py-2.5 font-mono text-xs font-semibold">
          {u.username}
          {yo ? <span className="ml-2 rounded-full bg-primary/15 px-2 py-0.5 font-sans text-[10px] text-primary">vos</span> : null}
        </td>
        <td className="px-4 py-2.5">{u.name}</td>
        <td className="px-4 py-2.5">
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${u.role === "ADMIN" ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
            {u.role === "ADMIN" ? "Equipo Cauce" : u.osRole === "equipo" ? "Cliente · equipo" : "Cliente · dueño"}
          </span>
        </td>
        <td className="px-4 py-2.5 text-muted-foreground">
          {u.role === "ADMIN" ? "—" : nombreCliente ?? <span className="text-destructive">Sin negocio</span>}
        </td>
        <td className="px-4 py-2.5 text-xs text-muted-foreground">{new Date(u.createdAt).toLocaleDateString("es-AR")}</td>
      </tr>
      {abierto ? (
        <tr className="bg-muted/20">
          <td colSpan={5} className="px-4 py-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <label className="space-y-1 text-xs text-muted-foreground">
                Nombre
                <input className={input} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
              </label>
              <label className="space-y-1 text-xs text-muted-foreground">
                Usuario (para entrar)
                <input className={input} value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} />
              </label>
              <label className="space-y-1 text-xs text-muted-foreground">
                Email
                <input className={input} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder="opcional" />
              </label>
              <label className="space-y-1 text-xs text-muted-foreground">
                Tipo
                <select className={input} value={f.role} onChange={(e) => setF({ ...f, role: e.target.value as Usuario["role"] })}>
                  <option value="ADMIN">Equipo Cauce (admin)</option>
                  <option value="CLIENT">Usuario de un cliente</option>
                </select>
              </label>
              {f.role === "CLIENT" ? (
                <>
                  <label className="space-y-1 text-xs text-muted-foreground">
                    Negocio
                    <select className={input} value={f.clientId} onChange={(e) => setF({ ...f, clientId: e.target.value })}>
                      <option value="">— Sin negocio —</option>
                      {clientes.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-1 text-xs text-muted-foreground">
                    Permisos en su sistema
                    <select className={input} value={f.osRole} onChange={(e) => setF({ ...f, osRole: e.target.value })}>
                      <option value="dueno">Dueño (todo: caja, configuración)</option>
                      <option value="equipo">Equipo (operativo, sin caja ni config)</option>
                    </select>
                  </label>
                </>
              ) : null}
              <label className="space-y-1 text-xs text-muted-foreground">
                Contraseña nueva
                <input
                  className={input}
                  type="password"
                  autoComplete="new-password"
                  value={clave}
                  onChange={(e) => setClave(e.target.value)}
                  placeholder="Dejar vacío para no cambiarla"
                />
              </label>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={guardar}
                disabled={ocupado}
                className="rounded-lg bg-foreground px-4 py-2 text-sm font-semibold text-background transition hover:opacity-90 disabled:opacity-50"
              >
                Guardar
              </button>
              {!yo ? (
                <button
                  type="button"
                  onClick={borrar}
                  disabled={ocupado}
                  className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground transition hover:border-destructive hover:text-destructive disabled:opacity-50"
                >
                  Borrar usuario
                </button>
              ) : null}
              {msg ? <span className={`text-sm ${msg.ok ? "text-success" : "text-destructive"}`}>{msg.t}</span> : null}
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
}
