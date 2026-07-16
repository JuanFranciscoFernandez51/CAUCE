"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Badge,
  Button,
  Card,
  ErrorState,
  Field,
  Input,
  Select,
  Spinner,
  Table,
  Td,
  Th,
} from "@/components/ui";

type OsUser = { id: string; name: string; username: string; osRole: string; createdAt: string };
type Estilo = {
  esquinas: "rectas" | "suaves" | "redondeadas";
  nav: "izquierda" | "arriba";
  densidad: "comoda" | "compacta";
};
type Branding = { displayName: string; primary: string; accent: string; estilo: Estilo };

export function ConfigPanel({
  slug,
  meId,
  users: initialUsers,
  branding: initialBranding,
}: {
  slug: string;
  meId: string;
  users: OsUser[];
  branding: Branding;
}) {
  return (
    <div className="space-y-8">
      <TeamSection slug={slug} meId={meId} initialUsers={initialUsers} />
      <BrandingSection slug={slug} initial={initialBranding} />
    </div>
  );
}

function roleLabel(r: string) {
  return r === "dueno" ? "Dueño" : "Equipo";
}

export function TeamSection({ slug, meId, initialUsers }: { slug: string; meId: string; initialUsers: OsUser[] }) {
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", username: "", password: "", osRole: "equipo" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function addUser(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/os/${slug}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "No se pudo crear el usuario");
      setUsers((u) => [...u, data.user]);
      setForm({ name: "", username: "", password: "", osRole: "equipo" });
      setAdding(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de conexión");
    } finally {
      setBusy(false);
    }
  }

  async function changeRole(id: string, osRole: string) {
    const prev = users;
    setUsers((u) => u.map((x) => (x.id === id ? { ...x, osRole } : x)));
    const res = await fetch(`/api/os/${slug}/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ osRole }),
    });
    if (!res.ok) setUsers(prev);
    else router.refresh();
  }

  async function removeUser(id: string, name: string) {
    if (!confirm(`¿Quitarle el acceso a ${name}? No podrá entrar más al sistema.`)) return;
    const prev = users;
    setUsers((u) => u.filter((x) => x.id !== id));
    const res = await fetch(`/api/os/${slug}/users/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setUsers(prev);
      const data = await res.json().catch(() => null);
      alert(data?.error ?? "No se pudo quitar el acceso");
    }
  }

  async function cambiarPassword(id: string, name: string) {
    const pwd = prompt(`Nueva contraseña para ${name} (mínimo 8 caracteres):`);
    if (pwd === null) return;
    if (pwd.length < 8) { alert("La contraseña debe tener al menos 8 caracteres."); return; }
    const res = await fetch(`/api/os/${slug}/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pwd }),
    });
    if (res.ok) alert(`Contraseña de ${name} actualizada.`);
    else {
      const data = await res.json().catch(() => null);
      alert(data?.error ?? "No se pudo cambiar la contraseña");
    }
  }

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">Tu equipo</h2>
          <p className="text-sm text-muted-foreground">Quién puede entrar a tu sistema y con qué permisos.</p>
        </div>
        {!adding ? <Button size="sm" onClick={() => setAdding(true)}>+ Usuario</Button> : null}
      </div>

      {adding ? (
        <form onSubmit={addUser} className="mb-5 grid gap-3 rounded-md border p-4 sm:grid-cols-2">
          <Field label="Nombre">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </Field>
          <Field label="Usuario" help="Con esto inicia sesión. Sin espacios.">
            <Input
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase() })}
              required
            />
          </Field>
          <Field label="Contraseña" help="Mínimo 8 caracteres.">
            <Input
              type="text"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </Field>
          <Field label="Permiso">
            <Select value={form.osRole} onChange={(e) => setForm({ ...form, osRole: e.target.value })}>
              <option value="equipo">Equipo (no ve la Caja ni la Configuración)</option>
              <option value="dueno">Dueño (acceso total)</option>
            </Select>
          </Field>
          {error ? <div className="sm:col-span-2"><ErrorState message={error} /></div> : null}
          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit" disabled={busy} size="sm">
              {busy ? <Spinner /> : null} Crear acceso
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => { setAdding(false); setError(""); }}>
              Cancelar
            </Button>
          </div>
        </form>
      ) : null}

      <div className="overflow-x-auto">
        <Table>
          <thead>
            <tr>
              <Th>Nombre</Th>
              <Th>Usuario</Th>
              <Th>Permiso</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <Td className="font-medium">
                  {u.name}
                  {u.id === meId ? <span className="ml-2 text-xs text-muted-foreground">(vos)</span> : null}
                </Td>
                <Td className="text-muted-foreground">{u.username}</Td>
                <Td>
                  {u.id === meId ? (
                    <Badge>{roleLabel(u.osRole)}</Badge>
                  ) : (
                    <Select
                      value={u.osRole}
                      onChange={(e) => changeRole(u.id, e.target.value)}
                      className="h-8 w-32 text-sm"
                    >
                      <option value="equipo">Equipo</option>
                      <option value="dueno">Dueño</option>
                    </Select>
                  )}
                </Td>
                <Td className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" onClick={() => cambiarPassword(u.id, u.name)}>
                      🔑 Contraseña
                    </Button>
                    {u.id !== meId ? (
                      <Button variant="ghost" size="sm" onClick={() => removeUser(u.id, u.name)}>
                        Quitar acceso
                      </Button>
                    ) : null}
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </Card>
  );
}

export function BrandingSection({ slug, initial }: { slug: string; initial: Branding }) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setSaved(false);
    try {
      const res = await fetch(`/api/os/${slug}/config`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "No se pudo guardar");
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de conexión");
    } finally {
      setBusy(false);
    }
  }

  const colorRow = (key: "primary" | "accent", label: string) => (
    <Field label={label}>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={form[key]}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          className="h-9 w-12 cursor-pointer rounded border bg-card"
          aria-label={label}
        />
        <Input
          value={form[key]}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          className="w-32 font-mono text-sm"
        />
      </div>
    </Field>
  );

  return (
    <Card className="p-5">
      <div className="mb-4">
        <h2 className="font-semibold">La marca de tu sistema</h2>
        <p className="text-sm text-muted-foreground">
          El nombre y los colores con los que ve tu sistema tu equipo (y tus clientes, si lo abrís a tu dominio).
        </p>
      </div>
      <form onSubmit={save} className="grid gap-4 sm:grid-cols-3">
        <Field label="Nombre del sistema">
          <Input value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} required />
        </Field>
        {colorRow("primary", "Color principal")}
        {colorRow("accent", "Color de acento")}

        {/* Las terminaciones: cómo se ve y se acomoda el sistema */}
        <div className="sm:col-span-3 grid gap-4 border-t pt-4 sm:grid-cols-3">
          <Field label="Esquinas" help="El acabado de tarjetas y botones.">
            <Select
              value={form.estilo.esquinas}
              onChange={(e) =>
                setForm({ ...form, estilo: { ...form.estilo, esquinas: e.target.value as Estilo["esquinas"] } })
              }
            >
              <option value="rectas">Rectas (sobrio)</option>
              <option value="suaves">Suaves (equilibrado)</option>
              <option value="redondeadas">Redondeadas (amigable)</option>
            </Select>
          </Field>
          <Field label="Menú" help="Dónde vive la navegación.">
            <Select
              value={form.estilo.nav}
              onChange={(e) =>
                setForm({ ...form, estilo: { ...form.estilo, nav: e.target.value as Estilo["nav"] } })
              }
            >
              <option value="izquierda">A la izquierda</option>
              <option value="arriba">Arriba</option>
            </Select>
          </Field>
          <Field label="Densidad" help="Cuánta información por pantalla.">
            <Select
              value={form.estilo.densidad}
              onChange={(e) =>
                setForm({ ...form, estilo: { ...form.estilo, densidad: e.target.value as Estilo["densidad"] } })
              }
            >
              <option value="comoda">Cómoda (más aire)</option>
              <option value="compacta">Compacta (más info)</option>
            </Select>
          </Field>
        </div>

        <div className="flex items-center gap-3 sm:col-span-3">
          <Button type="submit" disabled={busy} size="sm">
            {busy ? <Spinner /> : null} Guardar marca
          </Button>
          {saved ? <span className="text-sm font-medium text-success">Guardado ✓</span> : null}
        </div>
        {error ? <div className="sm:col-span-3"><ErrorState message={error} /></div> : null}
      </form>
    </Card>
  );
}
