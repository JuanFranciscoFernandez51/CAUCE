"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Movimiento de la web de Código Auto. Todo CSS + un IntersectionObserver
 * chico: sin librerías, sin lag en el celu y respetando reduced-motion.
 */
export function EstilosVidrios() {
  return (
    <style>{`
      /* Aparecer al scrollear */
      .ca-rev { opacity: 0; transform: translateY(26px);
        transition: opacity .7s cubic-bezier(.16,1,.3,1), transform .7s cubic-bezier(.16,1,.3,1);
        transition-delay: var(--ca-delay, 0ms); }
      .ca-rev.ca-on { opacity: 1; transform: none; }

      /* Cinta de promesas */
      @keyframes ca-cinta { from { transform: translateX(0); } to { transform: translateX(-50%); } }
      .ca-cinta { overflow: hidden; }
      .ca-cinta-tira { display: inline-flex; white-space: nowrap; width: max-content; animation: ca-cinta 34s linear infinite; }
      .ca-cinta:hover .ca-cinta-tira { animation-play-state: paused; }

      /* Foto del hero respirando */
      @keyframes ca-kb { from { transform: scale(1.04); } to { transform: scale(1.14); } }
      .ca-kb { animation: ca-kb 20s ease-in-out infinite alternate; }

      /* Destello que cruza el hero, como el reflejo en un parabrisas */
      @keyframes ca-brillo { 0% { transform: translateX(-120%) skewX(-18deg); } 55%, 100% { transform: translateX(320%) skewX(-18deg); } }
      .ca-brillo { position: absolute; top: 0; bottom: 0; width: 22%; pointer-events: none;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,.07), transparent);
        animation: ca-brillo 7s ease-in-out infinite; }

      /* Tarjetas de servicio */
      .ca-card { transition: transform .3s ease, box-shadow .3s ease; position: relative; }
      .ca-card::after { content: ""; position: absolute; left: 0; right: 0; bottom: 0; height: 3px;
        background: currentColor; transform: scaleX(0); transform-origin: left;
        transition: transform .35s cubic-bezier(.16,1,.3,1); }
      .ca-card:hover { transform: translateY(-6px); box-shadow: 0 18px 40px rgba(20,20,20,.12); }
      .ca-card:hover::after { transform: scaleX(1); }

      /* Fotos que zoomean */
      .ca-zoom { overflow: hidden; }
      .ca-zoom img { transition: transform .6s cubic-bezier(.16,1,.3,1); }
      .ca-zoom:hover img { transform: scale(1.06); }

      /* Pasos del seguro: la línea se dibuja */
      .ca-paso { position: relative; }
      .ca-paso::before { content: ""; position: absolute; left: 0; right: 0; top: 0; height: 1px;
        background: currentColor; opacity: .5; transform: scaleX(0); transform-origin: left;
        transition: transform .8s cubic-bezier(.16,1,.3,1); transition-delay: var(--ca-delay, 0ms); }
      .ca-on .ca-paso::before, .ca-paso.ca-on::before { transform: scaleX(1); }

      /* WhatsApp flotante con latido */
      @keyframes ca-latido { 0%, 100% { box-shadow: 0 0 0 0 rgba(37,211,102,.55); } 70% { box-shadow: 0 0 0 16px rgba(37,211,102,0); } }
      .ca-late { animation: ca-latido 2.8s ease-out infinite; }

      /* Botones */
      .ca-btn { transition: transform .2s ease, box-shadow .2s ease, opacity .2s ease; }
      .ca-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 24px rgba(20,20,20,.18); }
      .ca-btn:active { transform: scale(.98); }

      @media (prefers-reduced-motion: reduce) {
        .ca-rev { opacity: 1; transform: none; transition: none; }
        .ca-cinta-tira, .ca-kb, .ca-brillo, .ca-late { animation: none; }
        .ca-card, .ca-zoom img, .ca-btn { transition: none; }
        .ca-card:hover, .ca-btn:hover { transform: none; }
        .ca-paso::before { transform: scaleX(1); transition: none; }
      }
    `}</style>
  );
}

/** Envuelve una sección para que aparezca al entrar en pantalla. */
export function Aparece({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.classList.add("ca-on");
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.classList.add("ca-on");
          io.disconnect();
        }
      },
      { threshold: 0.14 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={`ca-rev ${className}`} style={{ "--ca-delay": `${delay}ms` } as React.CSSProperties}>
      {children}
    </div>
  );
}

/** Número que cuenta al entrar en pantalla ("25 años"). */
export function Contador({ hasta, sufijo = "", className, style }: { hasta: number; sufijo?: string; className?: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [n, setN] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setN(hasta);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        const t0 = performance.now();
        const dur = 1100;
        const tick = (t: number) => {
          const p = Math.min((t - t0) / dur, 1);
          setN(Math.round(hasta * (1 - Math.pow(1 - p, 3))));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.5 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasta]);

  return (
    <span ref={ref} className={className} style={style}>
      {n}
      {sufijo}
    </span>
  );
}
