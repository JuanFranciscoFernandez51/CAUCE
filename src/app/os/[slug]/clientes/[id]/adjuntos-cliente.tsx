"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

/** Archivos del cliente: contratos, comprobantes, lo que haga falta. */
type Adj = { id: string; url: string; name: string; mime: string | null };

export function AdjuntosCliente({ slug, contactId, adjuntos }: { slug: string; contactId: string; adjuntos: Adj[] }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [estado, setEstado] = useState("");

  async function subir(files: FileList | null) {
    if (!files?.length) return;
    setEstado("Subiendo…");
    for (const f of Array.from(files)) {
      const fd = new FormData();
      fd.set("file", f);
      fd.set("refType", "contact");
      fd.set("refId", contactId);
      const r = await fetch(`/api/os/${slug}/adjuntos`, { method: "POST", body: fd });
      if (!r.ok) {
        const d = await r.json().catch(() => null);
        setEstado(d?.error ?? "No se pudo subir");
        return;
      }
    }
    setEstado("");
    router.refresh();
  }

  async function borrar(id: string) {
    await fetch(`/api/os/${slug}/adjuntos?id=${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div>
      <div className="space-y-1.5">
        {adjuntos.map((a) => (
          <div key={a.id} className="flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-sm">
            <span>{a.mime?.startsWith("image/") ? "🖼" : "📄"}</span>
            <a href={a.url} target="_blank" rel="noreferrer" className="flex-1 truncate underline-offset-2 transition hover:underline">
              {a.name}
            </a>
            <button onClick={() => borrar(a.id)} className="text-muted-foreground transition hover:text-destructive">✕</button>
          </div>
        ))}
        {!adjuntos.length ? <p className="py-2 text-sm text-muted-foreground">Sin archivos todavía.</p> : null}
      </div>
      <input ref={inputRef} type="file" multiple className="hidden" onChange={(e) => void subir(e.target.files)} />
      <button
        onClick={() => inputRef.current?.click()}
        className="mt-3 rounded-lg border border-border px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] transition hover:bg-muted"
      >
        + Adjuntar archivo
      </button>
      {estado ? <span className="ml-3 text-sm text-muted-foreground">{estado}</span> : null}
    </div>
  );
}
