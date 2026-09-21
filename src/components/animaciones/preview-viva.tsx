"use client";

import { Component, useEffect, useRef, useState, type ReactNode } from "react";

/** Si una demo revienta (p. ej. el navegador no le da contexto WebGL), cae sola: no tira la página. */
class Airbag extends Component<{ children: ReactNode }, { fallo: boolean }> {
  state = { fallo: false };
  static getDerivedStateFromError() {
    return { fallo: true };
  }
  componentDidCatch() {}
  render() {
    if (this.state.fallo) {
      return <p className="text-center text-xs text-white/60">Esta demo no pudo arrancar en este navegador.</p>;
    }
    return this.props.children;
  }
}

/**
 * Monta la vista previa solo cuando entra en pantalla y la desmonta cuando se
 * aleja: con 200+ animaciones vivas a la vez ningún teléfono sobrevive.
 * Las pesadas (WebGL) en el celu muestran un cartel en vez de la demo, y en
 * desktop se montan recién cuando están en pantalla (el navegador tiene un
 * tope de contextos WebGL simultáneos).
 */
export function PreviewViva({ children, pesada, alto = 260 }: { children: ReactNode; pesada?: boolean; alto?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [celu, setCelu] = useState(false);

  useEffect(() => {
    setCelu(window.matchMedia("(max-width: 767px)").matches);
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), {
      rootMargin: pesada ? "0px" : "240px 0px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, [pesada]);

  return (
    <div ref={ref} className="flex items-center justify-center p-4" style={{ backgroundColor: "#0b0b0f", minHeight: alto + 32 }}>
      {pesada && celu ? (
        <p className="text-center text-xs text-white/60">Demo 3D · miralo desde una compu</p>
      ) : visible ? (
        <Airbag>{children}</Airbag>
      ) : null}
    </div>
  );
}
