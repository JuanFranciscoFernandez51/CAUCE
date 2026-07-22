"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge, Button, ButtonLink, Card, EmptyState, ErrorState, Input, Spinner, Stat } from "@/components/ui";

export type ContratoView = {
  id: string;
  contactId: string | null;
  nombre: string;
  telefono: string | null;
  slots: number;
  montoMensual: number;
  estado: string; // activo | pausado
};

export type PantallaView = {
  id: string;
  nombre: string;
  zona: string | null;
  medidas: string | null;
  resolucion: string | null;
  slotsTotal: number;
  activa: boolean;
  contratos: ContratoView[];
};

const fmt = (n: number) => `$${Math.round(n).toLocaleString("es-AR")}`;

/** Mensaje de aviso de cobro listo para WhatsApp. */
function msgCobro(nombre: string, monto: number, negocio = "Ave Fénix") {
  const mes = new Date().toLocaleDateString("es-AR", { month: "long", timeZone: "America/Argentina/Buenos_Aires" });
  return `Hola ${nombre.split(" ")[0]}! Te escribimos de ${negocio} 👋 Te pasamos el detalle de ${mes}: ${fmt(monto)} por tu pauta en pantallas. ¡Gracias por seguir con nosotros! Cualquier cosa estamos por acá.`;
}

