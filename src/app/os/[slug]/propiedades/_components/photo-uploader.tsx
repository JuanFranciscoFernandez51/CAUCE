"use client";

import { useRef, useState } from "react";
import { Button, Spinner } from "@/components/ui";

/**
 * Subida múltiple de fotos a Cloudinary vía /api/os/[slug]/listings/upload.
 * Reordenable (subir/bajar), borrable. La primera es la portada.
 * Si !storageAvailable, el padre pasa storageAvailable=false y mostramos nota.
 */
export function PhotoUploader({
  slug,
  listingId,
  photos,
  onChange,
  storageOk,
}: {
  slug: string;
  listingId?: string;
  photos: string[];
  onChange: (next: string[]) => void;
  storageOk: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      if (listingId) fd.set("listingId", listingId);
      Array.from(files).forEach((f) => fd.append("files", f));
      const res = await fetch(`/api/os/${slug}/listings/upload`, { method: "POST", body: fd });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "No se pudieron subir las fotos");
      onChange([...photos, ...(data.urls as string[])]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al subir");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= photos.length) return;
    const next = [...photos];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  }
  function removeAt(i: number) {
    onChange(photos.filter((_, idx) => idx !== i));
  }

  if (!storageOk) {
    return (
      <div className="rounded-md border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
        El storage de fotos (Cloudinary) todavía no está configurado. Podés guardar la propiedad sin
        fotos por ahora y sumarlas cuando Cauce active el storage.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {photos.length > 0 ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {photos.map((url, i) => (
            <div key={url} className="group relative overflow-hidden rounded-md border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="aspect-[4/3] w-full object-cover" />
              {i === 0 ? (
                <span className="absolute left-1 top-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                  Portada
                </span>
              ) : null}
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-black/55 px-1.5 py-1 text-white">
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    className="rounded px-1 text-xs disabled:opacity-30"
                    aria-label="Mover a la izquierda"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={() => move(i, 1)}
                    disabled={i === photos.length - 1}
                    className="rounded px-1 text-xs disabled:opacity-30"
                    aria-label="Mover a la derecha"
                  >
                    →
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => removeAt(i)}
                  className="rounded px-1 text-xs"
                  aria-label="Quitar foto"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? <Spinner /> : null}
          {uploading ? "Subiendo…" : "+ Agregar fotos"}
        </Button>
        <span className="text-xs text-muted-foreground">
          JPG/PNG hasta 10 MB. La primera es la portada.
        </span>
      </div>
    </div>
  );
}
