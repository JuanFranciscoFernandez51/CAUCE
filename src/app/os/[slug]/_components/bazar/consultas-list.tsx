"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, EmptyState, ErrorState } from "@/components/ui";
import { relativeTime } from "../../_lib/dates";

export type ConsultaRow = {
  id: string;
  nombre: string;
  contacto: string;
  mensaje: string;
  estado: string;
  fecha: string;
  producto: string | null;
  productoSlug: string | null;
};

/** Bandeja de consultas: filtro NUEVA/RESPONDIDA, responder por wa.me 1-click. */
export function ConsultasList({ slug, consultas }: { slug: string; consultas: ConsultaRow[] }) {
  const router = useRouter();
  const [filtro, setFiltro] = useState<"NUEVA" | "RESPONDIDA" | "TODAS">("NUEVA");
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const visibles = consultas.filter((c) => filtro === "TODAS" || c.estado === filtro);
  const nuevas = consultas.filter((c) => c.estado === "NUEVA").length;

  async function marcar(c: ConsultaRow, estado: "NUEVA" | "RESPONDIDA") {
    setBusyId(c.id);
    setError("");
    try {
      const res = await fetch(`/api/os/${slug}/bazar/consultas/${c.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setError("No se pudo actualizar la consulta");
    } finally {
      setBusyId(null);
    }
  }

  function waDe(c: ConsultaRow): string | null {
    const digitos = c.contacto.replace(/\D/g, "");
    if (c.contacto.includes("@") || digitos.length < 8) return null;
    const numero = digitos.startsWith("549") ? digitos : `549${digitos.replace(/^0/, "")}`;
    const texto = `¡Hola ${c.nombre.split(" ")[0]}! Te escribimos de la tienda por tu consulta${c.producto ? ` sobre "${c.producto}"` : ""}. `;
    return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
  }

  return (
    <div className="space-y-3">
      {error ? <ErrorState message={error} /> : null}
      <div className="flex gap-1.5">
        {(
          [
            ["NUEVA", `Nuevas (${nuevas})`],
            ["RESPONDIDA", "Respondidas"],
            ["TODAS", "Todas"],
          ] as const
        ).map(([v, l]) => (
          <button
            key={v}
            type="button"
            onClick={() => setFiltro(v)}
            className={`rounded-full border px-3 py-1 text-sm ${filtro === v ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"}`}
          >
            {l}
          </button>
        ))}
      </div>

      {visibles.length === 0 ? (
        <EmptyState
          icon="💬"
          title={filtro === "NUEVA" ? "Bandeja al día 🎉" : "Nada por acá"}
          detail={filtro === "NUEVA" ? "No hay consultas sin responder." : undefined}
        />
      ) : (
        <ul className="space-y-2">
          {visibles.map((c) => {
            const wa = waDe(c);
            return (
              <li
                key={c.id}
                className={`rounded-lg border bg-card p-3 ${busyId === c.id ? "opacity-60" : ""}`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{c.nombre}</span>
                  <span className="text-sm text-muted-foreground">{c.contacto}</span>
                  <Badge variant={c.estado === "NUEVA" ? "warning" : "success"}>
                    {c.estado === "NUEVA" ? "Nueva" : "Respondida"}
                  </Badge>
                  {c.producto ? (
                    c.productoSlug ? (
                      <Link
                        href={`/sitio/${slug}/producto/${c.productoSlug}`}
                        target="_blank"
                        className="text-xs text-primary hover:underline"
                      >
                        🛍️ {c.producto}
                      </Link>
                    ) : (
                      <span className="text-xs text-muted-foreground">🛍️ {c.producto}</span>
                    )
                  ) : null}
                  <span className="ml-auto text-xs text-muted-foreground">
                    {relativeTime(c.fecha)}
                  </span>
                </div>
                <p className="mt-1.5 whitespace-pre-line text-sm text-muted-foreground">
                  {c.mensaje}
                </p>
                <div className="mt-2 flex gap-2">
                  {wa ? (
                    <a
                      href={wa}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => {
                        if (c.estado === "NUEVA") void marcar(c, "RESPONDIDA");
                      }}
                      className="rounded-md bg-[#25D366] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
                    >
                      💬 Responder por WhatsApp
                    </a>
                  ) : (
                    <a
                      href={`mailto:${c.contacto}`}
                      onClick={() => {
                        if (c.estado === "NUEVA") void marcar(c, "RESPONDIDA");
                      }}
                      className="rounded-md border px-3 py-1.5 text-xs font-semibold hover:bg-muted"
                    >
                      ✉️ Responder por email
                    </a>
                  )}
                  {c.estado === "NUEVA" ? (
                    <button
                      type="button"
                      onClick={() => marcar(c, "RESPONDIDA")}
                      className="rounded-md border px-3 py-1.5 text-xs font-semibold hover:bg-muted"
                    >
                      ✓ Marcar respondida
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => marcar(c, "NUEVA")}
                      className="rounded-md px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted"
                    >
                      Reabrir
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
