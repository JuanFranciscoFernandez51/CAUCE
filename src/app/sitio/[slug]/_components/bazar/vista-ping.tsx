"use client";

import { useEffect } from "react";

/**
 * Al montar la página del producto, suma una visita (throttle simple por
 * sessionStorage: una vez por producto por sesión de pestaña).
 */
export function VistaPing({ slug, productoId }: { slug: string; productoId: string }) {
  useEffect(() => {
    const KEY = `bz-vista-${productoId}`;
    try {
      if (sessionStorage.getItem(KEY)) return;
      sessionStorage.setItem(KEY, "1");
    } catch {
      // sin sessionStorage: pingueamos igual
    }
    fetch(`/api/public/sitio/${slug}/vista`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productoId }),
    }).catch(() => {
      // best-effort: una visita perdida no es problema
    });
  }, [slug, productoId]);

  return null;
}
