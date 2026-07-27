"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";

/**
 * Importador CSV del catálogo (para migrar los 6.000 productos del cliente).
 * Columnas: nombre, categoria, precio, stock, sku (con o sin encabezado).
 * Parsea en el navegador y manda las filas al server en un solo POST.
 */

type Fila = { nombre: string; categoria: string; precio: number; stock: number; sku: string };

function parseCsv(texto: string): Fila[] {
  const filas: Fila[] = [];
  const lineas = texto.split(/\r?\n/).filter((l) => l.trim());
  for (const linea of lineas) {
    // separador coma o punto y coma; respeta comillas simples de Excel
    const sep = linea.includes(";") && !linea.includes(",") ? ";" : ",";
    const celdas: string[] = [];
    let actual = "";
    let enComillas = false;
    for (const ch of linea) {
      if (ch === '"') enComillas = !enComillas;
      else if (ch === sep && !enComillas) {
        celdas.push(actual);
        actual = "";
      } else actual += ch;
    }
    celdas.push(actual);
    const [nombre, categoria, precioRaw, stockRaw, sku] = celdas.map((c) => c.trim());
    const precio = Number.parseInt((precioRaw ?? "").replace(/[^\d]/g, ""), 10);
    if (!nombre || !categoria || !Number.isFinite(precio)) continue; // encabezado o fila rota
    filas.push({
      nombre,
      categoria,
      precio,
      stock: Number.parseInt((stockRaw ?? "").replace(/[^\d]/g, ""), 10) || 0,
      sku: sku ?? "",
    });
  }
  return filas;
}

export function ImportarCsv({ slug }: { slug: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [estado, setEstado] = useState<"idle" | "subiendo" | "ok" | "error">("idle");
  const [detalle, setDetalle] = useState("");

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setEstado("subiendo");
    setDetalle("Leyendo el archivo…");
    try {
      const filas = parseCsv(await file.text());
      if (filas.length === 0) {
        throw new Error("No encontramos filas válidas (esperamos: nombre, categoria, precio, stock, sku)");
      }
      setDetalle(`Importando ${filas.length.toLocaleString("es-AR")} productos…`);
      const res = await fetch(`/api/os/${slug}/bazar/productos/importar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filas }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "No se pudo importar");
      setEstado("ok");
      setDetalle(`✅ ${data.creados.toLocaleString("es-AR")} productos importados`);
      router.refresh();
      setTimeout(() => setEstado("idle"), 4000);
    } catch (err) {
      setEstado("error");
      setDetalle(err instanceof Error ? err.message : "Error al importar");
      setTimeout(() => setEstado("idle"), 6000);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {estado !== "idle" ? (
        <span
          className={`max-w-64 truncate text-xs ${estado === "error" ? "text-destructive" : "text-muted-foreground"}`}
          title={detalle}
        >
          {detalle}
        </span>
      ) : null}
      <input ref={inputRef} type="file" accept=".csv,text/csv" hidden onChange={onFile} />
      <Button
        variant="secondary"
        disabled={estado === "subiendo"}
        onClick={() => inputRef.current?.click()}
        title="CSV con columnas: nombre, categoria, precio, stock, sku"
      >
        📄 Importar CSV
      </Button>
    </div>
  );
}
