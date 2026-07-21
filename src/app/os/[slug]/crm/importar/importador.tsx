"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, ButtonLink, Card, ErrorState, Select, Spinner, Textarea } from "@/components/ui";

type Campo = "name" | "phone" | "email" | "notes" | "ignorar";
const CAMPOS: { value: Campo; label: string }[] = [
  { value: "name", label: "Nombre" },
  { value: "phone", label: "Teléfono" },
  { value: "email", label: "Email" },
  { value: "notes", label: "Notas" },
  { value: "ignorar", label: "(ignorar)" },
];

/** Parser simple: detecta tab / ; / , y respeta comillas dobles. */
function parsear(texto: string): string[][] {
  const lineas = texto.split(/\r?\n/).filter((l) => l.trim());
  if (lineas.length === 0) return [];
  const primera = lineas[0];
  const delim = primera.includes("\t") ? "\t" : primera.includes(";") ? ";" : ",";
  return lineas.map((linea) => {
    const celdas: string[] = [];
    let actual = "";
    let enComillas = false;
    for (let i = 0; i < linea.length; i++) {
      const ch = linea[i];
      if (ch === '"') {
        if (enComillas && linea[i + 1] === '"') {
          actual += '"';
          i++;
        } else enComillas = !enComillas;
      } else if (ch === delim && !enComillas) {
        celdas.push(actual.trim());
        actual = "";
      } else actual += ch;
    }
    celdas.push(actual.trim());
    return celdas;
  });
}

/** Adivina el campo por el nombre de la columna. */
function adivinar(header: string): Campo {
  const h = header.toLowerCase();
  if (/(nombre|name|cliente|contacto|razon)/.test(h)) return "name";
  if (/(tel|cel|whats|phone|movil|móvil)/.test(h)) return "phone";
  if (/(mail|correo)/.test(h)) return "email";
  if (/(nota|observ|coment|detalle)/.test(h)) return "notes";
  return "ignorar";
}

export function Importador({ slug }: { slug: string }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [texto, setTexto] = useState("");
  const [mapa, setMapa] = useState<Campo[]>([]);
  const [conHeader, setConHeader] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [resultado, setResultado] = useState<{ creados: number; duplicados: number } | null>(null);

  const filas = useMemo(() => parsear(texto), [texto]);
  const columnas = filas[0]?.length ?? 0;

  // Al cambiar los datos, re-adivinamos el mapeo desde la primera fila.
  const mapaEfectivo: Campo[] = useMemo(() => {
    if (mapa.length === columnas) return mapa;
    if (filas.length === 0) return [];
    return filas[0].map((h, i) => (conHeader ? adivinar(h) : i === 0 ? "name" : i === 1 ? "phone" : "ignorar"));
  }, [mapa, columnas, filas, conHeader]);

  const datos = useMemo(() => {
    const cuerpo = conHeader ? filas.slice(1) : filas;
    return cuerpo
      .map((fila) => {
        const c: Record<string, string> = {};
        fila.forEach((celda, i) => {
          const campo = mapaEfectivo[i];
          if (campo && campo !== "ignorar" && celda) c[campo] = c[campo] ? `${c[campo]} ${celda}` : celda;
        });
        return c;
      })
      .filter((c) => c.name?.trim());
  }, [filas, mapaEfectivo, conHeader]);

  async function leerArchivo(files: FileList | null) {
    const f = files?.[0];
    if (!f) return;
    setTexto(await f.text());
    setMapa([]);
    setResultado(null);
  }

  async function importar() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/os/${slug}/contacts/importar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactos: datos.slice(0, 1000) }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "No se pudo importar");
      setResultado({ creados: data.creados, duplicados: data.duplicados });
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error de conexión");
    } finally {
      setBusy(false);
    }
  }

  if (resultado) {
    return (
      <Card className="p-6 text-center">
        <p className="text-4xl">📇</p>
        <h2 className="mt-2 text-xl font-semibold">
          {resultado.creados} contacto{resultado.creados === 1 ? "" : "s"} importado{resultado.creados === 1 ? "" : "s"}
        </h2>
        {resultado.duplicados > 0 ? (
          <p className="mt-1 text-sm text-muted-foreground">
            {resultado.duplicados} ya estaban y no se duplicaron.
          </p>
        ) : null}
        <div className="mt-4 flex justify-center gap-2">
          <ButtonLink href={`/os/${slug}/crm`}>Ver el CRM →</ButtonLink>
          <Button variant="ghost" onClick={() => { setTexto(""); setResultado(null); setMapa([]); }}>
            Importar más
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">1 · Pegá tu agenda</h2>
          <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>
            📄 Subir CSV
          </Button>
          <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={(e) => void leerArchivo(e.target.files)} />
        </div>
        <Textarea
          rows={7}
          value={texto}
          onChange={(e) => { setTexto(e.target.value); setMapa([]); setResultado(null); }}
          placeholder={"Copiá las columnas desde Excel o Google Sheets y pegalas acá.\nEjemplo:\nNombre\tTeléfono\nJuan Pérez\t2914001122"}
          className="font-mono text-xs"
        />
        {filas.length > 0 ? (
          <label className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={conHeader}
              onChange={(e) => setConHeader(e.target.checked)}
              className="h-4 w-4 accent-[var(--primary)]"
            />
            La primera fila son los títulos de las columnas
          </label>
        ) : null}
      </Card>

      {filas.length > 0 ? (
        <Card className="p-5">
          <h2 className="mb-3 font-semibold">2 · Decinos qué es cada columna</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  {Array.from({ length: columnas }, (_, i) => (
                    <th key={i} className="p-1.5">
                      <Select
                        value={mapaEfectivo[i]}
                        onChange={(e) => {
                          const nuevo = [...mapaEfectivo];
                          nuevo[i] = e.target.value as Campo;
                          setMapa(nuevo);
                        }}
                        className="h-8 text-xs"
                      >
                        {CAMPOS.map((c) => (
                          <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                      </Select>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(conHeader ? filas.slice(1, 6) : filas.slice(0, 5)).map((fila, i) => (
                  <tr key={i} className="border-t">
                    {Array.from({ length: columnas }, (_, j) => (
                      <td key={j} className="truncate px-2 py-1.5 text-muted-foreground">{fila[j] ?? ""}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
            <p className="text-sm">
              <span className="font-bold">{datos.length}</span> contacto{datos.length === 1 ? "" : "s"} listo
              {datos.length === 1 ? "" : "s"} para importar
              {datos.length > 1000 ? " (se importan los primeros 1000)" : ""}
            </p>
            <Button onClick={() => void importar()} disabled={busy || datos.length === 0}>
              {busy ? <Spinner /> : null} Importar al CRM
            </Button>
          </div>
          {error ? <div className="mt-3"><ErrorState message={error} /></div> : null}
        </Card>
      ) : null}
    </div>
  );
}
