"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** Botón del taller: el trabajo se hizo, la orden pasa a Colocado. */
export function MarcarColocada({ slug, id }: { slug: string; id: string }) {
  const router = useRouter();
  const [ocupado, setOcupado] = useState(false);

  async function marcar() {
    setOcupado(true);
    await fetch(`/api/os/${slug}/ordenes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado: "COLOCADO" }),
    });
    router.refresh();
  }

  return (
    <button
      onClick={marcar}
      disabled={ocupado}
      className="rounded-md bg-success/15 px-2.5 py-1 text-xs font-semibold text-success transition hover:opacity-80 disabled:opacity-50"
    >
      ✓ Colocado
    </button>
  );
}
