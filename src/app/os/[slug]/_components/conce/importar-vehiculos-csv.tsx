"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";

/**
 * Import de stock por CSV (parseo en el cliente, filas a la API).
 * Columnas esperadas (con encabezado): marca, modelo, version, anio, km,
 * precio, moneda, condicion, tipo, transmision, combustible, color, dominio,
 * descripcion. Separador coma o punto y coma.
 */
export function ImportarVehiculosCsv({ slug }: { slug: string }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [estado, setEstado] = useState<"idle" | "subiendo" | "ok" | "error">("idle");
  const [detalle, setDetalle] = useState("");

  function parseCsv(texto: string): Record<string, string>[] {
    const lineas = texto
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (lineas.length < 2) return [];
    const sep = lineas[0].includes(";") ? ";" : ",";
    const headers = lineas[0].split(sep).map((h) => h.trim().toLowerCase().replace(/"/g, ""));
    return lineas.slice(1).map((linea) => {
      const celdas = linea.split(sep).map((c) => c.trim().replace(/^"|"$/g, ""));
      const fila: Record<string, string> = {};
      headers.forEach((h, i) => {
        fila[h] = celdas[i] ?? "";
      });
      return fila;
    });
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setEstado("subiendo");
    setDetalle("");
    try {
      const texto = await file.text();
      const filasRaw = parseCsv(texto);
      const filas = filasRaw
        .filter((f) => f.marca && f.modelo && f.anio)
        .slice(0, 200)
        .map((f) => ({
          marca: f.marca,
          modelo: f.modelo,
          version: f.version ?? "",
          anio: Number(f.anio) || 0,
          km: Number((f.km ?? "0").replace(/\./g, "")) || 0,
          precio: Number((f.precio ?? "0").replace(/\./g, "")) || 0,
          moneda: (f.moneda ?? "ARS").toUpperCase() === "USD" ? "USD" : "ARS",
          condicion: (f.condicion ?? "").toLowerCase() === "0km" ? "0km" : "usado",
          tipo: f.tipo || "sedan",
          transmision: f.transmision ?? "",
          combustible: f.combustible ?? "",
          color: f.color ?? "",
          dominio: f.dominio ?? "",
          descripcion: f.descripcion ?? "",
        }));
      if (filas.length === 0) throw new Error("No encontramos filas válidas (marca, modelo y año son obligatorios)");

      const res = await fetch(`/api/os/${slug}/conce/vehiculos/importar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filas }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "No se pudo importar");
      setEstado("ok");
      setDetalle(`✅ ${data.creados} vehículos importados`);
      router.refresh();
    } catch (err) {
      setEstado("error");
      setDetalle(err instanceof Error ? err.message : "Error leyendo el CSV");
    }
  }

  return (
    <span className="inline-flex items-center gap-2">
      <input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={onFile} />
      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={estado === "subiendo"}
        onClick={() => fileRef.current?.click()}
        title="CSV con columnas: marca, modelo, version, anio, km, precio, moneda, condicion, tipo…"
      >
        {estado === "subiendo" ? "Importando…" : "📄 Importar CSV"}
      </Button>
      {detalle ? (
        <span className={`text-xs ${estado === "error" ? "text-destructive" : "text-success"}`}>
          {detalle}
        </span>
      ) : null}
    </span>
  );
}
