"use client";

/**
 * Registro de la biblioteca de animaciones de Cauce.
 * Cada entrada trae: metadata, una vista previa viva y el snippet de uso
 * para copiar. Cuando llegue un prompt nuevo, se porta el componente a
 * esta carpeta y se suma una entrada acá — el admin y la web pública
 * lo levantan solos.
 */
import type { ReactNode } from "react";
import LineSidebar from "./LineSidebar";

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
};

export const ANIMACIONES: Animacion[] = [
  {
    id: "line-sidebar",
    nombre: "Line Sidebar",
    origen: "React Bits",
    categoria: "Navegación",
    descripcion:
      "Menú lateral cuyos ítems se corren y se tiñen del color de acento según la cercanía del mouse, con líneas marcadoras que crecen. Movimiento por rAF, sin librerías.",
    argumento: "Una navegación que reacciona al mouse: el sitio se siente vivo apenas entrás, sin marear.",
    ruta: "src/components/animaciones/LineSidebar.tsx (+ .css)",
    uso: `import LineSidebar from "@/components/animaciones/LineSidebar";

<LineSidebar
  items={["Inicio", "Servicios", "Trabajos", "Contacto"]}
  accentColor="#22c55e"   // color de acento del tenant
  textColor="#c4c4c4"
  markerColor="#6c6c6c"
  showIndex
  showMarker
  proximityRadius={100}
  maxShift={30}
  falloff="smooth"
  onItemClick={(i, label) => console.log(i, label)}
/>`,
    Preview: () => (
      <LineSidebar
        items={["Inicio", "Servicios", "Trabajos", "Contacto", "Nosotros"]}
        accentColor="#22c55e"
        proximityRadius={90}
        maxShift={24}
        markerLength={44}
        itemGap={14}
        fontSize={0.95}
        defaultActive={0}
      />
    ),
  },
];
