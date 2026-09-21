"use client";

import { Component, createContext, useEffect, useRef, useState, type ReactNode } from "react";

/** Si una demo revienta (p. ej. el navegador no le da contexto WebGL), cae sola: no tira la página. */
class Airbag extends Component<{ children: ReactNode }, { fallo: boolean }> {
  state = { fallo: false };
  static getDerivedStateFromError() {
    return { fallo: true };
  }
  componentDidCatch() {}
  render() {
    if (this.state.fallo) {
      return <p className="px-4 text-center text-xs text-white/60">Esta demo no pudo arrancar en este navegador.</p>;
    }
    return this.props.children;
  }
}

/** Tamaño "de diseño" de las demos: se dibujan así y se escalan a la tarjeta. */
export const BASE_W = 560;
export const BASE_H = 292;

/**
 * Escala con la que se está mostrando la demo. La lee <Caja>: los fondos que
 * llenan la caja (WebGL) deshacen la escala y se dibujan al tamaño real de la
 * tarjeta, porque miden el canvas con getBoundingClientRect y si no se
 * achicarían dos veces.
 */
export const EscalaPreview = createContext(1);

/**
 * Vista previa de catálogo: la demo se arma en su tamaño original (560×292) y
 * se achica a lo que mida la tarjeta, así en una grilla de 4 se ve igual que
 * grande. Se monta solo en pantalla, con airbag, y las 3D en el celu muestran
 * un cartel (el GPU del teléfono no aguanta).
 */
export function PreviewViva({ children, pesada }: { children: ReactNode; pesada?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [celu, setCelu] = useState(false);
  const [escala, setEscala] = useState(0.5);

  useEffect(() => {
    setCelu(window.matchMedia("(max-width: 767px)").matches);
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), {
      rootMargin: pesada ? "0px" : "200px 0px",
    });
    io.observe(el);
    const ro = new ResizeObserver(([e]) => setEscala(e.contentRect.width / BASE_W));
    ro.observe(el);
    return () => {
      io.disconnect();
      ro.disconnect();
    };
  }, [pesada]);

  return (
    <div
      ref={ref}
      className="relative w-full overflow-hidden"
      style={{ backgroundColor: "#0b0b0f", aspectRatio: `${BASE_W} / ${BASE_H}` }}
    >
      {pesada && celu ? (
        <p className="absolute inset-0 flex items-center justify-center px-4 text-center text-xs text-white/60">
          Demo 3D · miralo desde una compu
        </p>
      ) : visible ? (
        <div
          className="absolute left-0 top-0 flex items-center justify-center p-4"
          style={{ width: BASE_W, height: BASE_H, transform: `scale(${escala})`, transformOrigin: "top left" }}
        >
          <EscalaPreview.Provider value={escala}>
            <Airbag>{children}</Airbag>
          </EscalaPreview.Provider>
        </div>
      ) : null}
    </div>
  );
}