export function PantallasBoard({
  slug,
  pantallas,
  contactos,
}: {
  slug: string;
  pantallas: PantallaView[];
  contactos: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [nueva, setNueva] = useState(false);

  const activas = pantallas.filter((p) => p.activa);
  const totalSlots = activas.reduce((a, p) => a + p.slotsTotal, 0);
  const ocupados = activas.reduce(
    (a, p) => a + p.contratos.filter((c) => c.estado === "activo").reduce((x, c) => x + c.slots, 0),
    0
  );
  const facturacion = pantallas.reduce(
    (a, p) => a + p.contratos.filter((c) => c.estado === "activo").reduce((x, c) => x + c.montoMensual, 0),
    0
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Pantallas LED</h1>
          <p className="text-sm text-muted-foreground">
            Disponibilidad del circuito y anunciantes por pantalla.
          </p>
        </div>
        <div className="flex gap-2">
          <ButtonLink href={`/os/${slug}/pantallas/clientes`} variant="secondary" size="sm">
            📇 Anunciantes
          </ButtonLink>
          <Button size="sm" onClick={() => setNueva((v) => !v)}>
            {nueva ? "Cancelar" : "+ Pantalla"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Pantallas" value={String(activas.length)} />
        <Stat label="Spots ocupados" value={`${ocupados}/${totalSlots}`} />
        <Stat
          label="Spots libres"
          value={String(totalSlots - ocupados)}
          tone={totalSlots - ocupados === 0 ? "destructive" : "success"}
        />
        <Stat label="Facturación mensual" value={fmt(facturacion)} hint="contratos activos" />
      </div>

      {error ? <ErrorState message={error} /> : null}
      {nueva ? (
        <NuevaPantalla
          slug={slug}
          onDone={() => {
            setNueva(false);
            router.refresh();
          }}
          onError={setError}
        />
      ) : null}

      {pantallas.length === 0 && !nueva ? (
        <EmptyState
          icon="🖥️"
          title="Sin pantallas cargadas"
          detail="Cargá la primera pantalla del circuito con su ubicación y capacidad."
          action={<Button onClick={() => setNueva(true)}>+ Pantalla</Button>}
        />
      ) : (
        pantallas.map((p) => (
          <PantallaCard key={p.id} slug={slug} pantalla={p} contactos={contactos} onError={setError} />
        ))
      )}
    </div>
  );
}

function PantallaCard({
  slug,
  pantalla,
  contactos,
  onError,
}: {
  slug: string;
  pantalla: PantallaView;
  contactos: { id: string; name: string }[];
  onError: (m: string) => void;
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [alta, setAlta] = useState(false);

  const activos = pantalla.contratos.filter((c) => c.estado === "activo");
  const usados = activos.reduce((a, c) => a + c.slots, 0);
  const libres = pantalla.slotsTotal - usados;
  const pct = Math.min(100, Math.round((usados / pantalla.slotsTotal) * 100));
  const mensual = activos.reduce((a, c) => a + c.montoMensual, 0);

  async function patchContrato(id: string, body: Record<string, unknown>) {
    setBusyId(id);
    onError("");
    try {
      const res = await fetch(`/api/os/${slug}/pantallas/contratos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "No se pudo guardar");
      router.refresh();
    } catch (e) {
      onError(e instanceof Error ? e.message : "Error de conexión");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Card className={`p-0 ${!pantalla.activa ? "opacity-60" : ""}`}>
      {/* Cabecera de la pantalla con ocupación */}
      <div className="flex flex-wrap items-center gap-3 border-b px-3 py-2.5 sm:px-4">
        <div className="min-w-0 flex-1">
          <p className="font-semibold">
            🖥️ {pantalla.nombre}
            {pantalla.zona ? (
              <span className="ml-2 text-xs font-normal text-muted-foreground">{pantalla.zona}</span>
            ) : null}
          </p>
          <p className="text-xs text-muted-foreground">
            {[pantalla.medidas, pantalla.resolucion].filter(Boolean).join(" · ")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-32">
            <div className="mb-0.5 flex justify-between text-[10px] text-muted-foreground">
              <span>{usados}/{pantalla.slotsTotal} spots</span>
              <span>{pct}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full ${pct >= 100 ? "bg-destructive" : pct >= 80 ? "bg-warning" : "bg-success"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
          <Badge variant={libres === 0 ? "destructive" : libres <= 5 ? "warning" : "success"}>
            {libres === 0 ? "Completa" : `${libres} libres`}
          </Badge>
          <span className="text-sm font-semibold tabular-nums">{fmt(mensual)}/mes</span>
          <Button variant="secondary" size="sm" onClick={() => setAlta((v) => !v)}>
            {alta ? "Cancelar" : "+ Anunciante"}
          </Button>
        </div>
      </div>

      {alta ? (
        <AltaContrato
          slug={slug}
          pantallaId={pantalla.id}
          contactos={contactos}
          libres={libres}
          onDone={() => {
            setAlta(false);
            router.refresh();
          }}
          onError={onError}
        />
      ) : null}

      <div className="divide-y">
        {pantalla.contratos.length === 0 ? (
          <p className="px-4 py-3 text-sm text-muted-foreground">Sin anunciantes todavía.</p>
        ) : (
          pantalla.contratos.map((c) => (
            <div
              key={c.id}
              className={`flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 text-sm sm:px-4 ${
                c.estado === "pausado" ? "opacity-50" : ""
              }`}
            >
              {c.contactId ? (
                <Link
                  href={`/os/${slug}/crm/${c.contactId}`}
                  className="font-medium hover:text-primary hover:underline"
                >
                  {c.nombre}
                </Link>
              ) : (
                <span className="font-medium">{c.nombre}</span>
              )}
              {c.estado === "pausado" ? <Badge variant="outline">Pausado</Badge> : null}
              <span className="text-xs text-muted-foreground">
                {c.slots} spot{c.slots === 1 ? "" : "s"}
              </span>
              <span className="ml-auto tabular-nums">{fmt(c.montoMensual)}/mes</span>
              {busyId === c.id ? (
                <Spinner className="text-muted-foreground" />
              ) : (
                <span className="flex items-center gap-1">
                  {c.telefono ? (
                    <a
                      href={`https://wa.me/${c.telefono.replace(/\D/g, "")}?text=${encodeURIComponent(msgCobro(c.nombre, c.montoMensual))}`}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded px-1.5 py-0.5 text-xs hover:bg-muted"
                      title="Aviso de cobro por WhatsApp"
                    >
                      💬
                    </a>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => {
                      const v = window.prompt(`Monto mensual de ${c.nombre}:`, String(c.montoMensual));
                      if (v && !Number.isNaN(Number(v))) void patchContrato(c.id, { montoMensual: Number(v) });
                    }}
                    className="rounded px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                    title="Cambiar monto"
                  >
                    ✏️
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      void patchContrato(c.id, { estado: c.estado === "activo" ? "pausado" : "activo" })
                    }
                    className="rounded px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                    title={c.estado === "activo" ? "Pausar" : "Reactivar"}
                  >
                    {c.estado === "activo" ? "⏸" : "▶"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`¿Dar de baja a ${c.nombre} de esta pantalla?`)) {
                        void patchContrato(c.id, { estado: "baja" });
                      }
                    }}
                    className="rounded px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-muted hover:text-destructive"
                    title="Baja"
                  >
                    🗑️
                  </button>
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

function AltaContrato({
  slug,
  pantallaId,
  contactos,
  libres,
  onDone,
  onError,
}: {
  slug: string;
  pantallaId: string;
  contactos: { id: string; name: string }[];
  libres: number;
  onDone: () => void;
  onError: (m: string) => void;
}) {
  const [nombre, setNombre] = useState("");
  const [slots, setSlots] = useState(1);
  const [monto, setMonto] = useState("");
  const [busy, setBusy] = useState(false);

  async function crear() {
    if (!nombre.trim()) return onError("Falta el anunciante");
    setBusy(true);
    onError("");
    try {
      const match = contactos.find((c) => c.name.toLowerCase() === nombre.trim().toLowerCase());
      const res = await fetch(`/api/os/${slug}/pantallas/${pantallaId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contrato: true,
          contactId: match?.id ?? null,
          nombreCliente: match ? undefined : nombre.trim(),
          slots,
          montoMensual: Number(monto) || 0,
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
    <div className="flex flex-wrap items-center gap-2 border-b bg-muted/40 px-3 py-2 sm:px-4">
      <Input
        list={`contactos-${pantallaId}`}
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        placeholder="Anunciante (existente o nuevo)"
        className="h-8 w-56 text-sm"
        disabled={busy}
      />
      <datalist id={`contactos-${pantallaId}`}>
        {contactos.map((c) => (
          <option key={c.id} value={c.name} />
        ))}
      </datalist>
      <Input
        type="number"
        min={1}
        max={libres}
        value={slots}
        onChange={(e) => setSlots(Number(e.target.value))}
        className="h-8 w-20 text-sm"
        title="Spots"
        disabled={busy}
      />
      <span className="text-xs text-muted-foreground">spots</span>
      <Input
        type="number"
        min={0}
        step={1000}
        value={monto}
        onChange={(e) => setMonto(e.target.value)}
        placeholder="$/mes"
        className="h-8 w-32 text-sm"
        disabled={busy}
      />
      <Button size="sm" onClick={() => void crear()} disabled={busy || !nombre.trim()}>
        {busy ? <Spinner /> : null} Agregar
      </Button>
    </div>
  );
}

function NuevaPantalla({
  slug,
  onDone,
  onError,
}: {
  slug: string;
  onDone: () => void;
  onError: (m: string) => void;
}) {
  const [nombre, setNombre] = useState("");
  const [zona, setZona] = useState("");
  const [medidas, setMedidas] = useState("");
  const [slotsTotal, setSlotsTotal] = useState(30);
  const [busy, setBusy] = useState(false);

  async function crear() {
    if (!nombre.trim()) return onError("Falta la ubicación");
    setBusy(true);
    onError("");
    try {
      const res = await fetch(`/api/os/${slug}/pantallas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nombre.trim(),
          zona: zona.trim() || undefined,
          medidas: medidas.trim() || undefined,
          slotsTotal,
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
      <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ubicación (ej: Alsina y Sarmiento)" className="h-9 w-64 text-sm" disabled={busy} />
      <Input value={zona} onChange={(e) => setZona(e.target.value)} placeholder="Zona" className="h-9 w-36 text-sm" disabled={busy} />
      <Input value={medidas} onChange={(e) => setMedidas(e.target.value)} placeholder="Medidas (5x3 m)" className="h-9 w-32 text-sm" disabled={busy} />
      <Input type="number" min={1} value={slotsTotal} onChange={(e) => setSlotsTotal(Number(e.target.value))} className="h-9 w-24 text-sm" title="Spots totales" disabled={busy} />
      <span className="text-xs text-muted-foreground">spots</span>
      <Button size="sm" onClick={() => void crear()} disabled={busy || !nombre.trim()}>
        {busy ? <Spinner /> : null} Crear pantalla
      </Button>
    </Card>
  );
}
