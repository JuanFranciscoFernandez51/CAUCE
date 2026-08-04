"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Ajustes } from "@/lib/ajustes";

const GRUPOS: { titulo: string; nota?: string; campos: { k: keyof Ajustes; label: string; tipo?: string; ancho?: string }[] }[] = [
  {
    titulo: "Datos de la empresa",
    nota: "Salen en el encabezado de cada propuesta.",
    campos: [
      { k: "razonSocial", label: "Razón social" },
      { k: "cuit", label: "CUIT" },
      { k: "email", label: "Email" },
      { k: "whatsapp", label: "WhatsApp (con código de país)" },
      { k: "web", label: "Web" },
      { k: "direccion", label: "Dirección" },
    ],
  },
  {
    titulo: "Valores por defecto",
    nota: "Con esto arranca cada presupuesto nuevo; después se ajusta por cliente.",
    campos: [
      { k: "setupBaseUsd", label: "Setup base (USD)", tipo: "number" },
      { k: "mensualBaseUsd", label: "Mensual base (USD)", tipo: "number" },
      { k: "precioComponenteUsd", label: "Precio por componente (USD)", tipo: "number" },
      { k: "dolarArs", label: "Dólar de referencia (ARS)", tipo: "number" },
      { k: "ivaPct", label: "IVA (%)", tipo: "number" },
      { k: "validezDias", label: "Validez de la propuesta (días)", tipo: "number" },
    ],
  },
  {
    titulo: "Textos que se repiten",
    campos: [
      { k: "condiciones", label: "Condiciones comerciales", ancho: "full" },
      { k: "firma", label: "Firma", ancho: "full" },
    ],
  },
];

export function ConfigForm({ inicial }: { inicial: Ajustes }) {
  const router = useRouter();
  const [datos, setDatos] = useState<Ajustes>(inicial);
  const [estado, setEstado] = useState<"" | "guardando" | "listo" | "error">("");

  async function guardar() {
    setEstado("guardando");
    const res = await fetch("/api/admin/ajustes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos),
    });
    setEstado(res.ok ? "listo" : "error");
    if (res.ok) router.refresh();
    setTimeout(() => setEstado(""), 2500);
  }

  const input =
    "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary";

  return (
    <div className="space-y-5">
      {GRUPOS.map((g) => (
        <section key={g.titulo} className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">{g.titulo}</h2>
          {g.nota ? <p className="mt-0.5 text-xs text-muted-foreground">{g.nota}</p> : null}
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {g.campos.map((c) => (
              <label key={c.k} className={c.ancho === "full" ? "sm:col-span-2 lg:col-span-3" : ""}>
                <span className="mb-1 block text-xs font-medium text-muted-foreground">{c.label}</span>
                {c.ancho === "full" ? (
                  <textarea
                    value={String(datos[c.k] ?? "")}
                    onChange={(e) => setDatos({ ...datos, [c.k]: e.target.value })}
                    rows={c.k === "condiciones" ? 3 : 1}
                    className={`${input} h-auto py-2`}
                  />
                ) : (
                  <input
                    type={c.tipo ?? "text"}
                    value={String(datos[c.k] ?? "")}
                    onChange={(e) =>
                      setDatos({ ...datos, [c.k]: c.tipo === "number" ? Number(e.target.value) : e.target.value })
                    }
                    className={input}
                  />
                )}
              </label>
            ))}
          </div>
        </section>
      ))}

      <div className="flex items-center gap-3">
        <button
          onClick={guardar}
          disabled={estado === "guardando"}
          className="h-10 rounded-lg bg-foreground px-5 text-sm font-medium text-background transition hover:opacity-90 disabled:opacity-50"
        >
          {estado === "guardando" ? "Guardando…" : "Guardar cambios"}
        </button>
        {estado === "listo" ? <span className="text-sm text-success">Guardado ✓</span> : null}
        {estado === "error" ? <span className="text-sm text-destructive">No se pudo guardar</span> : null}
      </div>
    </div>
  );
}
