"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, EmptyState } from "@/components/ui";

export type ConsultaConceRow = {
  id: string;
  nombre: string;
  contacto: string;
  mensaje: string;
  estado: string;
  origen: string;
  fecha: string;
  vehiculo: string | null;
  vehiculoSlug: string | null;
};

/**
 * Bandeja de consultas de la concesionaria: responder por WhatsApp a 1 click
 * (mensaje armado) y marcar respondida.
 */
export function ConsultasConceList({
  slug,
  consultas,
}: {
  slug: string;
  consultas: ConsultaConceRow[];
}) {
  const router = useRouter();
  const [filtro, setFiltro] = useState<"todas" | "NUEVA" | "RESPONDIDA">("todas");
  const [busyId, setBusyId] = useState<string | null>(null);

  const visibles = consultas.filter((c) => filtro === "todas" || c.estado === filtro);

  async function marcar(id: string, estado: "NUEVA" | "RESPONDIDA") {
    setBusyId(id);
    try {
      await fetch(`/api/os/${slug}/conce/consultas/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado }),
      });
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  function waLink(c: ConsultaConceRow): string | null {
    const tel = c.contacto.replace(/\D/g, "");
    if (tel.length < 8 || c.contacto.includes("@")) return null;
    const numero = tel.startsWith("549") ? tel : `549${tel}`;
    const texto = `Hola ${c.nombre.split(" ")[0]}! Te escribimos de Ri Cars Automotores por tu consulta${c.vehiculo ? ` sobre el ${c.vehiculo}` : ""}. `;
    return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
  }

  const nuevas = consultas.filter((c) => c.estado === "NUEVA").length;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["todas", `Todas · ${consultas.length}`],
            ["NUEVA", `Nuevas · ${nuevas}`],
            ["RESPONDIDA", `Respondidas · ${consultas.length - nuevas}`],
          ] as const
        ).map(([valor, label]) => (
          <button
            key={valor}
            type="button"
            onClick={() => setFiltro(valor)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              filtro === valor ? "bg-primary text-primary-foreground" : "border hover:bg-muted"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {visibles.length === 0 ? (
        <EmptyState icon="💬" title="Sin consultas acá" detail="Cuando escriban desde la web, aparecen en esta bandeja." />
      ) : (
        <ul className="space-y-2.5">
          {visibles.map((c) => {
            const wa = waLink(c);
            return (
              <li
                key={c.id}
                className={`rounded-lg border bg-card p-4 ${busyId === c.id ? "opacity-60" : ""} ${
                  c.estado === "NUEVA" ? "border-warning/50" : ""
                }`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{c.nombre}</span>
                  <span className="text-sm text-muted-foreground">{c.contacto}</span>
                  {c.origen === "chatbot" ? <Badge variant="primary">🤖 chatbot</Badge> : null}
                  <Badge variant={c.estado === "NUEVA" ? "warning" : "success"}>
                    {c.estado === "NUEVA" ? "Nueva" : "Respondida"}
                  </Badge>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {new Date(c.fecha).toLocaleDateString("es-AR")}
                  </span>
                </div>
                {c.vehiculo ? (
                  <p className="mt-1 text-sm">
                    🚗{" "}
                    {c.vehiculoSlug ? (
                      <Link
                        href={`/sitio/${slug}/vehiculo/${c.vehiculoSlug}`}
                        target="_blank"
                        className="font-medium text-primary hover:underline"
                      >
                        {c.vehiculo}
                      </Link>
                    ) : (
                      <span className="font-medium">{c.vehiculo}</span>
                    )}
                  </p>
                ) : null}
                <p className="mt-1.5 whitespace-pre-line text-sm text-muted-foreground">{c.mensaje}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {wa ? (
                    <a
                      href={wa}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-8 items-center rounded-md bg-[#25D366] px-3 text-sm font-semibold text-white hover:opacity-90"
                    >
                      💬 Responder por WhatsApp
                    </a>
                  ) : c.contacto.includes("@") ? (
                    <a
                      href={`mailto:${c.contacto}`}
                      className="inline-flex h-8 items-center rounded-md border px-3 text-sm font-medium hover:bg-muted"
                    >
                      ✉️ Responder por email
                    </a>
                  ) : null}
                  {c.estado === "NUEVA" ? (
                    <button
                      type="button"
                      onClick={() => marcar(c.id, "RESPONDIDA")}
                      className="inline-flex h-8 items-center rounded-md border px-3 text-sm font-medium hover:bg-muted"
                    >
                      ✔ Marcar respondida
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => marcar(c.id, "NUEVA")}
                      className="inline-flex h-8 items-center rounded-md px-2 text-xs text-muted-foreground hover:underline"
                    >
                      Volver a &quot;nueva&quot;
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
