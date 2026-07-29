"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Card } from "@/components/ui";
import {
  diasHasta,
  fmtFecha,
  fmtPlata,
  mensajeAvisoCuota,
  numeroFinanciacion,
  waLink,
} from "@/lib/conce-fin";

export type AvisoRow = {
  cuotaId: string;
  financiacionId: string;
  numeroFin: number;
  numeroCuota: number;
  cantidadCuotas: number;
  cliente: string;
  telefono: string | null;
  descripcion: string | null;
  /** YYYY-MM-DD (hora Argentina) */
  vencIso: string;
  saldo: number;
  moneda: string;
  avisado: boolean;
};

/**
 * Bandeja "PARA AVISAR HOY": las cuotas que vencen dentro de 3 días y las que
 * ya están vencidas, con el WhatsApp escrito. Se toca el botón, se manda y
 * queda marcado que ya se avisó.
 */
export function AvisosCuotas({
  slug,
  avisos,
  negocio,
}: {
  slug: string;
  avisos: AvisoRow[];
  negocio?: string;
}) {
  const router = useRouter();
  const [marcando, setMarcando] = useState<string | null>(null);

  if (avisos.length === 0) {
    return (
      <Card className="border-success/30 bg-success/5 p-4 text-sm">
        <p className="font-medium">✅ Hoy no hay nada para avisar.</p>
        <p className="text-muted-foreground">
          Ninguna cuota vence en los próximos 3 días ni quedó vencida.
        </p>
      </Card>
    );
  }

  async function marcarAvisado(cuotaId: string) {
    setMarcando(cuotaId);
    try {
      await fetch(`/api/os/${slug}/conce/cuotas/${cuotaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion: "avisado" }),
      });
      router.refresh();
    } finally {
      setMarcando(null);
    }
  }

  const vencidas = avisos.filter((a) => diasHasta(new Date(`${a.vencIso}T12:00:00-03:00`)) < 0);
  const porVencer = avisos.filter((a) => diasHasta(new Date(`${a.vencIso}T12:00:00-03:00`)) >= 0);

  const fila = (a: AvisoRow) => {
    const venc = new Date(`${a.vencIso}T12:00:00-03:00`);
    const dias = diasHasta(venc);
    const mensaje = mensajeAvisoCuota({
      nombre: a.cliente,
      numeroCuota: a.numeroCuota,
      cantidadCuotas: a.cantidadCuotas,
      vehiculo: a.descripcion,
      fechaVencimiento: venc,
      saldo: a.saldo,
      moneda: a.moneda,
      negocio,
    });
    return (
      <div
        key={a.cuotaId}
        className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-lg border bg-card px-3 py-2.5"
      >
        <div className="min-w-48 flex-1">
          <p className="text-sm font-medium">
            {a.cliente}
            <span className="ml-1.5 font-normal text-muted-foreground">
              · cuota {a.numeroCuota}/{a.cantidadCuotas}
            </span>
          </p>
          <p className="text-xs text-muted-foreground">
            <Link
              href={`/os/${slug}/financiaciones/${a.financiacionId}`}
              className="font-mono hover:text-primary"
            >
              {numeroFinanciacion(a.numeroFin)}
            </Link>
            {a.descripcion ? ` · ${a.descripcion}` : ""} · vence {fmtFecha(venc)}
          </p>
        </div>
        <Badge variant={dias < 0 ? "destructive" : dias <= 1 ? "warning" : "primary"}>
          {dias < 0
            ? `vencida hace ${Math.abs(dias)} día${Math.abs(dias) === 1 ? "" : "s"}`
            : dias === 0
              ? "vence hoy"
              : dias === 1
                ? "vence mañana"
                : `en ${dias} días`}
        </Badge>
        <span className="text-sm font-semibold">{fmtPlata(a.saldo, a.moneda)}</span>
        {a.avisado ? <span className="text-xs text-muted-foreground">ya avisado</span> : null}
        {a.telefono ? (
          <a
            href={waLink(a.telefono, mensaje)}
            target="_blank"
            rel="noreferrer"
            onClick={() => void marcarAvisado(a.cuotaId)}
            className="inline-flex h-8 items-center rounded-md bg-primary px-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            {marcando === a.cuotaId ? "…" : "💬 Avisar"}
          </a>
        ) : (
          <span className="text-xs text-muted-foreground">sin teléfono</span>
        )}
      </div>
    );
  };

  return (
    <Card className="space-y-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Para avisar hoy ({avisos.length})
        </h2>
        <p className="text-xs text-muted-foreground">
          Vencen dentro de 3 días o ya vencieron. El mensaje va escrito.
        </p>
      </div>
      {vencidas.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-destructive">
            Vencidas ({vencidas.length})
          </p>
          {vencidas.map(fila)}
        </div>
      ) : null}
      {porVencer.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Vencen en los próximos 3 días ({porVencer.length})
          </p>
          {porVencer.map(fila)}
        </div>
      ) : null}
    </Card>
  );
}
