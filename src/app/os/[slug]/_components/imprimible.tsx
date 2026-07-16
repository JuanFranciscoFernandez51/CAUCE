import type { ReactNode } from "react";
import { PrintButton } from "./print-button";

/**
 * Marco de documento imprimible del OS: hoja A4 con la marca del tenant,
 * ocultando todo el chrome del sistema al imprimir.
 */
export function Imprimible({
  negocio,
  primary,
  titulo,
  subtitulo,
  children,
}: {
  negocio: string;
  primary: string;
  titulo: string;
  subtitulo?: string;
  children: ReactNode;
}) {
  const fecha = new Date().toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Argentina/Buenos_Aires",
  });

  return (
    <div className="imprimible mx-auto max-w-2xl">
      <style>{`
        @media print {
          @page { size: A4; margin: 14mm; }
          body * { visibility: hidden !important; }
          .imprimible, .imprimible * { visibility: visible !important; }
          .imprimible { position: absolute !important; inset: 0 !important; max-width: none !important; }
          .no-print { display: none !important; }
          .hoja { border: none !important; box-shadow: none !important; }
        }
      `}</style>

      <div className="hoja rounded-lg border bg-white p-8 text-gray-900 shadow-sm">
        <header className="flex items-start justify-between gap-4 border-b pb-4" style={{ borderColor: primary }}>
          <div>
            <p className="text-xl font-bold" style={{ color: primary }}>
              {negocio}
            </p>
            <p className="text-sm text-gray-500">{fecha}</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold">{titulo}</p>
            {subtitulo ? <p className="text-sm text-gray-500">{subtitulo}</p> : null}
          </div>
        </header>
        <div className="pt-5">{children}</div>
        <footer className="mt-10 border-t pt-3 text-center text-[11px] text-gray-400">
          Documento generado por el sistema de {negocio} · Powered by Cauce
        </footer>
      </div>
      <PrintButton />
    </div>
  );
}
