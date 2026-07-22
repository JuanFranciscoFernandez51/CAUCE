"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Badge, ButtonLink, Card, EmptyState, Input, Stat } from "@/components/ui";

export type ClientePantallasView = {
  contactId: string | null;
  nombre: string;
  telefono: string | null;
  email: string | null;
  notas: string | null;
  pantallas: { nombre: string; slots: number; monto: number; estado: string }[];
  totalSlots: number;
  totalMensual: number;
  pausados: number;
};

const fmt = (n: number) => `$${Math.round(n).toLocaleString("es-AR")}`;

function waCobro(nombre: string, monto: number): string {
  const mes = new Date().toLocaleDateString("es-AR", {
    month: "long",
    timeZone: "America/Argentina/Buenos_Aires",
  });
  return `Hola ${nombre.split(" ")[0]}! Te pasamos el detalle de ${mes}: ${fmt(monto)} por tu pauta en pantallas. ¡Gracias por seguir con nosotros!`;
}

export function ClientesPantallas({
  slug,
  clientes,
}: {
  slug: string;
  clientes: ClientePantallasView[];
}) {
  const [q, setQ] = useState("");

  const filtrados = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return clientes;
    return clientes.filter(
      (c) =>
        c.nombre.toLowerCase().includes(t) ||
        c.pantallas.some((p) => p.nombre.toLowerCase().includes(t))
    );
  }, [q, clientes]);

  const totalMensual = clientes.reduce((a, c) => a + c.totalMensual, 0);
  const sinMonto = clientes.filter((c) => c.totalMensual === 0).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Anunciantes</h1>
          <p className="text-sm text-muted-foreground">
            Todos los clientes del circuito con sus pantallas, spots y abono mensual.
          </p>
        </div>
        <ButtonLink href={`/os/${slug}/pantallas`} variant="secondary" size="sm">
          🖥️ Por pantalla
        </ButtonLink>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Anunciantes" value={String(clientes.length)} />
        <Stat label="Facturación mensual" value={fmt(totalMensual)} />
        <Stat
          label="Sin monto definido"
          value={String(sinMonto)}
          tone={sinMonto > 0 ? "warning" : "success"}
          hint={sinMonto > 0 ? "revisar contratos en $0" : "todo cargado"}
        />
        <Stat
          label="Promedio por cliente"
          value={clientes.length ? fmt(totalMensual / clientes.filter((c) => c.totalMensual > 0).length) : "—"}
        />
      </div>

      <Input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar por cliente o pantalla…"
        className="max-w-md"
        aria-label="Buscar anunciantes"
      />

      {filtrados.length === 0 ? (
        <EmptyState icon="📇" title="No hay anunciantes para mostrar" />
      ) : (
        <div className="space-y-2">
          {filtrados.map((c) => (
            <Card key={c.contactId ?? c.nombre} className="p-3 sm:p-4">
              <div className="flex flex-wrap items-start gap-3">
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    {c.contactId ? (
                      <Link
                        href={`/os/${slug}/crm/${c.contactId}`}
                        className="font-semibold hover:text-primary hover:underline"
                      >
                        {c.nombre}
                      </Link>
                    ) : (
                      <span className="font-semibold">{c.nombre}</span>
                    )}
                    {c.notas?.toLowerCase().includes("factura: no") ? (
                      <Badge variant="outline">Sin factura</Badge>
                    ) : c.notas?.toLowerCase().includes("factura") ? (
                      <Badge variant="success">Factura</Badge>
                    ) : null}
                    {c.notas?.toLowerCase().includes("agencia") ? (
                      <Badge variant="primary">Agencia</Badge>
                    ) : null}
                    {c.pausados > 0 ? (
                      <Badge variant="warning">{c.pausados} pausado{c.pausados === 1 ? "" : "s"}</Badge>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {c.pantallas.map((p, i) => (
                      <span
                        key={i}
                        className={`rounded-full border px-2.5 py-0.5 text-xs ${
                          p.estado === "pausado" ? "opacity-50" : ""
                        }`}
                        title={`${p.slots} spot${p.slots === 1 ? "" : "s"} · ${fmt(p.monto)}/mes`}
                      >
                        {p.nombre}
                        <span className="ml-1 text-muted-foreground">×{p.slots}</span>
                      </span>
                    ))}
                  </div>
                  {c.telefono || c.email ? (
                    <p className="text-xs text-muted-foreground">
                      {[c.telefono, c.email].filter(Boolean).join(" · ")}
                    </p>
                  ) : (
                    <p className="text-xs text-warning">Sin teléfono cargado — completar en el CRM</p>
                  )}
                  {c.notas ? <p className="text-xs text-muted-foreground">{c.notas}</p> : null}
                </div>

                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <p className="text-lg font-semibold tabular-nums">
                    {c.totalMensual > 0 ? `${fmt(c.totalMensual)}/mes` : "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {c.totalSlots} spot{c.totalSlots === 1 ? "" : "s"} · {c.pantallas.length} pantalla
                    {c.pantallas.length === 1 ? "" : "s"}
                  </p>
                  <div className="flex gap-1.5">
                    {c.telefono && c.totalMensual > 0 ? (
                      <a
                        href={`https://wa.me/${c.telefono.replace(/\D/g, "")}?text=${encodeURIComponent(waCobro(c.nombre, c.totalMensual))}`}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-md border bg-card px-2.5 py-1 text-xs hover:bg-muted"
                        title="Aviso de cobro por WhatsApp"
                      >
                        💬 Cobro
                      </a>
                    ) : null}
                    {c.contactId ? (
                      <Link
                        href={`/os/${slug}/crm/${c.contactId}`}
                        className="rounded-md border bg-card px-2.5 py-1 text-xs hover:bg-muted"
                      >
                        Ficha →
                      </Link>
                    ) : null}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
