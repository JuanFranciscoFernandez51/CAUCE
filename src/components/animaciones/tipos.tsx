"use client";

import { useContext, type ReactNode } from "react";
import { EscalaPreview } from "./preview-viva";

/** Una animación de la biblioteca: metadata, vista previa viva y snippet de uso. */
export type Animacion = {
  id: string;
  nombre: string;
  origen: string;
  categoria: string;
  descripcion: string;
  /** Cómo se la vendemos al cliente, en una frase. */
  argumento: string;
  /** Dónde vive el código fuente en el repo. */
  ruta: string;
  /** Snippet de uso listo para pegar en un proyecto. */
  uso: string;
  /** Vista previa viva, ya configurada para lucirse en un recuadro oscuro. */
  Preview: () => ReactNode;
  /** true = usa WebGL/canvas pesado: en el celu se muestra un cartel en vez de la demo. */
  pesada?: boolean;
};

/** Recuadro estándar de las vistas previas: ocupa el ancho y una altura fija. */
export function Caja({ children, alto = 260, centrado = true }: { children: ReactNode; alto?: number; centrado?: boolean }) {
  const escala = useContext(EscalaPreview);
  // Fondos que llenan la caja: tamaño real de pantalla, deshaciendo la escala del catálogo.
  if (!centrado && escala !== 1) {
    return (
      <div style={{ width: "100%", height: alto, position: "relative" }}>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: `${100 * escala}%`,
            height: alto * escala,
            transform: `scale(${1 / escala})`,
            transformOrigin: "top left",
            overflow: "hidden",
            borderRadius: 12 * escala,
          }}
        >
          {children}
        </div>
      </div>
    );
  }
  return (
    <div
      className={centrado ? "flex items-center justify-center" : ""}
      style={{ position: "relative", width: "100%", height: alto, overflow: "hidden", borderRadius: 12 }}
    >
      {children}
    </div>
  );
}
