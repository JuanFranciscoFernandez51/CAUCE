"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Spinner } from "@/components/ui";

export type AdjuntoData = {
  id: string;
  url: string;
  name: string;
  mime: string | null;
};

const esImagen = (mime: string | null) => Boolean(mime?.startsWith("image/"));

/**
 * Archivos de una entidad (OT, venta, contacto): miniaturas para fotos,
 * link para documentos, subir con un clic y borrar. Reutilizable en todo el OS.
 */
export function Adjuntos({
  slug,
  refType,
  refId,
  titulo,
  ayuda,
  adjuntos: initial,
}: {
  slug: string;
  refType: "ot" | "venta" | "contact";
  refId: string;
  titulo: string;
  ayuda?: string;
  adjuntos: AdjuntoData[];
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [adjuntos, setAdjuntos] = useState(initial);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState("");

  async function subir(files: FileList | null) {
    if (!files || files.length === 0) return;
    setSubiendo(true);
    setError("");
    try {
      for (const file of Array.from(files)) {
        const form = new FormData();
        form.append("file", file);
        form.append("refType", refType);
        form.append("refId", refId);
        const res = await fetch(`/api/os/${slug}/adjuntos`, { method: "POST", body: form });
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.error ?? "No se pudo subir");
        setAdjuntos((as) => [...as, data.adjunto]);
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al subir");
    } finally {
      setSubiendo(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function borrar(a: AdjuntoData) {
    if (!confirm(`¿Borrar "${a.name}"?`)) return;
    const prev = adjuntos;
    setAdjuntos((as) => as.filter((x) => x.id !== a.id));
    const res = await fetch(`/api/os/${slug}/adjuntos?id=${a.id}`, { method: "DELETE" });
    if (!res.ok) setAdjuntos(prev);
    else router.refresh();
  }

  return (
    <Card className="p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-semibold">{titulo}</h2>
          {ayuda ? <p className="text-sm text-muted-foreground">{ayuda}</p> : null}
        </div>
        <Button size="sm" variant="secondary" disabled={subiendo} onClick={() => inputRef.current?.click()}>
          {subiendo ? <Spinner /> : null} 📎 Subir archivo
        </Button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
          className="hidden"
          onChange={(e) => void subir(e.target.files)}
        />
      </div>

      {error ? <p className="mb-2 text-sm text-destructive">{error}</p> : null}

      {adjuntos.length === 0 ? (
        <p className="rounded-md border border-dashed px-4 py-5 text-center text-sm text-muted-foreground">
          Sin archivos todavía. Fotos, PDFs o documentos — hasta 10 MB.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {adjuntos.map((a) => (
            <li key={a.id} className="group relative">
              <a href={a.url} target="_blank" rel="noopener noreferrer" className="block">
                {esImagen(a.mime) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={a.url}
                    alt={a.name}
                    className="h-24 w-full rounded-md border object-cover transition-opacity group-hover:opacity-90"
                  />
                ) : (
                  <span className="flex h-24 w-full flex-col items-center justify-center gap-1 rounded-md border bg-muted/40 px-2 text-center">
                    <span className="text-2xl" aria-hidden>📄</span>
                    <span className="line-clamp-2 break-all text-[11px] text-muted-foreground">{a.name}</span>
                  </span>
                )}
              </a>
              <button
                type="button"
                onClick={() => void borrar(a)}
                aria-label={`Borrar ${a.name}`}
                className="absolute right-1 top-1 hidden h-6 w-6 items-center justify-center rounded-full bg-black/60 text-xs text-white group-hover:flex"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
