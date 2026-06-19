"use client";

import { useState } from "react";

/** Galería de fotos con foto principal + miniaturas. */
export function Gallery({ photos, title }: { photos: string[]; title: string }) {
  const [active, setActive] = useState(0);

  if (photos.length === 0) {
    return (
      <div className="flex aspect-[16/10] w-full items-center justify-center rounded-xl border bg-muted text-5xl text-muted-foreground">
        🏠
      </div>
    );
  }

  const main = photos[Math.min(active, photos.length - 1)];

  return (
    <div className="space-y-2">
      <div className="overflow-hidden rounded-xl border bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={main} alt={title} className="aspect-[16/10] w-full object-cover" />
      </div>
      {photos.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {photos.map((url, i) => (
            <button
              key={url}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Ver foto ${i + 1}`}
              className={`h-16 w-24 shrink-0 overflow-hidden rounded-md border-2 transition-colors ${
                i === active ? "border-primary" : "border-transparent opacity-80 hover:opacity-100"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
