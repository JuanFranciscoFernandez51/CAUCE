"use client";

/**
 * Motion del rediseño "Menta" de la web pública:
 * - <Reveal>: fade + translate-y al entrar en viewport, con delay escalonable.
 * - <Parallax>: elementos que bajan a distinta velocidad (sutil, ±30-60px).
 * - <StepsFlow>: pasos con línea vertical que se va dibujando con el scroll
 *   y paso activo que se ilumina cuando la línea lo alcanza.
 * Sin librerías: IntersectionObserver + rAF. Respeta prefers-reduced-motion.
 */

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

function reducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

// ── Reveal ───────────────────────────────────────────────
export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  /** ms — para escalonar items de una misma sección (80-120ms entre sí). */
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reducedMotion()) {
      el.classList.add("is-visible");
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal ${className}`}
      style={{ "--reveal-delay": `${delay}ms` } as CSSProperties}
    >
      {children}
    </div>
  );
}

// ── Parallax ─────────────────────────────────────────────
export function Parallax({
  children,
  amount = 40,
  className = "",
}: {
  children: ReactNode;
  /** px de desplazamiento máximo. Positivo = queda (baja más lento); negativo = se adelanta. */
  amount?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || reducedMotion()) return;
    let raf = 0;

    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      // Progreso del centro del elemento respecto del centro del viewport: -1..1
      const p = (r.top + r.height / 2 - vh / 2) / (vh / 2);
      const lim = Math.abs(amount);
      const y = Math.max(-lim, Math.min(lim, -p * amount));
      el.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0)`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [amount]);

  return (
    <div ref={ref} className={`parallax will-change-transform ${className}`}>
      {children}
    </div>
  );
}

// ── StepsFlow: "Cómo funciona" con línea que se dibuja ───
export type Paso = { n: number; titulo: string; detalle: string };

export function StepsFlow({ pasos }: { pasos: Paso[] }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const [active, setActive] = useState(-1);

  useEffect(() => {
    const wrap = wrapRef.current;
    const line = lineRef.current;
    if (!wrap || !line) return;

    if (reducedMotion()) {
      line.style.height = "100%";
      setActive(pasos.length - 1);
      return;
    }

    let raf = 0;
    const update = () => {
      raf = 0;
      const r = wrap.getBoundingClientRect();
      // Punto de lectura: 62% del alto del viewport.
      const focal = window.innerHeight * 0.62;
      const px = Math.max(0, Math.min(r.height, focal - r.top));
      line.style.height = `${px.toFixed(0)}px`;
      let a = -1;
      itemRefs.current.forEach((it, i) => {
        if (it && it.offsetTop + 20 <= px) a = i;
      });
      setActive((prev) => (prev === a ? prev : a));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [pasos.length]);

  return (
    <div ref={wrapRef} className="relative">
      {/* Línea gris de fondo + línea azul que se dibuja con el scroll */}
      <div
        aria-hidden
        className="absolute bottom-4 left-[27px] top-2 w-px bg-border"
      />
      <div
        aria-hidden
        ref={lineRef}
        className="absolute left-[27px] top-2 w-px bg-primary"
        style={{ height: 0, maxHeight: "calc(100% - 1.5rem)" }}
      />
      <ol className="relative space-y-12 sm:space-y-16">
        {pasos.map((p, i) => {
          const on = i <= active;
          return (
            <li
              key={p.n}
              ref={(el) => {
                itemRefs.current[i] = el;
              }}
              className="relative pl-[84px]"
            >
              <span
                className={`absolute left-0 top-0 flex h-14 w-14 items-center justify-center rounded-2xl font-display text-lg font-medium transition-all duration-500 ${
                  on
                    ? "bg-primary text-primary-foreground shadow-[0_14px_34px_-12px_rgba(46,107,255,0.65)]"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {p.n}
              </span>
              <p
                className={`text-xs font-semibold uppercase tracking-[0.16em] transition-colors duration-500 ${
                  on ? "text-primary" : "text-muted-foreground"
                }`}
              >
                Paso {p.n}
              </p>
              <h3 className="mt-1.5 font-display text-2xl font-medium tracking-tight sm:text-[28px]">
                {p.titulo}
              </h3>
              <p className="mt-2 max-w-md text-[15px] leading-relaxed text-muted-foreground">
                {p.detalle}
              </p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
