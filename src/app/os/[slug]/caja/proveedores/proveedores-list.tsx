"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Badge,
  Button,
  ButtonLink,
  Card,
  EmptyState,
  ErrorState,
  Input,
  Select,
  Spinner,
  Stat,
} from "@/components/ui";

export type ProveedorView = {
  id: string;
  nombre: string;
  categoria: string;
  detalle: string | null;
  telefono: string | null;
  montoMensual: number;
  diaPago: number | null;
  activo: boolean;
  notas: string | null;
};

const fmt = (n: number) => `$${Math.round(n).toLocaleString("es-AR")}`;

const CATEGORIAS: { value: string; label: string; icon: string }[] = [
  { value: "servicio", label: "Servicio", icon: "🔌" },
  { value: "alquiler", label: "Alquiler", icon: "🏠" },
  { value: "impuestos", label: "Impuestos", icon: "🧾" },
  { value: "contenido", label: "Contenido", icon: "🎬" },
  { value: "insumos", label: "Insumos", icon: "📦" },
  { value: "otro", label: "Otro", icon: "•" },
];

const catInfo = (v: string) => CATEGORIAS.find((c) => c.value === v) ?? CATEGORIAS[5];

export function ProveedoresList({
  slug,
  proveedores,
}: {
  slug: string;
  proveedores: ProveedorView[];
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [alta, setAlta] = useState(false);

  const activos = proveedores.filter((p) => p.activo);
  const totalMensual = activos.reduce((a, p) => a + p.montoMensual, 0);
  const hoy = Number(
    new Date().toLocaleDateString("en-CA", { timeZone: "America/Argentina/Buenos_Aires" }).slice(8, 10)
  );
  const proximos = activos.filter(
    (p) => p.diaPago != null && p.diaPago >= hoy && p.diaPago <= hoy + 7
  ).length;

  async function patch(id: string, body: Record<string, unknown>) {
    setBusyId(id);
    setError("");
    try {
      const res = await fetch(`/api/os/${slug}/proveedores/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "No se pudo guardar");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error de conexión");
    } finally {
      setBusyId(null);
    }
  }

  async function borrar(p: ProveedorView) {
    if (!window.confirm(`¿Borrar el proveedor ${p.nombre}?`)) return;
    setBusyId(p.id);
    try {
      const res = await fetch(`/api/os/${slug}/proveedores/${p.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "No se pudo borrar");
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <ButtonLink href={`/os/${slug}/caja`} variant="ghost" size="sm" className="mb-1 -ml-2">
            ← Finanzas
          </ButtonLink>
          <h1 className="text-2xl font-semibold">Proveedores</h1>
          <p className="text-sm text-muted-foreground">
            A quién le pagás todos los meses, cuánto y cuándo.
          </p>
        </div>
        <Button size="sm" onClick={() => setAlta((v) => !v)}>
          {alta ? "Cancelar" : "+ Proveedor"}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Stat label="Proveedores activos" value={String(activos.length)} />
        <Stat label="Gasto mensual" value={fmt(totalMensual)} hint="suma de abonos estimados" />
        <Stat
          label="Pagos próximos 7 días"
          value={String(proximos)}
          tone={proximos > 0 ? "warning" : "default"}
        />
      </div>

      {error ? <ErrorState message={error} /> : null}
      {alta ? (
        <AltaProveedor
          slug={slug}
          onDone={() => {
            setAlta(false);
            router.refresh();
          }}
          onError={setError}
        />
      ) : null}

      {proveedores.length === 0 && !alta ? (
        <EmptyState
          icon="🏭"
          title="Sin proveedores cargados"
          detail="Cargá a quién le pagás todos los meses: luz, alquileres, internet, monotributo…"
          action={<Button onClick={() => setAlta(true)}>+ Proveedor</Button>}
        />
      ) : (
        <Card className="divide-y p-0">
          {proveedores.map((p) => {
            const cat = catInfo(p.categoria);
            const busy = busyId === p.id;
            return (
              <div
                key={p.id}
                className={`flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2.5 text-sm sm:px-4 ${
                  !p.activo ? "opacity-50" : ""
                }`}
              >
                <span title={cat.label}>{cat.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    {p.nombre}
                    {!p.activo ? <Badge variant="outline" className="ml-2">Inactivo</Badge> : null}
                  </p>
                  {p.detalle ? (
                    <p className="truncate text-xs text-muted-foreground">{p.detalle}</p>
                  ) : null}
                </div>
                {p.diaPago ? (
                  <Badge variant={p.diaPago >= hoy && p.diaPago <= hoy + 7 ? "warning" : "default"}>
                    Se paga el {p.diaPago}
                  </Badge>
                ) : null}
                <span className="w-28 text-right font-semibold tabular-nums">
                  {p.montoMensual > 0 ? `${fmt(p.montoMensual)}/mes` : "—"}
                </span>
                {busy ? (
                  <Spinner className="text-muted-foreground" />
                ) : (
                  <span className="flex items-center gap-1">
                    {p.telefono ? (
                      <a
                        href={`https://wa.me/${p.telefono.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded px-1.5 py-0.5 text-xs hover:bg-muted"
                        title="WhatsApp"
                      >
                        💬
                      </a>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => {
                        const v = window.prompt(`Monto mensual de ${p.nombre}:`, String(p.montoMensual));
                        if (v !== null && !Number.isNaN(Number(v))) void patch(p.id, { montoMensual: Number(v) });
                      }}
                      className="rounded px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                      title="Cambiar monto"
                    >
                      ✏️
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const v = window.prompt(`Día del mes en que se paga ${p.nombre} (1-31):`, String(p.diaPago ?? ""));
                        if (v !== null) {
                          const n = Number(v);
                          void patch(p.id, { diaPago: v === "" || Number.isNaN(n) ? null : Math.min(31, Math.max(1, n)) });
                        }
                      }}
                      className="rounded px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                      title="Día de pago"
                    >
                      📅
                    </button>
                    <button
                      type="button"
                      onClick={() => void patch(p.id, { activo: !p.activo })}
                      className="rounded px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                      title={p.activo ? "Desactivar" : "Reactivar"}
                    >
                      {p.activo ? "⏸" : "▶"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void borrar(p)}
                      className="rounded px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-muted hover:text-destructive"
                      title="Borrar"
                    >
                      🗑️
                    </button>
                  </span>
                )}
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
}

function AltaProveedor({
  slug,
  onDone,
  onError,
}: {
  slug: string;
  onDone: () => void;
  onError: (m: string) => void;
}) {
  const [nombre, setNombre] = useState("");
  const [categoria, setCategoria] = useState("servicio");
  const [detalle, setDetalle] = useState("");
  const [monto, setMonto] = useState("");
  const [dia, setDia] = useState("");
  const [telefono, setTelefono] = useState("");
  const [busy, setBusy] = useState(false);

  async function crear() {
    if (!nombre.trim()) return onError("Falta el nombre");
    setBusy(true);
    onError("");
    try {
      const res = await fetch(`/api/os/${slug}/proveedores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nombre.trim(),
          categoria,
          detalle: detalle.trim() || undefined,
          telefono: telefono.trim() || undefined,
          montoMensual: Number(monto) || 0,
          diaPago: dia ? Math.min(31, Math.max(1, Number(dia))) : null,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "No se pudo crear");
      onDone();
    } catch (e) {
      onError(e instanceof Error ? e.message : "Error de conexión");
      setBusy(false);
    }
  }

  return (
    <Card className="flex flex-wrap items-center gap-2 p-3">
      <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre (ej: EDES)" className="h-9 w-44 text-sm" disabled={busy} />
      <Select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="h-9 w-36 text-sm" disabled={busy}>
        {CATEGORIAS.map((c) => (
          <option key={c.value} value={c.value}>{c.icon} {c.label}</option>
        ))}
      </Select>
      <Input value={detalle} onChange={(e) => setDetalle(e.target.value)} placeholder="Qué provee" className="h-9 w-48 text-sm" disabled={busy} />
      <Input type="number" min={0} step={1000} value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="$/mes" className="h-9 w-28 text-sm" disabled={busy} />
      <Input type="number" min={1} max={31} value={dia} onChange={(e) => setDia(e.target.value)} placeholder="Día" className="h-9 w-20 text-sm" title="Día de pago" disabled={busy} />
      <Input value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="Teléfono" className="h-9 w-32 text-sm" disabled={busy} />
      <Button size="sm" onClick={() => void crear()} disabled={busy || !nombre.trim()}>
        {busy ? <Spinner /> : null} Agregar
      </Button>
    </Card>
  );
}
