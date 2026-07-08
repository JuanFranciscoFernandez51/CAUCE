"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";

/** Pausar / reactivar un proceso (solo el dueño). */
export function ProcesoToggle({
  slug,
  procesoId,
  activo,
}: {
  slug: string;
  procesoId: string;
  activo: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    try {
      const res = await fetch(`/api/os/${slug}/procesos/${procesoId}/toggle`, { method: "POST" });
      if (res.ok) router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button variant="ghost" size="sm" onClick={toggle} disabled={busy}>
      {activo ? "Pausar" : "Reactivar"}
    </Button>
  );
}
