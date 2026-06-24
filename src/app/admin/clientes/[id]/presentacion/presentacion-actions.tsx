"use client";

import { useRouter } from "next/navigation";

/**
 * Barra de acciones flotante de la presentación.
 * Se oculta al imprimir (print:hidden) para que el PDF salga limpio.
 */
export function PresentacionActions({ accent }: { accent: string }) {
  const router = useRouter();
  return (
    <div className="fixed bottom-5 right-5 z-50 flex gap-2 print:hidden">
      <button
        type="button"
        onClick={() => router.back()}
        className="rounded-full border border-black/10 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-lg transition hover:bg-gray-50"
      >
        ← Volver
      </button>
      <button
        type="button"
        onClick={() => window.print()}
        style={{ backgroundColor: accent }}
        className="rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:opacity-90"
      >
        🖨️ Descargar PDF
      </button>
    </div>
  );
}
