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
  Spinner,
  Table,
  Td,
  Th,
} from "@/components/ui";

export type ManagedEmployee = {
  id: string;
  name: string;
  phone: string | null;
  role: string | null;
  active: boolean;
};

/** ABM mínimo del equipo: alta (nombre, teléfono, rol) + desactivar/reactivar. */
export function EmployeeManager({
  slug,
  employees,
}: {
  slug: string;
  employees: ManagedEmployee[];
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("El nombre es obligatorio");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/os/${slug}/employees`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim() || undefined,
          role: role.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "No se pudo crear el empleado");
      setName("");
      setPhone("");
      setRole("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de conexión");
    } finally {
      setSaving(false);
    }
  }

  async function setActive(emp: ManagedEmployee, active: boolean) {
    setBusyId(emp.id);
    setError("");
    try {
      const res = await fetch(`/api/os/${slug}/employees/${emp.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "No se pudo actualizar el empleado");
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error de conexión");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-3">
      {error ? <ErrorState message={error} /> : null}

      <Card className="p-4">
        <form onSubmit={onCreate} className="grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end">
          <Field label="Nombre *">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="María Gómez"
              required
            />
          </Field>
          <Field label="Teléfono">
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+54 9 291 …"
              inputMode="tel"
            />
          </Field>
          <Field label="Rol">
            <Input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Vendedora"
            />
          </Field>
          <Button type="submit" disabled={saving} className="sm:mb-0">
            {saving ? <Spinner /> : null}
            {saving ? "Guardando…" : "+ Empleado"}
          </Button>
        </form>
      </Card>

      {employees.length === 0 ? (
        <p className="rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground">
          Todavía no cargaste a nadie del equipo.
        </p>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Empleado</Th>
              <Th className="hidden sm:table-cell">Teléfono</Th>
              <Th className="hidden sm:table-cell">Rol</Th>
              <Th>Estado</Th>
              <Th className="text-right">Acciones</Th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => {
              const busy = busyId === emp.id;
              return (
                <tr key={emp.id} className={busy ? "opacity-60" : ""}>
                  <Td className="font-medium">{emp.name}</Td>
                  <Td className="hidden text-muted-foreground sm:table-cell">
                    {emp.phone ?? "—"}
                  </Td>
                  <Td className="hidden text-muted-foreground sm:table-cell">
                    {emp.role ?? "—"}
                  </Td>
                  <Td>
                    <Badge variant={emp.active ? "success" : "default"}>
                      {emp.active ? "Activo" : "Inactivo"}
                    </Badge>
                  </Td>
                  <Td className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-7 px-2 ${emp.active ? "text-destructive" : "text-success"}`}
                      onClick={() => setActive(emp, !emp.active)}
                      disabled={busy}
                    >
                      {emp.active ? "Desactivar" : "Reactivar"}
                    </Button>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}
    </div>
  );
}
