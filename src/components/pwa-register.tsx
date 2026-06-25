"use client";

import { useEffect } from "react";

/**
 * Registra el service worker (/sw.js) para que Cauce sea una PWA instalable y
 * offline-friendly. Client-only y defensivo: solo corre si existe
 * navigator.serviceWorker, y solo en producción (en dev molestaría con el HMR).
 */
export function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Silencioso: que falle el SW nunca debe romper la app.
      });
    };

    // Esperamos al load para no competir con el render inicial.
    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register, { once: true });
      return () => window.removeEventListener("load", register);
    }
  }, []);

  return null;
}
